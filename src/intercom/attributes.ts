import axios from 'axios';
import { ScoredConversation } from '../analyzer/scorer';

function getClient() {
  const token = process.env.INTERCOM_ACCESS_TOKEN;
  if (!token) throw new Error('INTERCOM_ACCESS_TOKEN is not set');
  return axios.create({
    baseURL: 'https://api.intercom.io',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Intercom-Version': '2.11',
    },
  });
}

export async function writeConversationAttributes(
  conversationId: string,
  scored: ScoredConversation
): Promise<void> {
  const client = getClient();

  const attributes: Record<string, unknown> = {
    sentiment_score_pct: scored.scorePct,
    sentiment_label: scored.label,
    sentiment_emoji: scored.emoji,
    sentiment_language: scored.language,
    sentiment_languages_all: scored.languagesAll.join(','),
    sentiment_communication_style: scored.communicationStyle,
    sentiment_burst_count: scored.burstCount,
    sentiment_conversion: scored.conversion,
    sentiment_delta_pct: scored.conversionDeltaPct,
    sentiment_score_start_pct: scored.scoreStartPct,
    sentiment_score_end_pct: scored.scoreEndPct,
    sentiment_churn_risk: scored.churnRisk,
    sentiment_arc: scored.arc,
    sentiment_confidence: Math.round(scored.confidence * 100),
    sentiment_cultural_calibration: scored.culturalCalibration,
    sentiment_analyzed_at: new Date().toISOString(),
    implicit_csat_gap: true, // Always true — this is implicit scoring
  };

  await client.put(`/conversations/${conversationId}`, {
    custom_attributes: attributes,
  });
}
