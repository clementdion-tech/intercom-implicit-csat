'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StylesData } from '../lib/api';
import { styleLabel } from '../lib/utils';

const COLORS = ['#6366f1', '#f59e0b', '#ef4444', '#10b981', '#06b6d4', '#8b5cf6'];

export default function StyleDonut({ data }: { data: StylesData }) {
  const chartData = data.styles.map(s => ({
    name: styleLabel(s.style),
    value: s.count,
    avgScore: s.avgScorePct,
    churnRate: s.churnRatePct,
  }));

  return (
    <div className="card">
      <h2 className="text-white font-semibold mb-4">Communication Style Distribution</h2>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8 }}
            formatter={(value, name, props) => [
              `${value} conversations | Avg: ${props.payload.avgScore}% | Churn: ${props.payload.churnRate}%`,
              name,
            ]}
          />
          <Legend
            formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
