'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, ConversationsData } from '../../lib/api';
import ConversationTable from '../../components/ConversationTable';

const STYLES = [
  '', 'passive_aggressive', 'direct_aggressive', 'anxious_urgent',
  'disengaged_resigned', 'genuinely_positive', 'neutral_transactional',
];

const ARCS = ['', 'rescued', 'declined', 'stable_positive', 'stable_neutral', 'stable_negative', 'volatile'];
const CHURN_RISKS = ['', 'high', 'medium', 'low', 'none'];
const LANGS = ['', 'en', 'fr', 'es', 'de', 'ja', 'ko', 'ar', 'pt', 'it', 'ru', 'zh', 'nl', 'hi'];

export default function ConversationsPage() {
  const [data, setData] = useState<ConversationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    score_min: '', score_max: '', style: '', lang: '', churn_risk: '', arc: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: page.toString(), limit: '50' };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const result = await api.conversations(params);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  function handleFilterChange(key: string, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function handleExportCSV() {
    if (!data) return;
    const headers = ['intercomId', 'scorePct', 'label', 'language', 'communicationStyle', 'arc', 'churnRisk', 'burstCount', 'keySignalSummary', 'analyzedAt', 'intercomUrl'];
    const rows = data.conversations.map(c => headers.map(h => (c as Record<string, unknown>)[h] ?? '').join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `implicit-csat-conversations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Conversations</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {data?.pagination.total.toLocaleString() ?? '…'} conversations scored
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="text-slate-400 text-xs block mb-1">Score Min %</label>
            <input
              type="number"
              min={0} max={100}
              value={filters.score_min}
              onChange={e => handleFilterChange('score_min', e.target.value)}
              placeholder="0"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Score Max %</label>
            <input
              type="number"
              min={0} max={100}
              value={filters.score_max}
              onChange={e => handleFilterChange('score_max', e.target.value)}
              placeholder="100"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Language</label>
            <select
              value={filters.lang}
              onChange={e => handleFilterChange('lang', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm"
            >
              {LANGS.map(l => <option key={l} value={l}>{l || 'All languages'}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Style</label>
            <select
              value={filters.style}
              onChange={e => handleFilterChange('style', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm"
            >
              {STYLES.map(s => <option key={s} value={s}>{s ? s.replace(/_/g, ' ') : 'All styles'}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Arc</label>
            <select
              value={filters.arc}
              onChange={e => handleFilterChange('arc', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm"
            >
              {ARCS.map(a => <option key={a} value={a}>{a ? a.replace(/_/g, ' ') : 'All arcs'}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Churn Risk</label>
            <select
              value={filters.churn_risk}
              onChange={e => handleFilterChange('churn_risk', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-white text-sm"
            >
              {CHURN_RISKS.map(r => <option key={r} value={r}>{r || 'All risks'}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="text-slate-400 text-sm text-center py-10">Loading…</div>
        ) : data && data.conversations.length > 0 ? (
          <ConversationTable
            conversations={data.conversations}
            pagination={data.pagination}
            onPageChange={setPage}
          />
        ) : (
          <div className="text-slate-400 text-sm text-center py-10">
            No conversations match your filters.
          </div>
        )}
      </div>
    </div>
  );
}
