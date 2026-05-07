import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const analyticsRouter = Router();

// GET /api/health
analyticsRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/dashboard/overview
analyticsRouter.get('/dashboard/overview', async (_req: Request, res: Response) => {
  try {
    const [total, scored, churnHigh, conversions] = await Promise.all([
      prisma.conversation.count(),
      prisma.conversation.count({ where: { scorePct: { not: null } } }),
      prisma.conversation.count({ where: { churnRisk: 'high' } }),
      prisma.conversation.count({ where: { conversion: 'converted' } }),
    ]);

    const avgResult = await prisma.conversation.aggregate({
      _avg: { scorePct: true },
      where: { scorePct: { not: null } },
    });

    // Explicit/implicit agreement (within 15% gap)
    const withBoth = await prisma.conversation.findMany({
      where: { scorePct: { not: null }, explicitCsatPct: { not: null } },
      select: { scorePct: true, explicitCsatPct: true },
    });
    const agreementRate =
      withBoth.length > 0
        ? (withBoth.filter(c => Math.abs(c.scorePct! - c.explicitCsatPct!) <= 15).length /
            withBoth.length) *
          100
        : null;

    // Scored today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const scoredToday = await prisma.conversation.count({
      where: { analyzedAt: { gte: todayStart } },
    });

    const coveragePct = total > 0 ? Math.round((scored / total) * 100) : 0;

    res.json({
      avgScorePct: avgResult._avg.scorePct ? Math.round(avgResult._avg.scorePct) : null,
      coveragePct,
      totalConversations: total,
      scoredConversations: scored,
      scoredToday,
      churnRiskHigh: churnHigh,
      conversionsToday: conversions,
      explicitImplicitAgreementPct: agreementRate ? Math.round(agreementRate) : null,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load overview' });
  }
});

// GET /api/dashboard/distribution
analyticsRouter.get('/dashboard/distribution', async (_req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { scorePct: { not: null } },
      select: { scorePct: true },
    });

    const bands = {
      very_dissatisfied: 0,
      dissatisfied: 0,
      neutral: 0,
      satisfied: 0,
      very_satisfied: 0,
    };

    for (const c of conversations) {
      const s = c.scorePct!;
      if (s <= 20) bands.very_dissatisfied++;
      else if (s <= 40) bands.dissatisfied++;
      else if (s <= 60) bands.neutral++;
      else if (s <= 80) bands.satisfied++;
      else bands.very_satisfied++;
    }

    const total = conversations.length;
    const distribution = Object.entries(bands).map(([label, count]) => ({
      label,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    }));

    res.json({ distribution, total });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load distribution' });
  }
});

// GET /api/dashboard/timeline?period=7d|30d|90d
analyticsRouter.get('/dashboard/timeline', async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) ?? '30d';
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;

    const since = new Date();
    since.setDate(since.getDate() - days);

    const snapshots = await prisma.dailySnapshot.findMany({
      where: { date: { gte: since } },
      orderBy: { date: 'asc' },
      select: { date: true, avgScorePct: true, totalConversations: true },
    });

    res.json({ timeline: snapshots, period });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load timeline' });
  }
});

// GET /api/dashboard/languages
analyticsRouter.get('/dashboard/languages', async (_req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { scorePct: { not: null }, language: { not: null } },
      select: { language: true, scorePct: true, communicationStyle: true, churnRisk: true },
    });

    const byLang = new Map<string, { count: number; totalScore: number; styles: string[]; churnHighCount: number }>();

    for (const c of conversations) {
      const lang = c.language!;
      if (!byLang.has(lang)) {
        byLang.set(lang, { count: 0, totalScore: 0, styles: [], churnHighCount: 0 });
      }
      const entry = byLang.get(lang)!;
      entry.count++;
      entry.totalScore += c.scorePct!;
      if (c.communicationStyle) entry.styles.push(c.communicationStyle);
      if (c.churnRisk === 'high') entry.churnHighCount++;
    }

    const result = Array.from(byLang.entries())
      .map(([lang, data]) => {
        const styleCounts = data.styles.reduce<Record<string, number>>((acc, s) => {
          acc[s] = (acc[s] ?? 0) + 1;
          return acc;
        }, {});
        const topStyle = Object.entries(styleCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'neutral_transactional';

        return {
          language: lang,
          count: data.count,
          avgScorePct: Math.round(data.totalScore / data.count),
          topStyle,
          churnRatePct: Math.round((data.churnHighCount / data.count) * 100),
        };
      })
      .sort((a, b) => b.count - a.count);

    res.json({ languages: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load languages' });
  }
});

