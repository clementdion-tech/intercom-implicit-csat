import { api } from '../lib/api';
import KPIBar from '../components/KPIBar';
import ScoreDistribution from '../components/ScoreDistribution';
import SentimentTimeline from '../components/SentimentTimeline';
import LiveFeed from '../components/LiveFeed';

export const revalidate = 30;

export default async function OverviewPage() {
  const [overview, distribution, timeline] = await Promise.all([
    api.overview(),
    api.distribution(),
    api.timeline('30d'),
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
        <ScoreDistribution data={distribution} />
        <SentimentTimeline data={timeline} />
      </div>

      <LiveFeed />
    </div>
  );
}
