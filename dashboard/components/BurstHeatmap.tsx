'use client';

import { BurstsData } from '../lib/api';
import { scoreColor } from '../lib/utils';

export default function BurstHeatmap({ data }: { data: BurstsData }) {
  const burstPct = data.withBursts + data.withoutBursts > 0
    ? Math.round((data.withBursts / (data.withBursts + data.withoutBursts)) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Comparison card */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-slate-400 text-xs mb-1">Burst Conversations</div>
          <div className="text-3xl font-bold text-orange-400">{data.withBursts}</div>
          <div className="text-slate-500 text-xs mt-1">{burstPct}% of total</div>
        </div>
        <div className="card text-center">
          <div className="text-slate-400 text-xs mb-1">Burst Avg Score</div>
          <div className="text-3xl font-bold" style={{ color: data.burstAvgScorePct ? scoreColor(data.burstAvgScorePct) : '#64748b' }}>
            {data.burstAvgScorePct !== null ? `${data.burstAvgScorePct}%` : 'N/A'}
          </div>
        </div>
        <div className="card text-center">
          <div className="text-slate-400 text-xs mb-1">No-Burst Avg Score</div>
          <div className="text-3xl font-bold" style={{ color: data.noBurstAvgScorePct ? scoreColor(data.noBurstAvgScorePct) : '#64748b' }}>
            {data.noBurstAvgScorePct !== null ? `${data.noBurstAvgScorePct}%` : 'N/A'}
          </div>
        </div>
      </div>

      {/* Burst conversation list */}
      <div className="card">
        <h3 className="text-white font-semibold mb-3">Recent Burst Conversations</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="pb-2 pr-3 text-slate-400 font-medium text-xs">Score</th>
                <th className="pb-2 pr-3 text-slate-400 font-medium text-xs">Bursts</th>
                <th className="pb-2 pr-3 text-slate-400 font-medium text-xs">Lang</th>
                <th className="pb-2 pr-3 text-slate-400 font-medium text-xs">Style</th>
                <th className="pb-2 pr-3 text-slate-400 font-medium text-xs">Agent</th>
                <th className="pb-2 text-slate-400 font-medium text-xs">Link</th>
              </tr>
            </thead>
            <tbody>
              {data.burstConversations.map(c => (
                <tr key={c.intercomId} className="border-b border-slate-700">
                  <td className="py-2 pr-3">
                    <span className="font-bold" style={{ color: scoreColor(c.scorePct) }}>{c.scorePct}%</span>
                    {' '}{c.emoji}
                  </td>
                  <td className="py-2 pr-3">
                    <span className="badge bg-orange-900 text-orange-300">⚡ {c.burstCount}</span>
                  </td>
                  <td className="py-2 pr-3 text-slate-300 text-xs">{c.language?.toUpperCase()}</td>
                  <td className="py-2 pr-3 text-slate-400 text-xs">{c.communicationStyle?.replace(/_/g, ' ')}</td>
                  <td className="py-2 pr-3 text-slate-500 text-xs font-mono">{c.agentId ?? '—'}</td>
                  <td className="py-2">
                    <a
                      href={`https://app.intercom.io/a/inbox/all/conversations/${c.intercomId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 text-xs"
                    >
                      Open ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
