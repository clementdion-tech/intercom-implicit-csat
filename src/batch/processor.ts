import pLimit from 'p-limit';
import { getConversation, listConversations, normalizeMessages, extractExplicitCsat } from '../intercom/client';
import { analyzeConversation } from '../analyzer/claude';
import { writeConversationAttributes } from '../intercom/attributes';
import { applyTags } from '../intercom/tags';
import { sendAlerts } from '../alerts/slack';
import { prisma } from '../db/prisma';
import { broadcast } from '../websocket/live-feed';

export interface BatchOptions {
  limit?: number;
  conversationId?: string;
  dryRun?: boolean;
  concurrency?: number;
  skipRecentDays?: number;
  fromDate?: Date;
}

export interface BatchSummary {
  processed: number;
  failed: number;
  durationMs: number;
  avgDurationMs: number;
  distribution: Record<string, number>;
  avgScorePct: number;
  converted: number;
  atRisk: number;
  languages: Record<string, number>;
  passiveAggressiveCount: number;
  burstContactCount: number;
}

export async function runBatch(options: BatchOptions = {}): Promise<BatchSummary> {
  const start = Date.now();
  const concurrency = options.concurrency ?? parseInt(process.env.BATCH_CONCURRENCY ?? '10');
  const limit = pLimit(concurrency);

  let conversationIds: string[] = [];

  if (options.conversationId) {
    conversationIds = [options.conversationId];
  } else {
    const perPage = 50;
    const maxConversations = options.limit ?? 500;
    let fetched = 0;

    const fromTs = options.fromDate ? options.fromDate.getTime() / 1000 : null;

    // Fetch open conversations first, then closed
    for (const state of ['open', 'closed'] as const) {
      let page = 1;
      let hitDateBoundary = false;
      while (fetched < maxConversations && !hitDateBoundary) {
        const { data, pages } = await listConversations({ page, per_page: perPage, state, order: 'desc', sort: 'updated_at' });
        if (data.length === 0) break;

        if (fromTs) {
          const filtered = data.filter(c => c.updated_at >= fromTs);
          conversationIds.push(...filtered.map(c => c.id));
          fetched += filtered.length;
          // If this page had conversations older than fromDate, stop paginating
          if (data.some(c => c.updated_at < fromTs)) hitDateBoundary = true;
        } else {
          conversationIds.push(...data.map(c => c.id));
          fetched += data.length;
        }

        if (page >= pages.total_pages) break;
        page++;
      }
      if (fetched >= maxConversations) break;
    }

    conversationIds = conversationIds.slice(0, maxConversations);
  }

  const summary: BatchSummary = {
    processed: 0,
    failed: 0,
    durationMs: 0,
    avgDurationMs: 0,
    distribution: { very_dissatisfied: 0, dissatisfied: 0, neutral: 0, satisfied: 0, very_satisfied: 0 },
    avgScorePct: 0,
    converted: 0,
    atRisk: 0,
    languages: {},
    passiveAggressiveCount: 0,
    burstContactCount: 0,
  };

  let totalScore = 0;

  const tasks = conversationIds.map(id =>
    limit(async () => {
      const convStart = Date.now();
      try {
        const conversation = await getConversation(id);

        if (options.skipRecentDays && options.skipRecentDays > 0) {
          const existing = await prisma.conversation.findUnique({
            where: { intercomId: id },
            select: { analyzedAt: true },
          });
          const cutoff = new Date(Date.now() - options.skipRecentDays * 24 * 60 * 60 * 1000);
          if (existing?.analyzedAt && existing.analyzedAt > cutoff) {
            return; // already fresh, skip
          }
        }

        const messages = normalizeMessages(conversation);

        if (messages.filter(m => m.role === 'user').length === 0) return;

        const explicitCsatPct = extractExplicitCsat(conversation);

        const scored = await analyzeConversation({
          intercomId: id,
          messages: messages.map(m => ({ role: m.role, body: m.body, createdAt: m.createdAt })),
          explicitCsatScore: explicitCsatPct,
          agentId: conversation.assignee?.id,
          teamId: conversation.team_assignee_id?.toString(),
        });

        if (!options.dryRun) {
          // Persist to DB
          await prisma.conversation.upsert({
            where: { intercomId: id },
            create: {
              intercomId: id,
              language: scored.language,
              languagesAll: scored.languagesAll.join(','),
              scorePct: scored.scorePct,
              label: scored.label,
              emoji: scored.emoji,
              communicationStyle: scored.communicationStyle,
              arc: scored.arc,
              conversion: scored.conversion,
              conversionDeltaPct: scored.conversionDeltaPct,
              scoreStartPct: scored.scoreStartPct,
              scoreEndPct: scored.scoreEndPct,
              churnRisk: scored.churnRisk,
              churnSignals: scored.churnSignals.join(','),
              burstCount: scored.burstCount,
              confidence: scored.confidence,
              culturalCalibration: scored.culturalCalibration,
              keySignalSummary: scored.keySignalSummary,
              explicitCsatPct,
              implicitCsatGap: explicitCsatPct === null,
              agentEmpathyScore: scored.agentEmpathyScore,
              agentEmpathyLabel: scored.agentEmpathyLabel,
              agentId: conversation.assignee?.id,
              teamId: conversation.team_assignee_id?.toString(),
              analyzedAt: new Date(),
            },
            update: {
              scorePct: scored.scorePct,
              label: scored.label,
              emoji: scored.emoji,
              communicationStyle: scored.communicationStyle,
              arc: scored.arc,
              conversion: scored.conversion,
              conversionDeltaPct: scored.conversionDeltaPct,
              scoreStartPct: scored.scoreStartPct,
              scoreEndPct: scored.scoreEndPct,
              churnRisk: scored.churnRisk,
              churnSignals: scored.churnSignals.join(','),
              burstCount: scored.burstCount,
              confidence: scored.confidence,
              culturalCalibration: scored.culturalCalibration,
              keySignalSummary: scored.keySignalSummary,
              explicitCsatPct,
              implicitCsatGap: explicitCsatPct === null,
              agentEmpathyScore: scored.agentEmpathyScore,
              agentEmpathyLabel: scored.agentEmpathyLabel,
              analyzedAt: new Date(),
            },
          });

          // Re-insert message scores
          const conv = await prisma.conversation.findUnique({ where: { intercomId: id }, select: { id: true } });
          if (conv && scored.messageScores.length > 0) {
            await prisma.messageScore.deleteMany({ where: { conversationId: conv.id } });
            await prisma.messageScore.createMany({
              data: scored.messageScores.map(ms => ({
                conversationId: conv.id,
                messageIndex: ms.messageIndex,
                role: ms.role,
                language: ms.language,
                scorePct: ms.scorePct,
                confidence: ms.confidence,
                signalsJson: ms.signals,
              })),
            });
          }

          // Write attributes + tags + alerts (non-blocking)
          writeConversationAttributes(id, scored).catch(console.error);
          applyTags(id, scored).catch(console.error);
          sendAlerts(id, scored).catch(console.error);

          // Broadcast to live dashboard
          broadcast({
            intercomId: id,
            scorePct: scored.scorePct,
            label: scored.label,
            emoji: scored.emoji,
            language: scored.language,
            style: scored.communicationStyle,
            churnRisk: scored.churnRisk,
            arc: scored.arc,
            keySignal: scored.keySignalSummary,
            analyzedAt: new Date().toISOString(),
          });
        }

        // Accumulate stats
        summary.processed++;
        totalScore += scored.scorePct;
        summary.distribution[scored.label] = (summary.distribution[scored.label] ?? 0) + 1;
        if (scored.conversion === 'converted') summary.converted++;
        if (scored.conversion === 'at_risk') summary.atRisk++;
        summary.languages[scored.language] = (summary.languages[scored.language] ?? 0) + 1;
        if (scored.communicationStyle === 'passive_aggressive') summary.passiveAggressiveCount++;
        if (scored.burstCount > 0) summary.burstContactCount++;

        const convDuration = Date.now() - convStart;
        console.log(`  ✓ ${id} — ${scored.scorePct}% ${scored.emoji} (${convDuration}ms)`);
      } catch (err) {
        summary.failed++;
        console.error(`  ✗ ${id} — ${err instanceof Error ? err.message : err}`);
      }
    })
  );

  await Promise.all(tasks);

  summary.durationMs = Date.now() - start;
  summary.avgDurationMs = summary.processed > 0 ? Math.round(summary.durationMs / summary.processed) : 0;
  summary.avgScorePct = summary.processed > 0 ? Math.round(totalScore / summary.processed) : 0;

  return summary;
}

