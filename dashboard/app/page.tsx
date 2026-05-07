import { api, OverviewData, DistributionData, TimelineData, NesData } from '../lib/api';
import KPIBar from '../components/KPIBar';
import ScoreDistribution from '../components/ScoreDistribution';
import SentimentTimeline from '../components/SentimentTimeline';
import LiveFeed from '../components/LiveFeed';
import NetEmpathicScore from '../components/NetEmpathicScore';

export const revalidate = 30;

const EMPTY_OVERVIEW: OverviewData = {
  avgScorePct: null, coveragePct: 0, totalConversations: 0, scoredConversations: 0,
  scoredToday: 0, churnRiskHigh: 0, conversionsToday: 0, explicitImplicitAgreementPct: null,
};
const EMPTY_DISTRIBUTION: DistributionData = { distribution: [], total: 0 };
const EMPTY_TIMELINE: TimelineData = { timeline: [], period: '30d' };
const EMPTY_NES: NesData = { nes: null, empathetic: 0, neutral: 0, unempathetic: 0, total: 0, empatheticPct: 0, neutralPct: 0, unempatheticPct: 0, avgEmpathyScore: null };

export default async function OverviewPage() {
  const [overview, distribution, timeline, nes] = await Promise.all([
    api.overview().catch(() => EMPTY_OVERVIEW),
    api.distribution().catch(() => EMPTY_DISTRIBUTION),
    api.timeline('30d').catch(() => EMPTY_TIMELINE),
    api.nes().catch(() => EMPTY_NES),
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            100% conversation coverage — implicit CSAT for every interaction
          </p>
        </div>
      </div>

      <KPIBar data={overview} />

      <NetEmpathicScore data={nes} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
        <ScoreDistribution data={distribution} />
        <SentimentTimeline data={timeline} />
      </div>

      <LiveFeed />
    </div>
  );
}
