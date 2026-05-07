'use client';

import { NesData } from '../lib/api';

interface NetEmpathicScoreProps {
  data: NesData;
}

function nesColor(nes: number | null): string {
  if (nes === null) return 'text-slate-400';
  if (nes >= 30) return 'text-green-400';
  if (nes >= 0) return 'text-yellow-400';
  return 'text-red-400';
}

export default function NetEmpathicScore({ data }: NetEmpathicScoreProps) {
  const { nes, empatheticPct, neutralPct, unempatheticPct, empathetic, neutral, unempathetic, total } = data;

  return (
    <div className="card space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-white font-semibold text-lg">Net Empathic Score</h2>
        <p className="text-slate-400 text-sm mt-0.5">Agent empathy quality across all conversations</p>
      </div>

      {/* NES number */}
      <div className="flex items-baseline gap-3">
        <span className={`text-5xl font-bold ${nesColor(nes)}`}>
          {nes !== null ? (nes > 0 ? `+${nes}` : `${nes}`) : 'N/A'}
        </span>
        <span className="text-slate-400 text-sm">out of ±100</span>
      </div>

      {/* Segmented bar */}
      <div className="space-y-2">
        <div className="flex w-full h-4 rounded-full overflow-hidden gap-0.5">
          {empatheticPct > 0 && (
            <div
              className="bg-green-500 transition-all duration-500"
              style={{ width: `${empatheticPct}%` }}
              title={`Empathetic: ${empatheticPct}%`}
            />
          )}
          {neutralPct > 0 && (
            <div
              className="bg-slate-500 transition-all duration-500"
              style={{ width: `${neutralPct}%` }}
              title={`Neutral: ${neutralPct}%`}
            />
          )}
          {unempatheticPct > 0 && (
            <div
              className="bg-red-500 transition-all duration-500"
              style={{ width: `${unempatheticPct}%` }}
              title={`Unempathetic: ${unempatheticPct}%`}
            />
          )}
          {total === 0 && (
            <div className="bg-slate-700 w-full" />
          )}
        </div>

        {/* Percentage labels below bar */}
        <div className="flex w-full text-xs">
          <div className="text-green-400" style={{ width: `${empatheticPct}%` }}>
            {empatheticPct > 8 && `${empatheticPct}%`}
          </div>
          <div className="text-slate-400 text-center" style={{ width: `${neutralPct}%` }}>
            {neutralPct > 8 && `${neutralPct}%`}
          </div>
          <div className="text-red-400 text-right" style={{ width: `${unempatheticPct}%` }}>
            {unempatheticPct > 8 && `${unempatheticPct}%`}
          </div>
        </div>
      </div>

      {/* Stat pills */}
      <div className="flex flex-wrap gap-2">
        <div className="inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          Empathetic {empatheticPct}%
          <span className="text-green-500/60 ml-1">({empathetic})</span>
        </div>
        <div className="inline-flex items-center gap-1.5 bg-slate-500/10 border border-slate-500/30 text-slate-400 text-xs font-medium px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
          Neutral {neutralPct}%
          <span className="text-slate-500/60 ml-1">({neutral})</span>
        </div>
        <div className="inline-flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          Unempathetic {unempatheticPct}%
          <span className="text-red-500/60 ml-1">({unempathetic})</span>
        </div>
      </div>

      {/* Footnote */}
      <p className="text-slate-500 text-xs border-t border-slate-700 pt-3">
        Empathetic ≥70 · Unempathetic &lt;40 · NES = %Empathetic − %Unempathetic
      </p>
    </div>
  );
}