export function printBatchSummary(summary: BatchSummary, dryRun: boolean): void {
  const total = summary.processed + summary.failed;
  const d = summary.distribution;
  const langList = Object.entries(summary.languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([lang, count]) => `${lang}(${count})`)
    .join(' ');

  console.log('\n' + '─'.repeat(50));
  if (dryRun) console.log('🔍 DRY RUN — no data was written\n');
  console.log(`✅ Processed: ${summary.processed} conversations (${summary.failed} failed)`);
  console.log(`📊 Very Dissatisfied: ${pct(d.very_dissatisfied, total)}% | Dissatisfied: ${pct(d.dissatisfied, total)}% | Neutral: ${pct(d.neutral, total)}% | Satisfied: ${pct(d.satisfied, total)}% | Very Satisfied: ${pct(d.very_satisfied, total)}%`);
  console.log(`📈 Avg score: ${summary.avgScorePct}%`);
  console.log(`🔄 Converted (score improved ≥20%): ${summary.converted}`);
  console.log(`⚠️  At risk (score dropped ≥20%): ${summary.atRisk}`);
  console.log(`🌍 Languages: ${langList}`);
  console.log(`😤 Passive-aggressive: ${summary.passiveAggressiveCount} conversations`);
  console.log(`⚡ Burst contacts: ${summary.burstContactCount} conversations`);
  console.log(`⏱️  Avg: ${(summary.avgDurationMs / 1000).toFixed(1)}s/conversation`);
  console.log('─'.repeat(50) + '\n');
}

function pct(count: number, total: number): string {
  if (total === 0) return '0';
  return Math.round((count / total) * 100).toString();
}
