import { api } from '../../lib/api';
import StyleDonut from '../../components/StyleDonut';
import { scoreColor, arcArrow } from '../../lib/utils';

export const revalidate = 60;

const STYLE_DESCRIPTIONS: Record<string, string> = {
  passive_aggressive: 'Indirect frustration through sarcasm, over-politeness, or resigned compliance. Highest churn correlation.',
  direct_aggressive: 'Explicit frustration through profanity, threats, or escalation demands.',
  anxious_urgent: 'Time pressure, over-explaining, or reassurance-seeking. Often resolves positively with empathy.',
  disengaged_resigned: 'Declining message length, monosyllabic replies, "I\'ll figure it out myself." Silent churn risk.',
  genuinely_positive: 'Unprompted praise, humor, personal details shared. Strong satisfaction signal.',
  neutral_transactional: 'Professional, task-focused, minimal emotional signal.',
};

export default async function StylesPage() {
  const { styles } = await api.styles();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Communication Styles</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          How customers express themselves — and what it signals about satisfaction
        </p>
      </div>

      <StyleDonut data={{ styles }} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {styles.map(s => (
          <div key={s.style} className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold text-sm">
                {s.style.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
              <span className="badge bg-slate-700 text-slate-300 text-xs">{s.count}</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              {STYLE_DESCRIPTIONS[s.style] ?? ''}
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-slate-500 text-xs">Avg Score</div>
                <div className="font-bold text-sm" style={{ color: scoreColor(s.avgScorePct) }}>
                  {s.avgScorePct}%
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Churn Rate</div>
                <div className={`font-bold text-sm ${s.churnRatePct >= 20 ? 'text-red-400' : s.churnRatePct >= 10 ? 'text-orange-400' : 'text-slate-300'}`}>
                  {s.churnRatePct}%
                </div>
              </div>
              <div>
                <div className="text-slate-500 text-xs">Common Arc</div>
                <div className="text-slate-300 text-sm">
                  {arcArrow(s.mostCommonArc)} {s.mostCommonArc.replace(/_/g, ' ')}
                </div>
              </div>
            </div>
            {s.style === 'passive_aggressive' && (
              <div className="mt-3 pt-3 border-t border-slate-700">
                <span className="badge bg-red-900 text-red-300 text-xs">⚠ Highest churn correlation</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
