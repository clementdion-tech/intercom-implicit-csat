// NRC Emotion Lexicon-inspired emotion detector for customer service CSAT
// Based on Plutchik's 8 basic emotions (Mohammad & Turney, NRC Emotion Lexicon)

export interface EmotionScores {
  anger: number;
  fear: number;
  joy: number;
  sadness: number;
  disgust: number;
  surprise: number;
  trust: number;
  anticipation: number;
}

export interface EmotionProfile {
  dominant: keyof EmotionScores | 'neutral';
  scores: EmotionScores;
  intensity: number; // 0-1, how strong the dominant emotion is
}

export interface ConversationEmotionAnalysis {
  perMessage: Array<{ index: number; role: string; profile: EmotionProfile }>;
  customer: {
    overall: EmotionProfile;
    arc: Array<keyof EmotionScores | 'neutral'>; // dominant emotion per customer message
    emotionShifts: number;   // count of times dominant emotion changed
    frustrationScore: number; // 0-1 composite of anger + fear + sadness + disgust
    satisfactionScore: number; // 0-1 composite of joy + trust
  };
  agent: {
    overall: EmotionProfile;
    warmthScore: number;  // 0-1 composite of joy + trust
    anxietyScore: number; // 0-1 composite of fear + anticipation
  };
}

// ─── Lexicon ────────────────────────────────────────────────────────────────

