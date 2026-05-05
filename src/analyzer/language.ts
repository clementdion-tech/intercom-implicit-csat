import { getCulturalProfile } from '../config/cultural-calibration';

export interface LanguageDetectionResult {
  primary: string;
  all: string[];
  codeSwitchingDetected: boolean;
  codeSwitchingSignal: string | null;
}

// Heuristic language detection per message using character ranges and keyword patterns.
// Claude also detects language — this is a fast pre-pass for burst detection context.
export function detectMessageLanguage(text: string): string {
  if (!text || text.trim().length < 3) return 'en';

  // CJK
  if (/[一-鿿㐀-䶿]/.test(text)) return 'zh';
  if (/[぀-ゟ゠-ヿ]/.test(text)) return 'ja';
  if (/[가-힯]/.test(text)) return 'ko';
  // Arabic
  if (/[؀-ۿ]/.test(text)) return 'ar';
  // Hebrew
  if (/[֐-׿]/.test(text)) return 'he';
  // Thai
  if (/[฀-๿]/.test(text)) return 'th';
  // Devanagari (Hindi)
  if (/[ऀ-ॿ]/.test(text)) return 'hi';
  // Cyrillic (Russian)
  if (/[Ѐ-ӿ]/.test(text)) return 'ru';

  return 'en'; // Fallback — Claude will refine this
}

export function analyzeCodeSwitching(messages: Array<{ role: string; body: string }>): LanguageDetectionResult {
  const customerMessages = messages.filter(m => m.role === 'user' || m.role === 'customer');
  const detectedLanguages = customerMessages.map(m => detectMessageLanguage(m.body));

  const uniqueLangs = [...new Set(detectedLanguages.filter(Boolean))];
  const primary = detectedLanguages[0] ?? 'en';

  const codeSwitchingDetected = uniqueLangs.length > 1;
  let codeSwitchingSignal: string | null = null;

  if (codeSwitchingDetected) {
    const switchPoints = detectedLanguages
      .map((lang, i) => ({ lang, i }))
      .filter((item, i) => i > 0 && item.lang !== detectedLanguages[i - 1]);

    if (switchPoints.length > 0) {
      const firstSwitch = switchPoints[0];
      codeSwitchingSignal = `Customer switched from ${detectedLanguages[firstSwitch.i - 1]} to ${firstSwitch.lang} at message ${firstSwitch.i} — possible stress indicator`;
    }
  }

  return { primary, all: uniqueLangs, codeSwitchingDetected, codeSwitchingSignal };
}

export function getScoreLabelAndEmoji(scorePct: number): { label: string; emoji: string } {
  if (scorePct <= 20) return { label: 'very_dissatisfied', emoji: '😠' };
  if (scorePct <= 40) return { label: 'dissatisfied', emoji: '😞' };
  if (scorePct <= 60) return { label: 'neutral', emoji: '😐' };
  if (scorePct <= 80) return { label: 'satisfied', emoji: '😊' };
  return { label: 'very_satisfied', emoji: '😄' };
}

export function getChurnRiskLabel(scorePct: number, style: string, burstCount: number): string {
  if (scorePct <= 20 || (scorePct <= 40 && burstCount >= 2)) return 'high';
  if (scorePct <= 40 || style === 'disengaged_resigned') return 'medium';
  if (scorePct <= 60 && burstCount >= 1) return 'medium';
  if (scorePct >= 61) return 'low';
  return 'none';
}

export function applyNeutralBaseline(rawScore: number, langCode: string): number {
  const profile = getCulturalProfile(langCode);
  return Math.min(100, Math.max(0, rawScore + profile.neutralBaseline));
}
