import { SentimentIntensityAnalyzer } from 'vader-sentiment';

export interface VaderMessageScore {
  index: number;
  role: 'customer' | 'agent' | 'bot';
  compound: number;
  pos: number;
  neg: number;
  neu: number;
}

export interface VaderAnalysis {
  messageScores: VaderMessageScore[];
  customer: {
    compound: number;
    trajectory: 'improving' | 'declining' | 'volatile' | 'stable';
    firstHalfCompound: number;
    secondHalfCompound: number;
    negativePeakIndices: number[];
    positivePeakIndices: number[];
    mostNegativeIndex: number | null;
    mostPositiveIndex: number | null;
  };
  agent: {
    compound: number;
    empathyGap: number;
  };
  speakerSentimentGap: number;
}

interface InputMessage {
  role: string;
  body: string;
  index: number;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = avg(values);
  return Math.sqrt(avg(values.map(v => (v - mean) ** 2)));
}

function mapRole(role: string): 'customer' | 'agent' | 'bot' {
  if (role === 'user') return 'customer';
  if (role === 'admin') return 'agent';
  return 'bot';
}

export function analyzeVader(messages: InputMessage[]): VaderAnalysis {
  const messageScores: VaderMessageScore[] = messages.map(msg => {
    const scores = SentimentIntensityAnalyzer.polarity_scores(msg.body || '');
    return {
      index: msg.index,
      role: mapRole(msg.role),
      compound: scores.compound,
      pos: scores.pos,
      neg: scores.neg,
      neu: scores.neu,
    };
  });

  const customerScores = messageScores.filter(s => s.role === 'customer');
  const agentScores = messageScores.filter(s => s.role === 'agent');

  const customerCompounds = customerScores.map(s => s.compound);
  const agentCompounds = agentScores.map(s => s.compound);

  const customerOverall = avg(customerCompounds);
  const agentOverall = avg(agentCompounds);

  const mid = Math.ceil(customerCompounds.length / 2);
  const firstHalf = customerCompounds.slice(0, mid);
  const secondHalf = customerCompounds.slice(mid);
  const firstHalfCompound = avg(firstHalf);
  const secondHalfCompound = avg(secondHalf);

  let trajectory: 'improving' | 'declining' | 'volatile' | 'stable';
  const diff = secondHalfCompound - firstHalfCompound;
  if (stddev(customerCompounds) > 0.4) {
    trajectory = 'volatile';
  } else if (diff > 0.2) {
    trajectory = 'improving';
  } else if (diff < -0.2) {
    trajectory = 'declining';
  } else {
    trajectory = 'stable';
  }

  const negativePeakIndices = customerScores
    .filter(s => s.compound < -0.5)
    .map(s => s.index);

  const positivePeakIndices = customerScores
    .filter(s => s.compound > 0.5)
    .map(s => s.index);

  let mostNegativeIndex: number | null = null;
  let mostPositiveIndex: number | null = null;

  if (customerScores.length > 0) {
    const mostNeg = customerScores.reduce((a, b) => a.compound < b.compound ? a : b);
    const mostPos = customerScores.reduce((a, b) => a.compound > b.compound ? a : b);
    mostNegativeIndex = mostNeg.index;
    mostPositiveIndex = mostPos.index;
  }

  const empathyGap = agentOverall - customerOverall;

  return {
    messageScores,
    customer: {
      compound: customerOverall,
      trajectory,
      firstHalfCompound,
      secondHalfCompound,
      negativePeakIndices,
      positivePeakIndices,
      mostNegativeIndex,
      mostPositiveIndex,
    },
    agent: {
      compound: agentOverall,
      empathyGap,
    },
    speakerSentimentGap: empathyGap,
  };
}