// GET /api/dashboard/styles
analyticsRouter.get('/dashboard/styles', async (_req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { scorePct: { not: null }, communicationStyle: { not: null } },
      select: { communicationStyle: true, scorePct: true, churnRisk: true, arc: true },
    });

    const byStyle = new Map<string, { count: number; totalScore: number; churnHighCount: number; arcs: string[] }>();

    for (const c of conversations) {
      const style = c.communicationStyle!;
      if (!byStyle.has(style)) {
        byStyle.set(style, { count: 0, totalScore: 0, churnHighCount: 0, arcs: [] });
      }
      const entry = byStyle.get(style)!;
      entry.count++;
      entry.totalScore += c.scorePct!;
      if (c.churnRisk === 'high') entry.churnHighCount++;
      if (c.arc) entry.arcs.push(c.arc);
    }

    const result = Array.from(byStyle.entries())
      .map(([style, data]) => ({
        style,
        count: data.count,
        avgScorePct: Math.round(data.totalScore / data.count),
        churnRatePct: Math.round((data.churnHighCount / data.count) * 100),
        mostCommonArc: getMostCommon(data.arcs) ?? 'stable_neutral',
      }))
      .sort((a, b) => b.count - a.count);

    res.json({ styles: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load styles' });
  }
});

// GET /api/dashboard/bursts
analyticsRouter.get('/dashboard/bursts', async (_req: Request, res: Response) => {
  try {
    const withBursts = await prisma.conversation.count({ where: { burstCount: { gt: 0 } } });
    const withoutBursts = await prisma.conversation.count({ where: { burstCount: 0 } });

    const burstAvg = await prisma.conversation.aggregate({
      _avg: { scorePct: true },
      where: { burstCount: { gt: 0 }, scorePct: { not: null } },
    });
    const noBurstAvg = await prisma.conversation.aggregate({
      _avg: { scorePct: true },
      where: { burstCount: 0, scorePct: { not: null } },
    });

    const burstConversations = await prisma.conversation.findMany({
      where: { burstCount: { gt: 0 } },
      orderBy: { analyzedAt: 'desc' },
      take: 50,
      select: {
        intercomId: true, scorePct: true, label: true, emoji: true,
        language: true, communicationStyle: true, burstCount: true,
        agentId: true, analyzedAt: true,
      },
    });

    res.json({
      withBursts,
      withoutBursts,
      burstAvgScorePct: burstAvg._avg.scorePct ? Math.round(burstAvg._avg.scorePct) : null,
      noBurstAvgScorePct: noBurstAvg._avg.scorePct ? Math.round(noBurstAvg._avg.scorePct) : null,
      burstConversations,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load bursts' });
  }
});

// GET /api/dashboard/churn
analyticsRouter.get('/dashboard/churn', async (_req: Request, res: Response) => {
  try {
    const [high, medium, low] = await Promise.all([
      prisma.conversation.findMany({
        where: { churnRisk: 'high' },
        orderBy: { analyzedAt: 'desc' },
        take: 100,
        select: { intercomId: true, scorePct: true, label: true, emoji: true, language: true, communicationStyle: true, keySignalSummary: true, analyzedAt: true },
      }),
      prisma.conversation.findMany({
        where: { churnRisk: 'medium' },
        orderBy: { analyzedAt: 'desc' },
        take: 100,
        select: { intercomId: true, scorePct: true, label: true, emoji: true, language: true, communicationStyle: true, keySignalSummary: true, analyzedAt: true },
      }),
      prisma.conversation.findMany({
        where: { churnRisk: 'low' },
        orderBy: { analyzedAt: 'desc' },
        take: 50,
        select: { intercomId: true, scorePct: true, label: true, emoji: true, language: true, communicationStyle: true, keySignalSummary: true, analyzedAt: true },
      }),
    ]);

    res.json({ high, medium, low });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load churn pipeline' });
  }
});

// GET /api/dashboard/conversions
analyticsRouter.get('/dashboard/conversions', async (_req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { scorePct: { not: null }, arc: { not: null } },
      select: { arc: true, scoreStartPct: true, scoreEndPct: true, agentId: true, conversionDeltaPct: true },
    });

    const arcCounts = conversations.reduce<Record<string, number>>((acc, c) => {
      acc[c.arc!] = (acc[c.arc!] ?? 0) + 1;
      return acc;
    }, {});

    // Top rescue agents (highest avg delta on rescued arcs)
    const rescuedByAgent = conversations
      .filter(c => c.arc === 'rescued' && c.agentId)
      .reduce<Record<string, number[]>>((acc, c) => {
        if (!acc[c.agentId!]) acc[c.agentId!] = [];
        acc[c.agentId!].push(c.conversionDeltaPct ?? 0);
        return acc;
      }, {});

    const topRescueAgents = Object.entries(rescuedByAgent)
      .map(([agentId, deltas]) => ({
        agentId,
        rescueCount: deltas.length,
        avgDeltaPct: Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length),
      }))
      .sort((a, b) => b.rescueCount - a.rescueCount)
      .slice(0, 10);

    res.json({ arcCounts, topRescueAgents, total: conversations.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load conversions' });
  }
});

