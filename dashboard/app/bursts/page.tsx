import { api } from '../../lib/api';
import BurstHeatmap from '../../components/BurstHeatmap';

export const revalidate = 60;

export default async function BurstsPage() {
  const bursts = await api.bursts();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Burst Contacts</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          3+ messages in under 2 minutes = agitation burst. Each burst: −8% to sentiment score (max −24%)
        </p>
      </div>

      <div className="card">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-4xl font-bold text-orange-400">{bursts.withBursts}</div>
            <div className="text-slate-400 text-sm mt-1">Burst Conversations</div>
          </div>
          <div>
            <div className="text-slate-400 text-sm mb-1">Burst vs No-Burst Score Gap</div>
            <div className="text-2xl font-bold text-white">
              {bursts.burstAvgScorePct !== null && bursts.noBurstAvgScorePct !== null
                ? `${Math.abs(bursts.noBurstAvgScorePct - bursts.burstAvgScorePct)}% gap`
                : 'N/A'}
            </div>
            <div className="text-slate-500 text-xs mt-1">
              Burst: {bursts.burstAvgScorePct ?? '?'}% vs No-burst: {bursts.noBurstAvgScorePct ?? '?'}%
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-sm mb-1">Coverage</div>
            <div className="text-2xl font-bold text-white">
              {bursts.withBursts + bursts.withoutBursts > 0
                ? `${Math.round((bursts.withBursts / (bursts.withBursts + bursts.withoutBursts)) * 100)}%`
                : '0%'}
            </div>
            <div className="text-slate-500 text-xs mt-1">of conversations have bursts</div>
          </div>
        </div>
      </div>

      <BurstHeatmap data={bursts} />
    </div>
  );
}
