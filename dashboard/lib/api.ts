const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
}

export const api = {
  overview: () => apiFetch<OverviewData>('/api/dashboard/overview'),
  distribution: () => apiFetch<DistributionData>('/api/dashboard/distribution'),
  timeline: (period: '7d' | '30d' | '90d' = '30d') => apiFetch<TimelineData>('/api/dashboard/timeline', { period }),
  languages: () => apiFetch<LanguagesData>('/api/dashboard/languages'),
  styles: () => apiFetch<StylesData>('/api/dashboard/styles'),
  bursts: () => apiFetch<BurstsData>('/api/dashboard/bursts'),
  churn: () => apiFetch<ChurnData>('/api/dashboard/churn'),
  conversions: () => apiFetch<ConversionsData>('/api/dashboard/conversions'),
  agents: () => apiFetch<AgentsData>('/api/dashboard/agents'),
  conversations: (params?: Record<string, string>) => apiFetch<ConversationsData>('/api/dashboard/conversations', params),
  nes: () => apiFetch<NesData>('/api/dashboard/nes'),
};

// Types
export interface OverviewData {
  avgScorePct: number | null;
  coveragePct: number;
  totalConversations: number;
  scoredConversations: number;
  scoredToday: number;
  churnRiskHigh: number;
  conversionsToday: number;
  explicitImplicitAgreementPct: number | null;
}

export interface DistributionBand {
  label: string;
  count: number;
  pct: number;
}
export interface DistributionData {
  distribution: DistributionBand[];
  total: number;
}

export interface TimelinePoint { date: string; avgScorePct: number; totalConversations: number; }
export interface TimelineData { timeline: TimelinePoint[]; period: string; }

export interface LanguageRow {
  language: string;
  count: number;
  avgScorePct: number;
  topStyle: string;
  churnRatePct: number;
}
export interface LanguagesData { languages: LanguageRow[]; }

export interface StyleRow {
  style: string;
  count: number;
  avgScorePct: number;
  churnRatePct: number;
  mostCommonArc: string;
}
export interface StylesData { styles: StyleRow[]; }

export interface BurstsData {
  withBursts: number;
  withoutBursts: number;
  burstAvgScorePct: number | null;
  noBurstAvgScorePct: number | null;
  burstConversations: ConversationRow[];
}

export interface ChurnData {
  high: ConversationRow[];
  medium: ConversationRow[];
  low: ConversationRow[];
}

export interface ConversionsData {
  arcCounts: Record<string, number>;
  topRescueAgents: Array<{ agentId: string; rescueCount: number; avgDeltaPct: number }>;
  total: number;
}

export interface AgentRow {
  agentId: string;
  conversationCount: number;
  avgScorePct: number;
  rescueRate: number;
  dropRate: number;
  burstEscalationRate: number;
}
export interface AgentsData { agents: AgentRow[]; }

export interface ConversationRow {
  intercomId: string;
  scorePct: number;
  label: string;
  emoji: string;
  language: string;
  communicationStyle: string;
  arc?: string;
  churnRisk?: string;
  burstCount?: number;
  keySignalSummary?: string;
  analyzedAt: string;
  intercomUrl?: string;
  agentId?: string;
  explicitCsatPct?: number | null;
  implicitCsatGap?: boolean;
}
export interface ConversationsData {
  conversations: ConversationRow[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

export interface NesData {
  nes: number | null;
  empathetic: number;
  neutral: number;
  unempathetic: number;
  total: number;
  empatheticPct: number;
  neutralPct: number;
  unempatheticPct: number;
  avgEmpathyScore: number | null;
}