// GET /api/dashboard/agents
analyticsRouter.get('/dashboard/agents', async (_req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { scorePct: { not: null }, agentId: { not: null } },
      select: { agentId: true, scorePct: true, arc: true, burstCount: true, conversionDeltaPct: true },
    });

    const byAgent = new Map<string, { scores: number[]; arcs: string[]; bursts: number[] }>();

    for (const c of conversations) {
      if (!byAgent.has(c.agentId!)) {
        byAgent.set(c.agentId!, { scores: [], arcs: [], bursts: [] });
      }
      const entry = byAgent.get(c.agentId!)!;
      entry.scores.push(c.scorePct!);
      if (c.arc) entry.arcs.push(c.arc);
      entry.bursts.push(c.burstCount ?? 0);
    }

    const agents = Array.from(byAgent.entries())
      .map(([agentId, data]) => ({
        agentId,
        conversationCount: data.scores.length,
        avgScorePct: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        rescueRate: Math.round((data.arcs.filter(a => a === 'rescued').length / data.arcs.length) * 100),
        dropRate: Math.round((data.arcs.filter(a => a === 'declined').length / data.arcs.length) * 100),
        burstEscalationRate: Math.round((data.bursts.filter(b => b > 0).length / data.bursts.length) * 100),
      }))
      .sort((a, b) => b.conversationCount - a.conversationCount);

    res.json({ agents });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load agent analytics' });
  }
});

// GET /api/dashboard/conversations
analyticsRouter.get('/dashboard/conversations', async (req: Request, res: Response) => {
  try {
    const {
      score_min, score_max, style, lang, churn_risk, arc,
      page = '1', limit = '50',
    } = req.query as Record<string, string>;

    const where: Record<string, unknown> = { scorePct: { not: null } };

    if (score_min !== undefined || score_max !== undefined) {
      where.scorePct = {
        ...(score_min ? { gte: parseInt(score_min) } : {}),
        ...(score_max ? { lte: parseInt(score_max) } : {}),
      };
    }
    if (style) where.communicationStyle = style;
    if (lang) where.language = lang;
    if (churn_risk) where.churnRisk = churn_risk;
    if (arc) where.arc = arc;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const skip = (pageNum - 1) * limitNum;

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: { analyzedAt: 'desc' },
        skip,
        take: limitNum,
        select: {
          intercomId: true, scorePct: true, label: true, emoji: true,
          language: true, communicationStyle: true, arc: true,
          churnRisk: true, burstCount: true, conversion: true,
          conversionDeltaPct: true, keySignalSummary: true,
          analyzedAt: true, agentId: true, explicitCsatPct: true,
          implicitCsatGap: true,
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    res.json({
      conversations: conversations.map(c => ({
        ...c,
        intercomUrl: `https://app.intercom.io/a/inbox/all/conversations/${c.intercomId}`,
      })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

// POST /api/alerts/config — stub for future config persistence
analyticsRouter.post('/alerts/config', async (req: Request, res: Response) => {
  res.json({ ok: true, config: req.body });
});

// GET /api/dashboard/nes
analyticsRouter.get('/dashboard/nes', async (_req: Request, res: Response) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { agentEmpathyScore: { not: null } },
      select: { agentEmpathyScore: true, agentEmpathyLabel: true },
    });

    const total = conversations.length;
    if (total === 0) {
      return res.json({ nes: null, empathetic: 0, neutral: 0, unempathetic: 0, total: 0, empatheticPct: 0, neutralPct: 0, unempatheticPct: 0, avgEmpathyScore: null });
    }

    const empathetic = conversations.filter(c => (c.agentEmpathyScore ?? 0) >= 70).length;
    const unempathetic = conversations.filter(c => (c.agentEmpathyScore ?? 0) < 40).length;
    const neutral = total - empathetic - unempathetic;

    const empatheticPct = Math.round((empathetic / total) * 100);
    const unempatheticPct = Math.round((unempathetic / total) * 100);
    const neutralPct = 100 - empatheticPct - unempatheticPct;
    const nes = empatheticPct - unempatheticPct;

    const avgEmpathyScore = Math.round(
      conversations.reduce((s, c) => s + (c.agentEmpathyScore ?? 0), 0) / total
    );

    res.json({ nes, empathetic, neutral, unempathetic, total, empatheticPct, neutralPct, unempatheticPct, avgEmpathyScore });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load NES' });
  }
});

function getMostCommon(arr: string[]): string | undefined {
  const counts = arr.reduce<Record<string, number>>((acc, v) => {
    acc[v] = (acc[v] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
}
