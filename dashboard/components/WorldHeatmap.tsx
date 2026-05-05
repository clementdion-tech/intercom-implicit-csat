'use client';

import { LanguagesData } from '../lib/api';
import { langFlag, scoreColor } from '../lib/utils';

// Simple language → avg score color visualization
// A proper world map requires react-simple-maps which adds bundle size;
// this table-based implementation works reliably with static export.

export default function WorldHeatmap({ data }: { data: LanguagesData }) {
  const sorted = [...data.languages].sort((a, b) => b.count - a.count);

  return (
    <div className="card">
      <h2 className="text-white font-semibold mb-4">Language Score Heatmap</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sorted.map(lang => (
          <div
            key={lang.language}
            className="rounded-lg p-3 border border-slate-700 flex items-center gap-3"
            style={{ borderLeftColor: scoreColor(lang.avgScorePct), borderLeftWidth: 3 }}
          >
            <span className="text-2xl">{langFlag(lang.language)}</span>
            <div className="min-w-0">
              <div className="text-white font-medium text-sm">{lang.language.toUpperCase()}</div>
              <div className="font-bold text-sm" style={{ color: scoreColor(lang.avgScorePct) }}>
                {lang.avgScorePct}%
              </div>
              <div className="text-slate-500 text-xs">{lang.count} conversations</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
