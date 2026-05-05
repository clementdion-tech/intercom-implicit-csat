import cron from 'node-cron';
import { runBatch, printBatchSummary } from './processor';
import { prisma } from '../db/prisma';
import { alertDailyScoreDrop, alertPassiveAggressiveSpike } from '../alerts/slack';

let batchRunning = false;

export function startScheduler(): void {
  const schedule = process.env.SCHEDULE_CRON ?? '*/30 * * * *';

  // Batch processing every 30 minutes
  cron.schedule(schedule, async () => {
    if (batchRunning) {
      console.log('[Scheduler] Batch already running, skipping');
      return;
    }

    batchRunning = true;
    console.log(`[Scheduler] Starting batch run at ${new Date().toISOString()}`);

    try {
      const summary = await runBatch({ limit: 200 });
      printBatchSummary(summary, false);
    } catch (err) {
      console.error('[Scheduler] Batch run failed:', err);
    } finally {
      batchRunning = false;
    }
  });

  // Daily snapshot at midnight UTC
  cron.schedule('0 0 * * *', async () => {
    console.log('[Scheduler] Running daily snapshot...');
    await takeDailySnapshot();
  });

  console.log(`[Scheduler] Batch cron: "${schedule}" | Daily snapshot: midnight UTC`);
}

async function takeDailySnapshot(): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const conversations = await prisma.conversation.findMany({
      where: { analyzedAt: { gte: yesterday, lt: today }, scorePct: { not: null } },
      select: {
        scorePct: true,
        label: true,
        communicationStyle: true,
        language: true,
        conversion: true,
        churnRisk: true,
        explicitCsatPct: true,
      },
    });

    if (conversations.length === 0) {
      console.log('[Scheduler] No conversations for snapshot');
      return;
    }

    const totalScore = conversations.reduce((s, c) => s + c.scorePct!, 0);
    const avgScore = totalScore / conversations.length;

    const distribution = conversations.reduce<Record<string, number>>((acc, c) => {
      acc[c.label!] = (acc[c.label!] ?? 0) + 1;
      return acc;
    }, {});

    const styleBreakdown = conversations.reduce<Record<string, number>>((acc, c) => {
      if (c.communicationStyle) acc[c.communicationStyle] = (acc[c.communicationStyle] ?? 0) + 1;
      return acc;
    }, {});

    const languageBreakdown = conversations.reduce<Record<string, number>>((acc, c) => {
      if (c.language) acc[c.language] = (acc[c.language] ?? 0) + 1;
      return acc;
    }, {});

    const conversionCount = conversations.filter(c => c.conversion === 'converted').length;
    const churnCount = conversations.filter(c => c.churnRisk === 'high').length;

    // Explicit/implicit agreement
    const withBoth = conversations.filter(c => c.explicitCsatPct !== null);
    const agreementPct =
      withBoth.length > 0
        ? (withBoth.filter(c => {
            const s = c.scorePct!;
            const e = c.explicitCsatPct!;
            return Math.abs(s - e) <= 15;
          }).length /
            withBoth.length) *
          100
        : null;

    await prisma.dailySnapshot.upsert({
      where: { date: yesterday },
      create: {
        date: yesterday,
        avgScorePct: avgScore,
        totalConversations: conversations.length,
        distributionJson: distribution,
        styleBreakdownJson: styleBreakdown,
        languageBreakdownJson: languageBreakdown,
        conversionCount,
        churnCount,
        explicitImplicitAgreementPct: agreementPct,
      },
      update: {
        avgScorePct: avgScore,
        totalConversations: conversations.length,
        distributionJson: distribution,
        styleBreakdownJson: styleBreakdown,
        languageBreakdownJson: languageBreakdown,
        conversionCount,
        churnCount,
        explicitImplicitAgreementPct: agreementPct,
      },
    });

    // Check for alerts
    const previousSnapshot = await prisma.dailySnapshot.findFirst({
      where: { date: { lt: yesterday } },
      orderBy: { date: 'desc' },
    });

    if (previousSnapshot) {
      await alertDailyScoreDrop(avgScore, previousSnapshot.avgScorePct);
    }

    const paCount = styleBreakdown['passive_aggressive'] ?? 0;
    await alertPassiveAggressiveSpike(paCount, conversations.length);

    console.log(`[Scheduler] Daily snapshot saved: ${conversations.length} conversations, avg ${avgScore.toFixed(1)}%`);
  } catch (err) {
    console.error('[Scheduler] Daily snapshot failed:', err);
  }
}
