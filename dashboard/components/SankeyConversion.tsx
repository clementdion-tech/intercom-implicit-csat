'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { ConversionsData } from '../lib/api';

const ARC_COLORS: Record<string, string> = {
  rescued: '#2e7d32',
  stable_positive: '#7cb342',
  stable_neutral: '#475569',
  stable_negative: '#fb8c00',
  declined: '#e53935',
  volatile: '#9333ea',
};

const ARC_LABELS: Record<string, string> = {
  rescued: '↗ Rescued',
  stable_positive: '→ Stable Positive',
  stable_neutral: '→ Stable Neutral',
  stable_negative: '→ Stable Negative',
  declined: '↘ Declined',
  volatile: '↕ Volatile',
};

export default function SankeyConversion({ data }: { data: ConversionsData }) {
  const chartData = Object.entries(data.arcCounts)
    .map(([arc, count]) => ({
      name: ARC_LABELS[arc] ?? arc,
      arc,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="card">
      <h2 className="text-white font-semibold mb-4">Conversation Arc Breakdown</h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
          <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={130} tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
            formatter={(value) => [`${value} conversations`, 'Count']}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.arc} fill={ARC_COLORS[entry.arc] ?? '#64748b'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {data.topRescueAgents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <div className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-2">Top Rescue Agents</div>
          <div className="space-y-1.5">
            {data.topRescueAgents.slice(0, 5).map(agent => (
              <div key={agent.agentId} className="flex items-center justify-between text-sm">
                <span className="text-slate-300 font-mono text-xs">{agent.agentId}</span>
                <span className="text-slate-400 text-xs">{agent.rescueCount} rescues</span>
                <span className="text-green-400 text-xs font-medium">Avg +{agent.avgDeltaPct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
