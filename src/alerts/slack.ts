import axios from 'axios';
import { ScoredConversation } from '../analyzer/scorer';

async function sendSlack(text: string, blocks?: Record<string, unknown>[]): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return; // Silently skip if not configured

  const payload: Record<string, unknown> = { text };
  if (blocks) payload.blocks = blocks;

  await axios.post(webhookUrl, payload).catch(err => {
    console.error('Slack alert failed:', err.message);
  });
}

export interface AlertConfig {
  churnRiskHighEnabled: boolean;
  veryDissatisfiedBurstEnabled: boolean;
  dailyDropThresholdPct: number;
  passiveAggressiveVolumeThreshold: number; // percentage of daily volume
}

export const DEFAULT_ALERT_CONFIG: AlertConfig = {
  churnRiskHighEnabled: true,
  veryDissatisfiedBurstEnabled: true,
  dailyDropThresholdPct: 5,
  passiveAggressiveVolumeThreshold: 30,
};

export async function alertChurnRisk(
  conversationId: string,
  scored: ScoredConversation
): Promise<void> {
  if (scored.churnRisk !== 'high') return;

  const url = `https://app.intercom.io/a/inbox/all/conversations/${conversationId}`;

  await sendSlack(`🚨 *High Churn Risk* — conversation ${conversationId}`, [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `🚨 *High Churn Risk Detected*\n*Score:* ${scored.scorePct}% ${scored.emoji}\n*Style:* ${scored.communicationStyle.replace(/_/g, ' ')}\n*Language:* ${scored.language.toUpperCase()}\n*Key signal:* ${scored.keySignalSummary}\n<${url}|View in Intercom>`,
      },
    },
  ]);
}

export async function alertVeryDissatisfiedBurst(
  conversationId: string,
  scored: ScoredConversation
): Promise<void> {
  if (scored.scorePct > 20 || scored.burstCount === 0) return;

  const url = `https://app.intercom.io/a/inbox/all/conversations/${conversationId}`;

  await sendSlack(`🔥 *Critical: Very Dissatisfied + Burst Contact* — conversation ${conversationId}`, [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `🔥 *Critical Alert: Very Dissatisfied + Burst Messages*\n*Score:* ${scored.scorePct}% ${scored.emoji}\n*Bursts:* ${scored.burstCount} burst(s) detected\n*Style:* ${scored.communicationStyle.replace(/_/g, ' ')}\n*Key signal:* ${scored.keySignalSummary}\n<${url}|View in Intercom>`,
      },
    },
  ]);
}

export async function alertDailyScoreDrop(
  todayAvg: number,
  yesterdayAvg: number
): Promise<void> {
  const drop = yesterdayAvg - todayAvg;
  if (drop < DEFAULT_ALERT_CONFIG.dailyDropThresholdPct) return;

  await sendSlack(`📉 Daily avg CSAT score dropped ${drop.toFixed(1)}%`, [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `📉 *Daily Score Drop Alert*\nYesterday: ${yesterdayAvg.toFixed(1)}%\nToday so far: ${todayAvg.toFixed(1)}%\nDrop: *${drop.toFixed(1)}%* — exceeds ${DEFAULT_ALERT_CONFIG.dailyDropThresholdPct}% threshold`,
      },
    },
  ]);
}

export async function alertPassiveAggressiveSpike(
  paCount: number,
  totalCount: number
): Promise<void> {
  const pct = (paCount / totalCount) * 100;
  if (pct < DEFAULT_ALERT_CONFIG.passiveAggressiveVolumeThreshold) return;

  await sendSlack(`😤 Passive-aggressive volume spike: ${pct.toFixed(0)}% of conversations today`, [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `😤 *Passive-Aggressive Volume Spike*\n${paCount} of ${totalCount} conversations today (${pct.toFixed(0)}%) are passive-aggressive — exceeds ${DEFAULT_ALERT_CONFIG.passiveAggressiveVolumeThreshold}% threshold.\nConsider reviewing agent responses for friction patterns.`,
      },
    },
  ]);
}

export async function sendAlerts(
  conversationId: string,
  scored: ScoredConversation
): Promise<void> {
  await Promise.allSettled([
    alertChurnRisk(conversationId, scored),
    alertVeryDissatisfiedBurst(conversationId, scored),
  ]);
}
