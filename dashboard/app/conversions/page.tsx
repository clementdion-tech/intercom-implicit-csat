import { api } from '../../lib/api';
import SankeyConversion from '../../components/SankeyConversion';

export const revalidate = 60;

export default async function ConversionsPage() {
  const conversions = await api.conversions();
  const rescued = conversions.arcCounts['rescued'] ?? 0;
  const declined = conversions.arcCounts['declined'] ?? 0;
  const total = conversions.total;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Conversation Arcs</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Rescued vs declined — how sentiment changed from first message to last
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-slate-400 text-xs mb-1">Rescued ↗</div>
          <div className="text-3xl font-bold text-green-400">{rescued}</div>
          <div className="text-slate-500 text-xs mt-1">
            {total > 0 ? `${Math.round((rescued / total) * 100)}% of scored` : ''}
          </div>
        </div>
        <div className="card text-center">
          <div className="text-slate-400 text-xs mb-1">Declined ↘</div>
          <div className="text-3xl font-bold text-red-400">{declined}</div>
          <div className="text-slate-500 text-xs mt-1">
            {total > 0 ? `${Math.round((declined / total) * 100)}% of scored` : ''}
          </div>
        </div>
        <div className="card text-center">
          <div className="text-slate-400 text-xs mb-1">Total Scored</div>
          <div className="text-3xl font-bold text-white">{total}</div>
        </div>
      </div>

      <SankeyConversion data={conversions} />

      {conversions.topRescueAgents.length > 0 && (
        <div className="card">
          <h2 className="text-white font-semibold mb-4">Top Rescue Agents (Coaching Insights)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="pb-2 pr-4 text-left text-slate-400 font-medium text-xs">Agent ID</th>
                  <th className="pb-2 pr-4 text-left text-slate-400 font-medium text-xs">Rescues</th>
                  <th className="pb-2 text-left text-slate-400 font-medium text-xs">Avg Score Improvement</th>
                </tr>
              </thead>
              <tbody>
                {conversions.topRescueAgents.map(agent => (
                  <tr key={agent.agentId} className="border-b border-slate-700">
                    <td className="py-2.5 pr-4 font-mono text-xs text-slate-300">{agent.agentId}</td>
                    <td className="py-2.5 pr-4 text-slate-300">{agent.rescueCount}</td>
                    <td className="py-2.5 text-green-400 font-semibold">+{agent.avgDeltaPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
