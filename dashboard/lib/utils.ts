export function scoreColor(scorePct: number): string {
  if (scorePct <= 20) return '#e53935';
  if (scorePct <= 40) return '#fb8c00';
  if (scorePct <= 60) return '#fdd835';
  if (scorePct <= 80) return '#7cb342';
  return '#2e7d32';
}

export function scoreBgClass(scorePct: number): string {
  if (scorePct <= 20) return 'bg-red-600';
  if (scorePct <= 40) return 'bg-orange-500';
  if (scorePct <= 60) return 'bg-yellow-400';
  if (scorePct <= 80) return 'bg-lime-500';
  return 'bg-green-700';
}

export function scoreTextClass(scorePct: number): string {
  if (scorePct <= 20) return 'text-red-600';
  if (scorePct <= 40) return 'text-orange-500';
  if (scorePct <= 60) return 'text-yellow-600';
  if (scorePct <= 80) return 'text-lime-600';
  return 'text-green-700';
}

export function churnBadge(risk: string): string {
  if (risk === 'high') return '🔴 High';
  if (risk === 'medium') return '🟠 Medium';
  if (risk === 'low') return '🟡 Low';
  return '🟢 None';
}

export function arcArrow(arc: string): string {
  if (arc === 'rescued' || arc === 'stable_positive') return '↗';
  if (arc === 'declined' || arc === 'stable_negative') return '↘';
  if (arc === 'volatile') return '↕';
  return '→';
}

export function styleLabel(style: string): string {
  return style.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export const LANGUAGE_FLAGS: Record<string, string> = {
  en: '🇬🇧', fr: '🇫🇷', es: '🇪🇸', de: '🇩🇪', ja: '🇯🇵', ko: '🇰🇷',
  ar: '🇸🇦', pt: '🇧🇷', it: '🇮🇹', ru: '🇷🇺', zh: '🇨🇳', nl: '🇳🇱',
  hi: '🇮🇳', pl: '🇵🇱', tr: '🇹🇷', sv: '🇸🇪', da: '🇩🇰', fi: '🇫🇮',
  no: '🇳🇴', he: '🇮🇱', th: '🇹🇭', vi: '🇻🇳', id: '🇮🇩', ms: '🇲🇾',
};

export function langFlag(code: string): string {
  return LANGUAGE_FLAGS[code?.split('-')[0]?.toLowerCase()] ?? '🌐';
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
