import { getScoreLabelAndEmoji, getChurnRiskLabel } from './language';

export interface ScoredConversation {
  scorePct: number;
  label: string;
  emoji: string;
  confidence: number;
  language: string;
  languagesAll: string[];
  codeSwitchingDetected: boolean;
  codeSwitchingSignal: string | null;
  communicationStyle: string;
  communicationStyleSecondary: string | null;
  styleConfidence: number;
  keyEvidence: string;
  arc: string;
  conversion: string;
  conversionDeltaPct: number;
  scoreStartPct: number;
  scoreEndPct: number;
  culturalCalibration: string;
  keySignalSummary: string;
  churnRisk: string;
  churnSignals: string[];
  burstCount: number;
  burstInterpretation: string;
  lengthTrajectory: string;
  repeatFrictionDetected: boolean;
  repeatFrictionPhrases: string[];
  disengagementDetected: boolean;
  messageScores: MessageScore[];
}

export interface MessageScore {
  messageIndex: number;
  role: string;
  language: string;
  scorePct: number;
  confidence: number;
  signals: Record<string, string[]>;
  culturalNote?: string;
}

// Transform raw Claude JSON response into our typed domain model
export function normalizeClaudeResponse(raw: Record<string, unknown>): ScoredConversation {
  const overall = (raw.overall ?? {}) as Record<string, unknown>;
  const style = (raw.communication_style ?? {}) as Record<string, unknown>;
  const behavioral = (raw.behavioral_signals ?? {}) as Record<string, unknown>;
  const arc = (raw.conversation_arc ?? {}) as Record<string, unknown>;

  const scorePct = clamp(Number(overall.score_pct ?? 50), 0, 100);
  const { label, emoji } = getScoreLabelAndEmoji(scorePct);

  const communicationStyle = String(style.primary ?? 'neutral_transactional');
  const burstCount = (behavioral.message_bursts as unknown[])?.length ?? 0;

  const churnRisk = String(overall.churn_risk ?? getChurnRiskLabel(scorePct, communicationStyle, burstCount));
  const churnSignals = (overall.churn_signals as string[]) ?? [];

  const messageScores: MessageScore[] = ((raw.message_analysis as Record<string, unknown>[]) ?? [])
    .filter(m => m.role === 'customer')
    .map(m => ({
      messageIndex: Number(m.index ?? 0),
      role: String(m.role ?? 'customer'),
      language: String(m.language ?? 'en'),
      scorePct: clamp(Number(m.score_pct ?? 50), 0, 100),
      confidence: clamp(Number(m.confidence ?? 0.7), 0, 1),
      signals: (m.signals ?? {}) as Record<string, string[]>,
      culturalNote: m.cultural_note as string | undefined,
    }));

  return {
    scorePct,
    label,
    emoji,
    confidence: clamp(Number(overall.confidence ?? 0.7), 0, 1),
    language: String(raw.language_detected ?? 'en'),
    languagesAll: (raw.languages_all as string[]) ?? [],
    codeSwitchingDetected: Boolean(raw.code_switching_detected),
    codeSwitchingSignal: (raw.code_switching_signal as string) ?? null,
    communicationStyle,
    communicationStyleSecondary: (style.secondary as string) ?? null,
    styleConfidence: clamp(Number(style.style_confidence ?? 0.7), 0, 1),
    keyEvidence: String(style.key_evidence ?? ''),
    arc: String(arc.type ?? 'stable_neutral'),
    conversion: String(overall.conversion ?? 'stable'),
    conversionDeltaPct: Number(overall.conversion_delta_pct ?? 0),
    scoreStartPct: clamp(Number(overall.score_start_pct ?? scorePct), 0, 100),
    scoreEndPct: clamp(Number(overall.score_end_pct ?? scorePct), 0, 100),
    culturalCalibration: String(overall.cultural_calibration_applied ?? ''),
    keySignalSummary: String(overall.key_signal_summary ?? ''),
    churnRisk,
    churnSignals,
    burstCount,
    burstInterpretation: String(behavioral.burst_interpretation ?? ''),
    lengthTrajectory: String(behavioral.length_trajectory ?? 'stable'),
    repeatFrictionDetected: Boolean(behavioral.repeat_friction_detected),
    repeatFrictionPhrases: (behavioral.repeat_friction_phrases as string[]) ?? [],
    disengagementDetected: Boolean(behavioral.disengagement_detected),
    messageScores,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
