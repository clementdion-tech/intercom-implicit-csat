export interface Message {
  role: string;
  body: string;
  createdAt: Date;
  index: number;
}

export interface BurstEvent {
  atMessageIndex: number;
  messagesInBurst: number;
  windowSeconds: number;
  phase: 'start' | 'mid' | 'end';
}

const BURST_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
const BURST_MIN_MESSAGES = 3;
const BURST_SCORE_PENALTY = -8; // per burst, max 3 bursts

export function detectBursts(messages: Message[]): BurstEvent[] {
  const customerMessages = messages.filter(
    m => m.role === 'user' || m.role === 'customer'
  );

  const bursts: BurstEvent[] = [];
  const totalCustomerMessages = customerMessages.length;

  let i = 0;
  while (i < customerMessages.length) {
    const windowStart = customerMessages[i].createdAt.getTime();
    let j = i + 1;

    while (
      j < customerMessages.length &&
      customerMessages[j].createdAt.getTime() - windowStart <= BURST_WINDOW_MS
    ) {
      j++;
    }

    const inWindow = j - i;
    if (inWindow >= BURST_MIN_MESSAGES) {
      const windowSeconds = Math.round(
        (customerMessages[j - 1].createdAt.getTime() - windowStart) / 1000
      );

      // Determine phase: start = first 30% of convo, end = last 30%
      const midPoint = customerMessages[i].index;
      const phase: BurstEvent['phase'] =
        midPoint < totalCustomerMessages * 0.3
          ? 'start'
          : midPoint > totalCustomerMessages * 0.7
          ? 'end'
          : 'mid';

      bursts.push({
        atMessageIndex: customerMessages[i].index,
        messagesInBurst: inWindow,
        windowSeconds,
        phase,
      });

      i = j; // skip past the burst window
    } else {
      i++;
    }
  }

  return bursts;
}

export function calculateBurstPenalty(bursts: BurstEvent[]): number {
  return Math.max(-24, bursts.length * BURST_SCORE_PENALTY);
}

export function interpretBursts(bursts: BurstEvent[]): string {
  if (bursts.length === 0) return 'No burst messaging detected';

  const phases = bursts.map(b => b.phase);
  const parts: string[] = [];

  if (phases.includes('start')) {
    parts.push('customer arrived already frustrated (burst at conversation start)');
  }
  if (phases.includes('mid')) {
    parts.push('agent response triggered agitation mid-conversation');
  }
  if (phases.includes('end')) {
    parts.push('conversation ended with escalating frustration (burst at close)');
  }

  return `${bursts.length} burst(s) detected: ${parts.join('; ')}`;
}
