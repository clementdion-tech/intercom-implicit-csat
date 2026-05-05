import { api } from '../../lib/api';
import { scoreColor } from '../../lib/utils';

export const revalidate = 60;

export default async function AgentsPage() {
  const { agents } = await api.agents();

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Agent Coaching Insights</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Sentiment outcomes per agent — framed as coaching opportunities, not a leaderboard
        </p>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left">
                <th className="pb-3 pr-4 text-slate-400 font-medium text-xs">Agent ID</th>
                <th className="pb-3 pr-4 text-slate-400 font-medium text-xs">Conversations</th>
                <th className="pb-3 pr-4 text-slate-400 font-medium text-xs">Avg Score %</th>
                <th className="pb-3 pr-4 text-slate-400 font-medium text-xs">Rescue Rate</th>
                <th className="pb-3 pr-4 text-slate-400 font-medium text-xs">Drop Rate</th>
                <th className="pb-3 text-slate-400 font-medium text-xs">Burst Escalation Rate</th>
              </tr>
            </thead>
            <tbody>
              {agents.map(agent => (
                <tr key={agent.agentId} className="border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="py-3 pr-4 font-mono text-xs text-slate-300">{agent.agentId}</td>
                  <td className="py-3 pr-4 text-slate-300">{agent.conversationCount}</td>
                  <td className="py-3 pr-4">
                    <span className="font-bold" style={{ color: scoreColor(agent.avgScorePct) }}>
                      {agent.avgScorePct}%
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-1.5 min-w-16">
                        <div
                          className="bg-green-500 h-1.5 rounded-full"
                          style={{ width: `${agent.rescueRate}%` }}
                        />
                      </div>
                      <span className="text-green-400 text-xs font-medium w-10 text-right">
                        {agent.rescueRate}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-700 rounded-full h-1.5 min-w-16">
                        <div
                          className="bg-red-500 h-1.5 rounded-full"
                          style={{ width: `${agent.dropRate}%` }}
                        />
                      </div>
                      <span className="text-red-400 text-xs font-medium w-10 text-right">
                        {agent.dropRate}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`badge text-xs ${
                      agent.burstEscalationRate >= 20 ? 'bg-orange-900 text-orange-300' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {agent.burstEscalationRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {agents.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            No agent data yet. Ensure conversations have assignee IDs.
          </div>
        )}
      </div>
    </div>
  );
}
