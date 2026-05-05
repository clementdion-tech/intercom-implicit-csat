'use client';

import { OverviewData } from '../lib/api';
import { scoreColor } from '../lib/utils';

interface KPIBarProps {
  data: OverviewData;
}

function KPICard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="kpi-card flex flex-col gap-1 min-w-0">
      <div className="text-slate-400 text-xs font-medium uppercase tracking-wide truncate">{label}</div>
      <div className="text-2xl font-bold text-white" style={color ? { color } : {}}>
        {value}
      </div>
      {sub && <div className="text-slate-400 text-xs truncate">{sub}</div>}
    </div>
  );
}

export default function KPIBar({ data }: KPIBarProps) {
  const avgScore = data.avgScorePct ?? 0;
  const avgEmoji = avgScore <= 20 ? '😠' : avgScore <= 40 ? '😞' : avgScore <= 60 ? '😐' : avgScore <= 80 ? '😊' : '😄';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 p-6 pb-0">
      <KPICard
        label="Coverage"
        value={`${data.coveragePct}%`}
        sub={`${data.scoredConversations} / ${data.totalConversations} conversations`}
        color="#7cb342"
      />
      <KPICard
        label="Global Avg Score"
        value={data.avgScorePct !== null ? `${data.avgScorePct}% ${avgEmoji}` : 'N/A'}
        color={data.avgScorePct !== null ? scoreColor(data.avgScorePct) : undefined}
      />
      <KPICard
        label="Scored Today"
        value={data.scoredToday.toString()}
        sub="conversations"
      />
      <KPICard
        label="Churn Risk 🔴"
        value={data.churnRiskHigh.toString()}
        sub="high risk"
        color="#e53935"
      />
      <KPICard
        label="Conversions Today"
        value={`↗ ${data.conversionsToday}`}
        sub="rescued"
        color="#7cb342"
      />
      <KPICard
        label="Explicit/Implicit Agreement"
        value={data.explicitImplicitAgreementPct !== null ? `${data.explicitImplicitAgreementPct}%` : 'N/A'}
        sub="within 15% gap"
      />
      <KPICard
        label="Implicit CSAT Coverage"
        value="100%"
        sub="vs explicit ~15-20%"
        color="#7cb342"
      />
    </div>
  );
}