const LEXICON: Map<string, Partial<EmotionScores>> = new Map([
  // ANGER (weight 2-3)
  ['furious',       { anger: 3 }],
  ['angry',         { anger: 3 }],
  ['rage',          { anger: 3 }],
  ['outraged',      { anger: 3 }],
  ['unacceptable',  { anger: 2 }],
  ['ridiculous',    { anger: 2 }],
  ['incompetent',   { anger: 2 }],
  ['useless',       { anger: 2 }],
  ['stupid',        { anger: 2 }],
  ['pathetic',      { anger: 2 }],
  ['worst',         { anger: 3 }],
  ['terrible',      { anger: 2 }],
  ['horrible',      { anger: 2 }],
  ['awful',         { anger: 2 }],
  ['rubbish',       { anger: 2 }],
  ['garbage',       { anger: 2 }],
  ['disaster',      { anger: 2 }],
  ['nightmare',     { anger: 2 }],
  ['absurd',        { anger: 2 }],
  ['insane',        { anger: 2 }],
  ['fraud',         { anger: 3 }],
  ['scam',          { anger: 3 }],
  ['liar',          { anger: 3 }],
  ['cheat',         { anger: 3 }],
  ['waste',         { anger: 2 }],
  ['broken',        { anger: 2 }],
  ['failed',        { anger: 2 }],
  ['ruin',          { anger: 2 }],
  ['destroy',       { anger: 2 }],
  ['hate',          { anger: 3 }],
  ['hatred',        { anger: 3 }],
  ['infuriating',   { anger: 3 }],
  ['maddening',     { anger: 3 }],
  ['appalling',     { anger: 2 }],
  ['atrocious',     { anger: 3 }],
  ['lousy',         { anger: 2 }],
  ['dreadful',      { anger: 2 }],
  ['shocking',      { anger: 2, surprise: 1 }],
  ['disgusting',    { anger: 2, disgust: 2 }],

  // FEAR (weight 1-2)
  ['worried',       { fear: 2 }],
  ['concerned',     { fear: 1 }],
  ['anxious',       { fear: 2 }],
  ['nervous',       { fear: 2 }],
  ['scared',        { fear: 2 }],
  ['uncertain',     { fear: 1 }],
  ['unsure',        { fear: 1 }],
  ['afraid',        { fear: 2 }],
  ['lost',          { fear: 1, sadness: 1 }],
  ['confused',      { fear: 1, surprise: 1 }],
  ['desperate',     { fear: 2, sadness: 2 }],
  ['panic',         { fear: 2 }],
  ['stress',        { fear: 1 }],
  ['stressed',      { fear: 2 }],
  ['overwhelmed',   { fear: 2 }],
  ['helpless',      { fear: 2, sadness: 1 }],
  ['vulnerable',    { fear: 1 }],
  ['risk',          { fear: 1 }],
  ['danger',        { fear: 2 }],
  ['threatened',    { fear: 2 }],
  ['alarmed',       { fear: 2 }],
  ['frightened',    { fear: 2 }],
  ['troubled',      { fear: 1, sadness: 1 }],
  ['distressed',    { fear: 2, sadness: 1 }],
  ['uneasy',        { fear: 1 }],
  ['apprehensive',  { fear: 2 }],

  // JOY (weight 2-3)
  ['excellent',     { joy: 3 }],
  ['amazing',       { joy: 3 }],
  ['fantastic',     { joy: 3 }],
  ['wonderful',     { joy: 3 }],
  ['brilliant',     { joy: 3 }],
  ['great',         { joy: 2 }],
  ['love',          { joy: 3 }],
  ['perfect',       { joy: 3 }],
  ['happy',         { joy: 3 }],
  ['delighted',     { joy: 3 }],
  ['thrilled',      { joy: 3 }],
  ['grateful',      { joy: 2, trust: 1 }],
  ['thankful',      { joy: 2, trust: 1 }],
  ['appreciate',    { joy: 2, trust: 1 }],
  ['pleased',       { joy: 2 }],
  ['satisfied',     { joy: 2, trust: 1 }],
  ['impressed',     { joy: 2 }],
  ['outstanding',   { joy: 3 }],
  ['superb',        { joy: 3 }],
  ['awesome',       { joy: 3 }],
  ['fabulous',      { joy: 3 }],
  ['terrific',      { joy: 3 }],
  ['phenomenal',    { joy: 3 }],
  ['exceptional',   { joy: 3 }],
  ['joyful',        { joy: 3 }],
  ['ecstatic',      { joy: 3 }],
  ['elated',        { joy: 3 }],

  // SADNESS (weight 1-2)
  ['disappointed',  { sadness: 2 }],
  ['disappointing', { sadness: 2 }],
  ['sad',           { sadness: 2 }],
  ['unhappy',       { sadness: 2 }],
  ['frustrated',    { sadness: 2, anger: 1 }],
  ['unfortunate',   { sadness: 1 }],
  ['regret',        { sadness: 2 }],
  ['sorry',         { sadness: 1 }],
  ['missed',        { sadness: 1 }],
  ['failure',       { sadness: 2 }],
  ['unable',        { sadness: 1 }],
  ['hopeless',      { sadness: 2 }],
  ['dejected',      { sadness: 2 }],
  ['despondent',    { sadness: 2 }],
  ['miserable',     { sadness: 2 }],
  ['upset',         { sadness: 2, anger: 1 }],
  ['heartbroken',   { sadness: 2 }],
  ['mourning',      { sadness: 2 }],
  ['grief',         { sadness: 2 }],
  ['sorrow',        { sadness: 2 }],
  ['disheartened',  { sadness: 2 }],
  ['let down',      { sadness: 2 }],

  // DISGUST (weight 2)
  ['revolting',     { disgust: 2 }],
  ['repulsive',     { disgust: 2 }],
  ['offensive',     { disgust: 2 }],
  ['vile',          { disgust: 2 }],
  ['nasty',         { disgust: 2 }],
  ['gross',         { disgust: 2 }],
  ['inappropriate', { disgust: 2 }],
  ['shameful',      { disgust: 2 }],
  ['despicable',    { disgust: 2 }],
  ['contemptible',  { disgust: 2 }],
  ['reprehensible', { disgust: 2 }],
  ['deplorable',    { disgust: 2 }],
  ['abysmal',       { disgust: 2 }],
  ['sickening',     { disgust: 2 }],
  ['nauseating',    { disgust: 2 }],
  ['foul',          { disgust: 2 }],
  ['hideous',       { disgust: 2 }],
  ['loathsome',     { disgust: 2 }],

  // SURPRISE (weight 1-2)
  ['surprised',     { surprise: 2 }],
  ['unexpected',    { surprise: 2 }],
  ['suddenly',      { surprise: 1 }],
  ['strange',       { surprise: 1 }],
  ['unusual',       { surprise: 1 }],
  ['weird',         { surprise: 1 }],
  ['odd',           { surprise: 1 }],
  ['astonished',    { surprise: 2 }],
  ['amazed',        { surprise: 2 }],
  ['startled',      { surprise: 2 }],
  ['unbelievable',  { surprise: 2 }],
  ['incredible',    { surprise: 2 }],
  ['remarkable',    { surprise: 1 }],
  ['extraordinary', { surprise: 2 }],
  ['unprecedented', { surprise: 2 }],
  ['unforeseen',    { surprise: 2 }],
  ['curious',       { surprise: 1 }],
  ['baffled',       { surprise: 1 }],
  ['bewildered',    { surprise: 2 }],
  ['caught off guard', { surprise: 2 }],

  // TRUST (weight 2-3)
  ['reliable',      { trust: 3 }],
  ['trusted',       { trust: 3 }],
  ['confident',     { trust: 2 }],
  ['sure',          { trust: 2 }],
  ['certain',       { trust: 2 }],
  ['secure',        { trust: 2 }],
  ['safe',          { trust: 2 }],
  ['guaranteed',    { trust: 3 }],
  ['promise',       { trust: 2 }],
  ['committed',     { trust: 2 }],
  ['dedicated',     { trust: 2 }],
  ['honest',        { trust: 3 }],
  ['transparent',   { trust: 3 }],
  ['fair',          { trust: 2 }],
  ['professional',  { trust: 2 }],
  ['expert',        { trust: 2 }],
  ['experienced',   { trust: 2 }],
  ['verified',      { trust: 2 }],
  ['proven',        { trust: 2 }],
  ['assured',       { trust: 2 }],
  ['dependable',    { trust: 3 }],
  ['credible',      { trust: 2 }],
  ['legitimate',    { trust: 2 }],
  ['authentic',     { trust: 2 }],

  // ANTICIPATION (weight 1-2)
  ['waiting',       { anticipation: 2 }],
  ['expect',        { anticipation: 1 }],
  ['hoping',        { anticipation: 2 }],
  ['soon',          { anticipation: 1 }],
  ['pending',       { anticipation: 1 }],
  ['upcoming',      { anticipation: 1 }],
  ['scheduled',     { anticipation: 1 }],
  ['planned',       { anticipation: 1 }],
  ['follow up',     { anticipation: 1 }],
  ['check back',    { anticipation: 1 }],
  ['update',        { anticipation: 1 }],
  ['status',        { anticipation: 1 }],
  ['when',          { anticipation: 1 }],
  ['timeline',      { anticipation: 1 }],
  ['deadline',      { anticipation: 2 }],
  ['progress',      { anticipation: 1 }],
  ['eta',           { anticipation: 2 }],
  ['arrival',       { anticipation: 1 }],
  ['delivery',      { anticipation: 1 }],
  ['looking forward', { anticipation: 2 }],
  ['next steps',    { anticipation: 1 }],
]);

