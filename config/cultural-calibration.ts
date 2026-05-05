export interface CulturalProfile {
  code: string;
  name: string;
  // Baseline sentiment offset applied before signal scoring
  neutralBaseline: number; // 0 = no shift, positive = raise neutral floor
  // Multiplier on directness signals (high = directness is cultural norm, lower impact)
  directnessNorm: number; // 0.0–1.0: 1.0 = very direct culture, reduce penalty
  // How strongly politeness signals carry positive weight
  politenessWeight: number; // 1.0 = baseline, higher = more meaningful when dropped
  // Exclamation marks are common in this culture (reduce negative weighting)
  exclamationNorm: boolean;
  // Brief/terse replies are culturally normal (reduce disengagement inference)
  terseNorm: boolean;
  // Positive hyperbole is normal (reduce positive score inflation)
  hyperbolicPositiveNorm: boolean;
  // Emoji use is neutral baseline (don't inflate positive)
  emojiNorm: boolean;
  notes: string;
}

export const CULTURAL_PROFILES: Record<string, CulturalProfile> = {
  en: {
    code: 'en',
    name: 'English',
    neutralBaseline: 0,
    directnessNorm: 0.5,
    politenessWeight: 1.0,
    exclamationNorm: false,
    terseNorm: false,
    hyperbolicPositiveNorm: false,
    emojiNorm: false,
    notes: 'Direct dissatisfaction expressed openly. Standard baseline.',
  },
  fr: {
    code: 'fr',
    name: 'French',
    neutralBaseline: 0,
    directnessNorm: 0.4,
    politenessWeight: 1.4, // Formal register breaking down = strong signal
    exclamationNorm: false,
    terseNorm: false,
    hyperbolicPositiveNorm: false,
    emojiNorm: false,
    notes: 'Tu/vous shift indicates frustration. Ellipsis = passive resignation.',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    neutralBaseline: 5,
    directnessNorm: 0.45,
    politenessWeight: 1.2,
    exclamationNorm: true,
    terseNorm: false,
    hyperbolicPositiveNorm: false,
    emojiNorm: false,
    notes: 'Warmth markers baseline. Sudden formality = cold frustration.',
  },
  de: {
    code: 'de',
    name: 'German',
    neutralBaseline: 10, // Raise neutral floor — directness is cultural norm
    directnessNorm: 0.9,
    politenessWeight: 1.0,
    exclamationNorm: false,
    terseNorm: false,
    hyperbolicPositiveNorm: false,
    emojiNorm: false,
    notes: 'Extreme directness is cultural norm — do not over-penalize bluntness.',
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    neutralBaseline: 0,
    directnessNorm: 0.1, // Directness is highly unusual = strong signal
    politenessWeight: 2.0,
    exclamationNorm: false,
    terseNorm: false, // Short replies = strong dissatisfaction
    hyperbolicPositiveNorm: false,
    emojiNorm: false,
    notes: 'Extremely polite even when frustrated. Short replies = strong dissatisfaction.',
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    neutralBaseline: 0,
    directnessNorm: 0.15,
    politenessWeight: 1.8,
    exclamationNorm: false,
    terseNorm: false,
    hyperbolicPositiveNorm: false,
    emojiNorm: false,
    notes: 'Similar to Japanese. Directness = unusual = strong signal.',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    neutralBaseline: 5,
    directnessNorm: 0.5,
    politenessWeight: 1.0,
    exclamationNorm: false,
    terseNorm: false,
    hyperbolicPositiveNorm: true, // Hyperbolic positive is cultural norm
    emojiNorm: false,
    notes: 'Hyperbolic positive language is cultural norm. Calibrate praise down.',
  },
  pt: {
    code: 'pt',
    name: 'Portuguese (BR)',
    neutralBaseline: 5,
    directnessNorm: 0.5,
    politenessWeight: 1.0,
    exclamationNorm: false,
    terseNorm: false,
    hyperbolicPositiveNorm: false,
    emojiNorm: true, // Emoji-heavy is neutral baseline
    notes: 'Emoji-heavy communication is neutral baseline in BR Portuguese.',
  },
  it: {
    code: 'it',
    name: 'Italian',
    neutralBaseline: 5,
    directnessNorm: 0.4,
    politenessWeight: 1.1,
    exclamationNorm: true, // Expressive punctuation normal
    terseNorm: false,
    hyperbolicPositiveNorm: false,
    emojiNorm: false,
    notes: 'Expressive punctuation is normal. Lower exclamation sensitivity.',
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    neutralBaseline: 5,
    directnessNorm: 0.8,
    politenessWeight: 1.5, // Warmth markers carry extra weight
    exclamationNorm: false,
    terseNorm: true, // Terse directness is neutral
    hyperbolicPositiveNorm: false,
    emojiNorm: false,
    notes: 'Terse directness is neutral. Warmth markers carry extra positive weight.',
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    neutralBaseline: 0,
    directnessNorm: 0.2,
    politenessWeight: 1.6,
    exclamationNorm: false,
    terseNorm: false,
    hyperbolicPositiveNorm: false,
    emojiNorm: false,
    notes: 'Very indirect frustration. Formal complaint = serious escalation.',
  },
  nl: {
    code: 'nl',
    name: 'Dutch',
    neutralBaseline: 8,
    directnessNorm: 0.95,
    politenessWeight: 1.0,
    exclamationNorm: false,
    terseNorm: false,
    hyperbolicPositiveNorm: false,
    emojiNorm: false,
    notes: 'Extremely direct = cultural norm. Adjust aggression baseline significantly.',
  },
  hi: {
    code: 'hi',
    name: 'Hindi/Urdu',
    neutralBaseline: 0,
    directnessNorm: 0.3,
    politenessWeight: 1.7,
    exclamationNorm: false,
    terseNorm: false,
    hyperbolicPositiveNorm: false,
    emojiNorm: false,
    notes: 'Elaborate politeness is baseline. Dropping honorifics = frustration.',
  },
  th: {
    code: 'th',
    name: 'Thai',
    neutralBaseline: 0,
    directnessNorm: 0.15,
    politenessWeight: 2.0,
    exclamationNorm: false,
    terseNorm: false,
    hyperbolicPositiveNorm: false,
    emojiNorm: false,
    notes: 'krub/ka dropping = frustration. Face-saving means frustration is rarely explicit.',
  },
  pl: { code: 'pl', name: 'Polish', neutralBaseline: 5, directnessNorm: 0.6, politenessWeight: 1.1, exclamationNorm: false, terseNorm: false, hyperbolicPositiveNorm: false, emojiNorm: false, notes: '' },
  tr: { code: 'tr', name: 'Turkish', neutralBaseline: 0, directnessNorm: 0.5, politenessWeight: 1.2, exclamationNorm: false, terseNorm: false, hyperbolicPositiveNorm: false, emojiNorm: false, notes: '' },
  sv: { code: 'sv', name: 'Swedish', neutralBaseline: 5, directnessNorm: 0.7, politenessWeight: 1.0, exclamationNorm: false, terseNorm: true, hyperbolicPositiveNorm: false, emojiNorm: false, notes: '' },
  da: { code: 'da', name: 'Danish', neutralBaseline: 5, directnessNorm: 0.7, politenessWeight: 1.0, exclamationNorm: false, terseNorm: true, hyperbolicPositiveNorm: false, emojiNorm: false, notes: '' },
  fi: { code: 'fi', name: 'Finnish', neutralBaseline: 8, directnessNorm: 0.85, politenessWeight: 1.0, exclamationNorm: false, terseNorm: true, hyperbolicPositiveNorm: false, emojiNorm: false, notes: 'Very terse = cultural norm.' },
  no: { code: 'no', name: 'Norwegian', neutralBaseline: 5, directnessNorm: 0.7, politenessWeight: 1.0, exclamationNorm: false, terseNorm: true, hyperbolicPositiveNorm: false, emojiNorm: false, notes: '' },
  he: { code: 'he', name: 'Hebrew', neutralBaseline: 5, directnessNorm: 0.6, politenessWeight: 1.0, exclamationNorm: false, terseNorm: false, hyperbolicPositiveNorm: false, emojiNorm: false, notes: '' },
  vi: { code: 'vi', name: 'Vietnamese', neutralBaseline: 0, directnessNorm: 0.3, politenessWeight: 1.5, exclamationNorm: false, terseNorm: false, hyperbolicPositiveNorm: false, emojiNorm: false, notes: '' },
  id: { code: 'id', name: 'Indonesian', neutralBaseline: 5, directnessNorm: 0.4, politenessWeight: 1.3, exclamationNorm: false, terseNorm: false, hyperbolicPositiveNorm: false, emojiNorm: false, notes: '' },
  ms: { code: 'ms', name: 'Malay', neutralBaseline: 5, directnessNorm: 0.4, politenessWeight: 1.3, exclamationNorm: false, terseNorm: false, hyperbolicPositiveNorm: false, emojiNorm: false, notes: '' },
};

export function getCulturalProfile(langCode: string): CulturalProfile {
  const base = langCode.split('-')[0].toLowerCase();
  return CULTURAL_PROFILES[base] ?? CULTURAL_PROFILES['en'];
}

// ISO 639-1 → emoji flag mapping
export const LANGUAGE_FLAGS: Record<string, string> = {
  en: '🇬🇧', fr: '🇫🇷', es: '🇪🇸', de: '🇩🇪', ja: '🇯🇵', ko: '🇰🇷',
  ar: '🇸🇦', pt: '🇧🇷', it: '🇮🇹', ru: '🇷🇺', zh: '🇨🇳', nl: '🇳🇱',
  hi: '🇮🇳', pl: '🇵🇱', tr: '🇹🇷', sv: '🇸🇪', da: '🇩🇰', fi: '🇫🇮',
  no: '🇳🇴', he: '🇮🇱', th: '🇹🇭', vi: '🇻🇳', id: '🇮🇩', ms: '🇲🇾',
};

export function getLanguageFlag(langCode: string): string {
  const base = langCode.split('-')[0].toLowerCase();
  return LANGUAGE_FLAGS[base] ?? '🌐';
}
