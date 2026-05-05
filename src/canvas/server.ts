import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../db/prisma';
import { buildCanvas } from './builder';
import { getConversation, normalizeMessages, extractExplicitCsat } from '../intercom/client';
import { analyzeConversation } from '../analyzer/claude';
import { writeConversationAttributes } from '../intercom/attributes';
import { applyTags } from '../intercom/tags';
import { broadcast } from '../websocket/live-feed';

export const canvasRouter = Router();

function verifyCanvasSignature(req: Request): boolean {
  const secret = process.env.CANVAS_WEBHOOK_SECRET;
  if (!secret) return true; // Skip verification in development

  const signature = req.headers['x-body-signature'] as string;
  if (!signature) return false;

  const hmac = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hmac));
}

// POST /canvas/initialize — Intercom calls this when agent opens sidebar
canvasRouter.post('/initialize', async (req: Request, res: Response) => {
  if (!verifyCanvasSignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const conversationId: string = req.body?.conversation_id ?? req.body?.conversation?.id;

  if (!conversationId) {
    return res.json(buildCanvas(null, false));
  }

  try {
    const existing = await prisma.conversation.findUnique({
      where: { intercomId: conversationId },
    });

    if (existing && existing.scorePct !== null) {
      const scored = {
        scorePct: existing.scorePct!,
        label: existing.label!,
        emoji: existing.emoji!,
        language: existing.language ?? 'en',
        languagesAll: existing.languagesAll?.split(',') ?? [],
        codeSwitchingDetected: false,
        codeSwitchingSignal: null,
        communicationStyle: existing.communicationStyle ?? 'neutral_transactional',
        communicationStyleSecondary: null,
        styleConfidence: existing.confidence ?? 0.7,
        keyEvidence: '',
        arc: existing.arc ?? 'stable_neutral',
        conversion: existing.conversion ?? 'stable',
        conversionDeltaPct: existing.conversionDeltaPct ?? 0,
        scoreStartPct: existing.scoreStartPct ?? existing.scorePct!,
        scoreEndPct: existing.scoreEndPct ?? existing.scorePct!,
        culturalCalibration: existing.culturalCalibration ?? '',
        keySignalSummary: existing.keySignalSummary ?? '',
        churnRisk: existing.churnRisk ?? 'none',
        churnSignals: (existing.churnSignals?.split(',') ?? []),
        confidence: existing.confidence ?? 0.7,
        burstCount: existing.burstCount ?? 0,
        burstInterpretation: '',
        lengthTrajectory: 'stable',
        repeatFrictionDetected: false,
        repeatFrictionPhrases: [],
        disengagementDetected: false,
        messageScores: [],
      };

      return res.json(buildCanvas(scored, !existing.implicitCsatGap, existing.explicitCsatPct));
    }

    return res.json(buildCanvas(null, false));
  } catch (err) {
    console.error('Canvas initialize error:', err);
    return res.json(buildCanvas(null, false));
  }
});

// POST /canvas/submit — Handle Re-analyze button click
canvasRouter.post('/submit', async (req: Request, res: Response) => {
  if (!verifyCanvasSignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const conversationId: string = req.body?.conversation_id ?? req.body?.conversation?.id;
  const componentId: string = req.body?.component_id;

  if (!conversationId || componentId !== 'reanalyze' && componentId !== 'analyze') {
    return res.json(buildCanvas(null, false));
  }

  try {
    // Fetch live conversation from Intercom
    const conversation = await getConversation(conversationId);
    const messages = normalizeMessages(conversation);
    const explicitCsatPct = extractExplicitCsat(conversation);

    if (messages.filter(m => m.role === 'user').length === 0) {
      return res.json(buildCanvas(null, false));
    }

    const scored = await analyzeConversation({
      intercomId: conversationId,
      messages: messages.map(m => ({
        role: m.role,
        body: m.body,
        createdAt: m.createdAt,
      })),
      explicitCsatScore: explicitCsatPct,
    });

    // Persist to DB
    const dbRecord = await prisma.conversation.upsert({
      where: { intercomId: conversationId },
      create: {
        intercomId: conversationId,
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
        analyzedAt: new Date(),
      },
    });

    // Write to Intercom attributes + tags (non-blocking)
    writeConversationAttributes(conversationId, scored).catch(console.error);
    applyTags(conversationId, scored).catch(console.error);

    // Broadcast to WebSocket clients
    broadcast({
      intercomId: conversationId,
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

    return res.json(buildCanvas(scored, explicitCsatPct !== null, explicitCsatPct));
  } catch (err) {
    console.error('Canvas submit error:', err);
    return res.status(500).json({ error: 'Analysis failed' });
  }
});