// Multi-word phrase keys (sorted by length desc for greedy matching)
const MULTI_WORD_PHRASES = Array.from(LEXICON.keys())
  .filter(k => k.includes(' '))
  .sort((a, b) => b.split(' ').length - a.split(' ').length);

// ─── Negation handling ──────────────────────────────────────────────────────

const NEGATION_WORDS = new Set([
  'not', 'never', 'no', "don't", "won't", "can't", "isn't",
  "wasn't", "doesn't", "haven't", 'hardly', 'barely',
]);

// Flip map: which emotion gets flipped to which when negated
const NEGATION_FLIP: Partial<Record<keyof EmotionScores, keyof EmotionScores>> = {
  anger: 'joy',
  joy: 'anger',
  fear: 'trust',
  trust: 'fear',
  sadness: 'joy',
  disgust: 'trust',
};

// ─── Core analysis helpers ───────────────────────────────────────────────────

function emptyScores(): EmotionScores {
  return { anger: 0, fear: 0, joy: 0, sadness: 0, disgust: 0, surprise: 0, trust: 0, anticipation: 0 };
}

function addScores(target: EmotionScores, addition: Partial<EmotionScores>, multiplier = 1): void {
  for (const [key, val] of Object.entries(addition) as Array<[keyof EmotionScores, number]>) {
    target[key] += val * multiplier;
  }
}

