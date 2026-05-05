'use client';

import { useState } from 'react';
import { ConversationRow } from '../lib/api';
import { scoreColor, langFlag, arcArrow, styleLabel, churnBadge, formatDate } from '../lib/utils';

interface ConversationTableProps {
  conversations: ConversationRow[];
  pagination?: { total: number; page: number; limit: number; totalPages: number };
  onPageChange?: (page: number) => void;
}

export default function ConversationTable({ conversations, pagination, onPageChange }: ConversationTableProps) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left">
              <th className="pb-3 pr-3 text-slate-400 font-medium">Score</th>
              <th className="pb-3 pr-3 text-slate-400 font-medium">Lang</th>
              <th className="pb-3 pr-3 text-slate-400 font-medium">Style</th>
              <th className="pb-3 pr-3 text-slate-400 font-medium">Arc</th>
              <th className="pb-3 pr-3 text-slate-400 font-medium">Churn</th>
              <th className="pb-3 pr-3 text-slate-400 font-medium">Bursts</th>
              <th className="pb-3 pr-3 text-slate-400 font-medium">Key Signal</th>
              <th className="pb-3 pr-3 text-slate-400 font-medium">Analyzed</th>
              <th className="pb-3 text-slate-400 font-medium">Link</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map(c => (
              <tr key={c.intercomId} className="table-row">
                <td className="py-2.5 pr-3">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="font-bold text-sm" style={{ color: scoreColor(c.scorePct) }}>
                      {c.scorePct}%
                    </span>
                    <span>{c.emoji}</span>
                  </span>
                </td>
                <td className="py-2.5 pr-3">
                  <span title={c.language}>{langFlag(c.language)} {c.language.toUpperCase()}</span>
                </td>
                <td className="py-2.5 pr-3 text-slate-300 text-xs max-w-[140px] truncate">
                  {styleLabel(c.communicationStyle)}
                </td>
                <td className="py-2.5 pr-3 text-slate-300">
                  {c.arc ? `${arcArrow(c.arc)} ${c.arc.replace(/_/g, ' ')}` : '—'}
                </td>
                <td className="py-2.5 pr-3">
                  {c.churnRisk ? (
                    <span className={`badge text-xs ${
                      c.churnRisk === 'high' ? 'bg-red-900 text-red-300' :
                      c.churnRisk === 'medium' ? 'bg-orange-900 text-orange-300' :
                      'bg-slate-700 text-slate-400'
                    }`}>
                      {c.churnRisk}
                    </span>
                  ) : '—'}
                </td>
                <td className="py-2.5 pr-3 text-slate-300">
                  {c.burstCount && c.burstCount > 0 ? (
                    <span className="badge bg-orange-900 text-orange-300">⚡ {c.burstCount}</span>
                  ) : '—'}
                </td>
                <td className="py-2.5 pr-3 text-slate-400 text-xs max-w-[200px] truncate">
                  {c.keySignalSummary ?? '—'}
                </td>
                <td className="py-2.5 pr-3 text-slate-500 text-xs whitespace-nowrap">
                  {c.analyzedAt ? formatDate(c.analyzedAt) : '—'}
                </td>
                <td className="py-2.5">
                  <a
                    href={c.intercomUrl ?? `https://app.intercom.io/a/inbox/all/conversations/${c.intercomId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-xs"
                  >
                    Open ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
          <span className="text-slate-400 text-sm">
            {pagination.total} total • Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-sm disabled:opacity-40 hover:bg-slate-600 transition-colors"
            >
              ← Prev
            </button>
            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-sm disabled:opacity-40 hover:bg-slate-600 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
