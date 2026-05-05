import { api } from '../../lib/api';
import { langFlag, scoreColor, styleLabel } from '../../lib/utils';

export const revalidate = 60;

export default async function LanguagesPage() {
  const { languages } = await api.languages();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Languages</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Sentiment breakdown by detected language — with cultural calibration applied
        </p>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="pb-3 pr-4 text-slate-400 font-medium">Language</th>
                <th className="pb-3 pr-4 text-slate-400 font-medium">Conversations</th>
                <th className="pb-3 pr-4 text-slate-400 font-medium">Avg Score %</th>
                <th className="pb-3 pr-4 text-slate-400 font-medium">Dominant Style</th>
                <th className="pb-3 text-slate-400 font-medium">Churn Rate</th>
              </tr>
            </thead>
            <tbody>
              {languages.map(lang => (
                <tr key={lang.language} className="border-b border-slate-700 hover:bg-slate-750">
                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-2">
                      <span className="text-xl">{langFlag(lang.language)}</span>
                      <span className="text-white font-medium">{lang.language.toUpperCase()}</span>
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-300">{lang.count.toLocaleString()}</td>
                  <td className="py-3 pr-4">
                    <span className="font-bold" style={{ color: scoreColor(lang.avgScorePct) }}>
                      {lang.avgScorePct}%
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-400 text-sm">{styleLabel(lang.topStyle)}</td>
                  <td className="py-3">
                    <span className={`badge ${
                      lang.churnRatePct >= 20 ? 'bg-red-900 text-red-300' :
                      lang.churnRatePct >= 10 ? 'bg-orange-900 text-orange-300' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {lang.churnRatePct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {languages.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No language data yet. Run a batch to score conversations.
          </div>
        )}
      </div>
    </div>
  );
}