function applyNegation(scores: Partial<EmotionScores>): Partial<EmotionScores> {
  const result: Partial<EmotionScores> = {};
  for (const [key, val] of Object.entries(scores) as Array<[keyof EmotionScores, number]>) {
    const flip = NEGATION_FLIP[key];
    if (flip) {
      result[flip] = (result[flip] ?? 0) + val;
    } else {
      // No flip defined (surprise, anticipation) → reduce intensity by 0.5
      result[key] = val * 0.5;
    }
  }
  return result;
}

function normalizeScores(scores: EmotionScores): EmotionScores {
  const max = Math.max(...Object.values(scores));
  if (max === 0) return { ...scores };
  const normalized: EmotionScores = emptyScores();
  for (const key of Object.keys(scores) as Array<keyof EmotionScores>) {
    normalized[key] = scores[key] / max;
  }
  return normalized;
}

function buildProfile(scores: EmotionScores): EmotionProfile {
  const normalized = normalizeScores(scores);
  const entries = Object.entries(normalized) as Array<[keyof EmotionScores, number]>;
  const [dominantKey, dominantVal] = entries.reduce(
    (best, curr) => (curr[1] > best[1] ? curr : best),
    entries[0]
  );

  const dominant: keyof EmotionScores | 'neutral' =
    dominantVal < 0.05 ? 'neutral' : dominantKey;
  const intensity = Math.min(dominantVal, 1.0);

  return { dominant, scores: normalized, intensity };
}

function mergeProfiles(profiles: EmotionProfile[]): EmotionProfile {
  if (profiles.length === 0) {
    return buildProfile(emptyScores());
  }
  const combined = emptyScores();
  for (const p of profiles) {
    for (const key of Object.keys(p.scores) as Array<keyof EmotionScores>) {
      combined[key] += p.scores[key];
    }
  }
  // Average
  const count = profiles.length;
  for (const key of Object.keys(combined) as Array<keyof EmotionScores>) {
    combined[key] /= count;
  }
  return buildProfile(combined);
}

// ─── Text tokenization and scoring ──────────────────────────────────────────

