import { api } from '../../lib/api';
import ChurnKanban from '../../components/ChurnKanban';

export const revalidate = 30;

export default async function ChurnPage() {
  const churn = await api.churn();
  const total = churn.high.length + churn.medium.length + churn.low.length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Churn Risk Pipeline</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {total} at-risk conversations identified from implicit signals
          </p>
        </div>
        <div className="flex gap-3">
          <span className="badge bg-red-900 text-red-300">🔴 High: {churn.high.length}</span>
          <span className="badge bg-orange-900 text-orange-300">🟠 Medium: {churn.medium.length}</span>
          <span className="badge bg-yellow-900 text-yellow-300">🟡 Low: {churn.low.length}</span>
        </div>
      </div>

      <ChurnKanban data={churn} />
    </div>
  );
}
