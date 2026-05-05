'use client';

import { useLiveFeed } from '../lib/websocket';
import { scoreColor, langFlag, arcArrow, styleLabel, churnBadge } from '../lib/utils';

export default function LiveFeed() {
  const { events, connected } = useLiveFeed(20);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold">Live Feed</h2>
        <span className={`badge ${connected ? 'bg-green-900 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
          {connected ? '● Live' : '○ Connecting...'}
        </span>
      </div>

      {events.length === 0 && (
        <div className="text-slate-400 text-sm text-center py-8">
          Waiting for scored conversations...
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {events.map((e) => (
          <a
            key={`${e.intercomId}-${e.analyzedAt}`}
            href={`${apiUrl.replace('/api', '')}/app/inbox/all/conversations/${e.intercomId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors text-sm group"
          >
            <span className="text-base">{langFlag(e.language)}</span>
            <span className={`badge text-white text-xs font-bold`} style={{ background: scoreColor(e.scorePct) }}>
              {e.scorePct}%
            </span>
            <span className="text-lg">{e.emoji}</span>
            <span className="text-slate-300 text-xs font-medium">{arcArrow(e.arc)}</span>
            <span className="text-slate-400 text-xs truncate flex-1">{styleLabel(e.style)}</span>
            {e.churnRisk === 'high' && (
              <span className="badge bg-red-900 text-red-400 text-xs">🔴 High</span>
            )}
            <span className="text-slate-500 text-xs">
              {new Date(e.analyzedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
