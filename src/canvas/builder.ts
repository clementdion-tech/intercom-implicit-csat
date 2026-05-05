import { ScoredConversation } from '../analyzer/scorer';
import { getLanguageFlag } from '../config/cultural-calibration';

// Intercom Canvas Kit component builder
// Returns a Canvas JSON object per the Canvas Kit spec

function scoreColor(scorePct: number): string {
  if (scorePct <= 20) return '#e53935'; // red
  if (scorePct <= 40) return '#fb8c00'; // orange
  if (scorePct <= 60) return '#fdd835'; // yellow
  if (scorePct <= 80) return '#7cb342'; // light green
  return '#2e7d32'; // green
}

function progressBar(scorePct: number): string {
  const filled = Math.round(scorePct / 5); // 20 segments
  const empty = 20 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function arcArrow(arc: string): string {
  if (arc === 'rescued' || arc === 'stable_positive') return '↗';
  if (arc === 'declined' || arc === 'stable_negative') return '↘';
  if (arc === 'volatile') return '↕';
  return '→';
}

export function buildCanvas(scored: ScoredConversation | null, hasExplicitCsat: boolean, explicitCsatPct?: number | null): Record<string, unknown> {
  if (!scored) {
    return {
      canvas: {
        content: {
          components: [
            {
              type: 'text',
              text: 'IMPLICIT CSAT',
              style: 'header',
            },
            {
              type: 'text',
              text: 'Not yet analyzed. Click Re-analyze to score this conversation.',
              style: 'muted',
            },
            {
              type: 'button',
              id: 'analyze',
              label: 'Analyze Now',
              style: 'primary',
              action: { type: 'submit' },
            },
          ],
        },
      },
    };
  }

  const flag = getLanguageFlag(scored.language);
  const color = scoreColor(scored.scorePct);
  const bar = progressBar(scored.scorePct);
  const arrow = arcArrow(scored.arc);
  const churnIcon = scored.churnRisk === 'high' ? '🔴' : scored.churnRisk === 'medium' ? '🟠' : scored.churnRisk === 'low' ? '🟡' : '🟢';

  const arcLabel = scored.arc.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const styleLabel = scored.communicationStyle.replace(/_/g, '-').replace(/\b\w/g, c => c.toUpperCase());
  const deltaSign = scored.conversionDeltaPct >= 0 ? '+' : '';

  const components: Record<string, unknown>[] = [
    // Header row with language flag
    {
      type: 'text',
      text: `IMPLICIT CSAT          ${flag}  ${scored.language.toUpperCase()}`,
      style: 'header',
    },
    // Score + emoji
    {
      type: 'text',
      text: `${scored.emoji}  ${scored.label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`,
      style: 'paragraph',
    },
    // Progress bar
    {
      type: 'text',
      text: `${bar}  ${scored.scorePct}%`,
      style: 'muted',
    },
    // Arc + delta
    {
      type: 'text',
      text: `Arc: ${arrow} ${arcLabel}  Δ ${deltaSign}${scored.conversionDeltaPct}%`,
      style: 'muted',
    },
    // Style
    {
      type: 'text',
      text: `Style: ${styleLabel}`,
      style: 'muted',
    },
  ];

  // Burst badge (pulse animation not possible in Canvas Kit, but flag it clearly)
  if (scored.burstCount > 0) {
    const burstMsg = scored.burstInterpretation || `${scored.burstCount} burst(s) detected`;
    components.push({
      type: 'text',
      text: `⚡ ${burstMsg}`,
      style: 'error',
    });
  }

  // Key signal
  if (scored.keySignalSummary) {
    components.push(
      {
        type: 'text',
        text: 'Key signal:',
        style: 'muted',
      },
      {
        type: 'text',
        text: `"${scored.keySignalSummary}"`,
        style: 'paragraph',
      }
    );
  }

  // Churn risk
  components.push({
    type: 'text',
    text: `Churn Risk: ${churnIcon} ${scored.churnRisk.charAt(0).toUpperCase() + scored.churnRisk.slice(1)}`,
    style: scored.churnRisk === 'high' ? 'error' : 'muted',
  });

  // Confidence
  components.push({
    type: 'text',
    text: `Confidence: ${Math.round(scored.confidence * 100)}%`,
    style: 'muted',
  });

  // Explicit vs implicit comparison
  if (hasExplicitCsat && explicitCsatPct !== null && explicitCsatPct !== undefined) {
    const gap = Math.abs(scored.scorePct - explicitCsatPct);
    const match = gap <= 15 ? '✅ Match' : '⚠️ Mismatch';
    components.push({
      type: 'text',
      text: `Explicit CSAT: ${explicitCsatPct}% | Implicit: ${scored.scorePct}% | ${match} (gap: ${gap}%)`,
      style: 'muted',
    });
  } else {
    components.push({
      type: 'text',
      text: '📊 No CSAT — implicit only',
      style: 'muted',
    });
  }

  // Re-analyze button
  components.push({
    type: 'button',
    id: 'reanalyze',
    label: 'Re-analyze',
    style: 'secondary',
    action: { type: 'submit' },
  });

  return {
    canvas: {
      content: {
        components,
      },
    },
  };
}
