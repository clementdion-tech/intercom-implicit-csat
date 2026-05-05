'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { TimelineData } from '../lib/api';

export default function SentimentTimeline({ data }: { data: TimelineData }) {
  const chartData = data.timeline.map(p => ({
    date: new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    score: Math.round(p.avgScorePct),
    conversations: p.totalConversations,
  }));

  return (
    <div className="card">
      <h2 className="text-white font-semibold mb-4">Avg Score % — 30 Day Trend</h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(value) => [`${value}%`, 'Avg Score']}
          />
          <ReferenceLine y={60} stroke="#475569" strokeDasharray="4 4" label={{ value: 'Satisfied threshold', fill: '#64748b', fontSize: 10 }} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#7cb342"
            strokeWidth={2.5}
            dot={{ fill: '#7cb342', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
