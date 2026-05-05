// Pre-analysis signal extraction for context enrichment before Claude call.
// Claude does the deep analysis; these are deterministic pre-passes.

export interface PreSignals {
  hasAllCaps: boolean;
  hasRepeatedPunctuation: boolean;
  hasEllipsis: boolean;
  hasMixedCase: boolean;
  hasRepeatFriction: boolean;
  repeatFrictionPhrases: string[];
  messageLengthTrajectory: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  monosyllabicAfterFrustration: boolean;
  hasEscalationDemands: boolean;
  escalationPhrases: string[];
  hasProfanity: boolean;
  hasUrgencyMarkers: boolean;
  hasPassiveAggressive: boolean;
  passiveAggressivePhrases: string[];
}

const REPEAT_FRICTION_PATTERNS = [
  /as i (already|mentioned|said|told you)/i,
  /i already (said|told|mentioned|explained)/i,
  /like i (said|told|mentioned)/i,
  /i've (already|been) (saying|telling|asking)/i,
  /as previously (mentioned|stated|discussed)/i,
  /going back to what i (said|mentioned)/i,
];

const ESCALATION_PATTERNS = [
  /\b(cancel|cancellation|cancelling)\b/i,
  /\b(lawyer|legal|lawsuit|sue|court)\b/i,
  /\b(complaint|complain|report|complaint)\b/i,
  /\b(viral|twitter|social media|facebook|linkedin|reddit)\b/i,
  /\b(manager|supervisor|director|ceo|president|head of)\b/i,
  /\b(press|media|journalist|newspaper|news)\b/i,
  /\b(bbb|better business bureau|trading standards|ombudsman)\b/i,
];

const PASSIVE_AGGRESSIVE_PATTERNS = [
  /\b(fine|whatever|ok then|i guess|i suppose)\b/i,
  /\bsure\b.*(\.|,)/i,
  /i would (very much )?appreciate if (perhaps |maybe )?someone could (maybe )?/i,
  /oh (great|perfect|wonderful|brilliant|fantastic),?\s*(just\s*what|exactly\s*what)/i,
  /c'est ça/i,
  /claro que sí/i,
  /natürlich\.\.\./i,
  /certo,? certo/i,
  /\b(obviously|clearly|apparently)\b.*(\?|!)/i,
];

const URGENCY_PATTERNS = [
  /\b(asap|urgent|urgently|immediately|right now|right away)\b/i,
  /\b(by (today|tonight|tomorrow|end of day|eod|eow))\b/i,
  /\bthis is (critical|urgent|an emergency|time.sensitive)\b/i,
  /\bneed this (now|immediately|asap|today)\b/i,
];

// Lightweight profanity detection (English + common multilingual)
const PROFANITY_PATTERNS = [
  /\b(fuck|fucking|shit|bitch|asshole|bastard|damn|crap|hell)\b/i,
  /\b(merde|putain|connard|salaud)\b/i, // French
  /\b(scheisse|scheiß|arschloch|verdammt)\b/i, // German
  /\b(mierda|joder|coño|hostia|puta)\b/i, // Spanish
  /\b(cazzo|stronzo|merda|porco)\b/i, // Italian
  /\b(kut|klootzak|godverdomme)\b/i, // Dutch
];

export function extractPreSignals(messages: Array<{ role: string; body: string }>): PreSignals {
  const customerMessages = messages.filter(m => m.role === 'user' || m.role === 'customer');
  const fullText = customerMessages.map(m => m.body).join('\n');

  // ALL CAPS detection (segments of 4+ capital letters, not just acronyms)
  const hasAllCaps = /[A-Z]{4,}/.test(fullText);

  // Repeated punctuation
  const hasRepeatedPunctuation = /([?!]{2,}|\.{3,})/.test(fullText);

  // Ellipsis
  const hasEllipsis = /\.{3}/.test(fullText);

  // Mixed case "wHy Is ThIs"
  const hasMixedCase = /[a-z][A-Z][a-z][A-Z]/.test(fullText);

  // Repeat friction phrases
  const repeatFrictionPhrases: string[] = [];
  for (const pattern of REPEAT_FRICTION_PATTERNS) {
    const match = fullText.match(pattern);
    if (match) repeatFrictionPhrases.push(match[0]);
  }
  const hasRepeatFriction = repeatFrictionPhrases.length > 0;

  // Escalation demands
  const escalationPhrases: string[] = [];
  for (const pattern of ESCALATION_PATTERNS) {
    const match = fullText.match(pattern);
    if (match) escalationPhrases.push(match[0]);
  }
  const hasEscalationDemands = escalationPhrases.length > 0;

  // Profanity
  const hasProfanity = PROFANITY_PATTERNS.some(p => p.test(fullText));

  // Urgency markers
  const hasUrgencyMarkers = URGENCY_PATTERNS.some(p => p.test(fullText));

  // Passive-aggressive
  const passiveAggressivePhrases: string[] = [];
  for (const pattern of PASSIVE_AGGRESSIVE_PATTERNS) {
    const match = fullText.match(pattern);
    if (match) passiveAggressivePhrases.push(match[0]);
  }
  const hasPassiveAggressive = passiveAggressivePhrases.length > 0;

  // Message length trajectory
  const lengths = customerMessages.map(m => m.body.length);
  const messageLengthTrajectory = analyzeTrajectory(lengths);

  // Monosyllabic after frustration: detect if early messages were long and late ones are very short
  const monosyllabicAfterFrustration =
    lengths.length >= 3 &&
    lengths[0] > 100 &&
    lengths[lengths.length - 1] < 20;

  return {
    hasAllCaps,
    hasRepeatedPunctuation,
    hasEllipsis,
    hasMixedCase,
    hasRepeatFriction,
    repeatFrictionPhrases,
    messageLengthTrajectory,
    monosyllabicAfterFrustration,
    hasEscalationDemands,
    escalationPhrases,
    hasProfanity,
    hasUrgencyMarkers,
    hasPassiveAggressive,
    passiveAggressivePhrases,
  };
}

function analyzeTrajectory(
  lengths: number[]
): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
  if (lengths.length < 3) return 'stable';

  const firstHalf = lengths.slice(0, Math.floor(lengths.length / 2));
  const secondHalf = lengths.slice(Math.floor(lengths.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const variance =
    lengths.reduce((sum, l) => sum + Math.pow(l - firstAvg, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev / firstAvg > 0.7) return 'volatile';
  if (secondAvg > firstAvg * 1.25) return 'increasing';
  if (secondAvg < firstAvg * 0.75) return 'decreasing';
  return 'stable';
}
