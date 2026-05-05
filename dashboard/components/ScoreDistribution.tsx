'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { DistributionData } from '../lib/api';

const COLORS = {
  very_dissatisfied: '#e53935',
  dissatisfied: '#fb8c00',
  neutral: '#fdd835',
  satisfied: '#7cb342',
  very_satisfied: '#2e7d32',
};

const LABELS: Record<string, string> = {
  very_dissatisfied: '😠 Very Dissatisfied',
  dissatisfied: '😞 Dissatisfied',
  neutral: '😐 Neutral',
  satisfied: '😊 Satisfied',
  very_satisfied: '😄 Very Satisfied',
};

export default function ScoreDistribution({ data }: { data: DistributionData }) {
  const chartData = data.distribution.map(d => ({
    name: LABELS[d.label] ?? d.label,
    label: d.label,
    count: d.count,
    pct: d.pct,
  }));

  return (
    <div className="card">
      <h2 className="text-white font-semibold mb-4">Score Distribution</h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            angle={-35}
            textAnchor="end"
            interval={0}
          />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(value, _name, props) => [`${value} (${props.payload.pct}%)`, 'Conversations']}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.label} fill={COLORS[entry.label as keyof typeof COLORS] ?? '#64748b'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