function analyzeText(text: string): EmotionProfile {
  // Step 1: build lower-case version for lookup, keep original for CAPS detection
  const lower = text.toLowerCase();
  const scores = emptyScores();

  // Step 2: greedy multi-word phrase matching first
  let processedText = lower;
  const usedRanges: Array<[number, number]> = [];

  for (const phrase of MULTI_WORD_PHRASES) {
    let pos = 0;
    while (true) {
      const idx = processedText.indexOf(phrase, pos);
      if (idx === -1) break;
      // Ensure it's a word boundary (preceded and followed by non-word char or start/end)
      const before = idx === 0 || !/\w/.test(processedText[idx - 1]);
      const after = idx + phrase.length >= processedText.length || !/\w/.test(processedText[idx + phrase.length]);
      if (before && after) {
        // Check negation: look at the 20 chars before for negation words
        const context = processedText.slice(Math.max(0, idx - 25), idx);
        const contextTokens = context.trim().split(/[\s,!?.;:]+/).filter(Boolean);
        const recentNeg = contextTokens.slice(-3).some(t => NEGATION_WORDS.has(t));

        const entry = LEXICON.get(phrase)!;
        // CAPS amplification: check original text slice
        const originalSlice = text.slice(idx, idx + phrase.length);
        const capsAmp = originalSlice === originalSlice.toUpperCase() && /[A-Z]/.test(originalSlice) ? 1.3 : 1.0;

        const effective = recentNeg ? applyNegation(entry) : entry;
        addScores(scores, effective, capsAmp);
        usedRanges.push([idx, idx + phrase.length]);
      }
      pos = idx + 1;
    }
  }

  // Step 3: tokenize remaining text into single tokens
  // Replace used phrase ranges with spaces
  let masked = processedText;
  // Process ranges in reverse so indices stay valid
  for (const [start, end] of usedRanges.sort((a, b) => b[0] - a[0])) {
    masked = masked.slice(0, start) + ' '.repeat(end - start) + masked.slice(end);
  }

  const tokens = masked.split(/[\s,!?.;:()"']+/).filter(Boolean);
  const originalTokens = text.split(/[\s,!?.;:()"']+/).filter(Boolean);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token) continue;

    const entry = LEXICON.get(token);
    if (!entry) continue;

    // Negation context: look back 1-3 tokens
    const lookback = tokens.slice(Math.max(0, i - 3), i);
    const negated = lookback.some(t => NEGATION_WORDS.has(t));

    // CAPS amplification: compare with original token at same index
    const origToken = originalTokens[i] ?? '';
    const capsAmp = origToken === origToken.toUpperCase() && /[A-Z]/.test(origToken) ? 1.3 : 1.0;

    const effective = negated ? applyNegation(entry) : entry;
    addScores(scores, effective, capsAmp);
  }

  return buildProfile(scores);
}

// ─── Composite scores ────────────────────────────────────────────────────────

function computeFrustration(profile: EmotionProfile): number {
  const { anger, fear, sadness, disgust } = profile.scores;
  const score = anger * 0.4 + fear * 0.2 + sadness * 0.25 + disgust * 0.15;
  return Math.min(score, 1.0);
}

function computeSatisfaction(profile: EmotionProfile): number {
  const { joy, trust } = profile.scores;
  return Math.min(joy * 0.6 + trust * 0.4, 1.0);
}

function computeWarmth(profile: EmotionProfile): number {
  const { joy, trust } = profile.scores;
  return Math.min(joy * 0.5 + trust * 0.5, 1.0);
}

function computeAnxiety(profile: EmotionProfile): number {
  const { fear, anticipation } = profile.scores;
  return Math.min(fear * 0.6 + anticipation * 0.4, 1.0);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function analyzeEmotions(
  messages: Array<{ role: string; body: string; index: number }>
): ConversationEmotionAnalysis {
  // Per-message analysis
  const perMessage = messages.map(msg => ({
    index: msg.index,
    role: msg.role,
    profile: analyzeText(msg.body),
  }));

  // Split by role: 'user' → customer, 'admin' → agent
  const customerMessages = perMessage.filter(m => m.role === 'user');
  const agentMessages    = perMessage.filter(m => m.role === 'admin');

  // Customer arc & shifts
  const customerArc: Array<keyof EmotionScores | 'neutral'> =
    customerMessages.map(m => m.profile.dominant);

  let emotionShifts = 0;
  for (let i = 1; i < customerArc.length; i++) {
    if (customerArc[i] !== customerArc[i - 1]) emotionShifts++;
  }

  const customerOverall = mergeProfiles(customerMessages.map(m => m.profile));
  const agentOverall    = mergeProfiles(agentMessages.map(m => m.profile));

  return {
    perMessage,
    customer: {
      overall: customerOverall,
      arc: customerArc,
      emotionShifts,
      frustrationScore: computeFrustration(customerOverall),
      satisfactionScore: computeSatisfaction(customerOverall),
    },
    agent: {
      overall: agentOverall,
      warmthScore: computeWarmth(agentOverall),
      anxietyScore: computeAnxiety(agentOverall),
    },
  };
}
