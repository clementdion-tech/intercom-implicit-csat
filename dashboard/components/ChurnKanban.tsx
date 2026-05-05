'use client';

import { ChurnData, ConversationRow } from '../lib/api';
import { scoreColor, langFlag, styleLabel } from '../lib/utils';

function ConversationCard({ c }: { c: ConversationRow }) {
  const intercomUrl = `https://app.intercom.io/a/inbox/all/conversations/${c.intercomId}`;
  return (
    <a
      href={intercomUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-slate-700 hover:bg-slate-600 rounded-lg p-3 transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <span>{langFlag(c.language)}</span>
        <span className="text-xs font-bold text-white px-1.5 py-0.5 rounded" style={{ background: scoreColor(c.scorePct) }}>
          {c.scorePct}%
        </span>
        <span>{c.emoji}</span>
        <span className="text-slate-400 text-xs flex-1 truncate">{styleLabel(c.communicationStyle)}</span>
      </div>
      {c.keySignalSummary && (
        <p className="text-slate-400 text-xs line-clamp-2">{c.keySignalSummary}</p>
      )}
      <div className="text-slate-500 text-xs mt-1">
        {c.analyzedAt ? new Date(c.analyzedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
      </div>
    </a>
  );
}

function Column({ title, color, conversations }: { title: string; color: string; conversations: ConversationRow[] }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2.5 h-2.5 rounded-full`} style={{ background: color }} />
        <span className="text-white font-semibold text-sm">{title}</span>
        <span className="ml-auto text-slate-400 text-xs">{conversations.length}</span>
      </div>
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {conversations.length === 0 ? (
          <div className="text-slate-500 text-xs text-center py-4">No conversations</div>
        ) : (
          conversations.map(c => <ConversationCard key={c.intercomId} c={c} />)
        )}
      </div>
    </div>
  );
}

export default function ChurnKanban({ data }: { data: ChurnData }) {
  return (
    <div className="flex gap-4">
      <Column title="🔴 High Risk" color="#e53935" conversations={data.high} />
      <Column title="🟠 Medium Risk" color="#fb8c00" conversations={data.medium} />
      <Column title="🟡 Low Risk" color="#fdd835" conversations={data.low} />
    </div>
  );
}
