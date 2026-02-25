import type { Deal } from '../../types';
import { STATUS_LABELS, STATUS_COLORS, RESULT_LABELS } from '../../utils/constants';

interface DashboardProps {
  deals: Deal[];
}

export default function Dashboard({ deals }: DashboardProps) {
  const totalPoints = deals.reduce((sum, d) => sum + d.expectedPoints, 0);
  const wonDeals = deals.filter((d) => d.result === 'won');
  const wonPoints = wonDeals.reduce((sum, d) => sum + d.expectedPoints, 0);
  const winRate = deals.length > 0
    ? Math.round((wonDeals.length / deals.length) * 100)
    : 0;

  // Status breakdown
  const statusCounts = Object.keys(STATUS_LABELS).map((status) => {
    const count = deals.filter((d) => d.status === status).length;
    const points = deals.filter((d) => d.status === status).reduce((s, d) => s + d.expectedPoints, 0);
    return {
      status,
      label: STATUS_LABELS[status as keyof typeof STATUS_LABELS],
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
      count,
      points,
    };
  });

  // Result breakdown
  const resultCounts = Object.keys(RESULT_LABELS).map((result) => {
    const count = deals.filter((d) => d.result === result).length;
    return {
      result,
      label: RESULT_LABELS[result as keyof typeof RESULT_LABELS],
      count,
    };
  });

  // By sales person
  const salesPersonMap = new Map<string, { count: number; points: number }>();
  for (const deal of deals) {
    const prev = salesPersonMap.get(deal.salesPerson) ?? { count: 0, points: 0 };
    salesPersonMap.set(deal.salesPerson, {
      count: prev.count + 1,
      points: prev.points + deal.expectedPoints,
    });
  }
  const salesPersonStats = [...salesPersonMap.entries()]
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="総案件数" value={`${deals.length}件`} />
        <KPICard title="総ポイント" value={`${totalPoints}pt`} />
        <KPICard title="受注ポイント" value={`${wonPoints}pt`} color="text-green-600" />
        <KPICard title="受注率" value={`${winRate}%`} color="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="font-bold text-gray-800 mb-4">ステータス別</h3>
          <div className="space-y-3">
            {statusCounts.map(({ label, color, count, points }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm text-gray-700 w-24">{label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-full rounded-full flex items-center justify-end px-2 text-xs text-white font-medium"
                    style={{
                      backgroundColor: color,
                      width: `${deals.length > 0 ? Math.max((count / deals.length) * 100, 8) : 0}%`,
                    }}
                  >
                    {count}
                  </div>
                </div>
                <span className="text-sm text-gray-500 w-16 text-right">{points}pt</span>
              </div>
            ))}
          </div>
        </div>

        {/* Result breakdown */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="font-bold text-gray-800 mb-4">結果別</h3>
          <div className="grid grid-cols-2 gap-4">
            {resultCounts.map(({ label, count }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-800">{count}</div>
                <div className="text-sm text-gray-500">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales person ranking */}
        <div className="bg-white rounded-lg shadow p-5 lg:col-span-2">
          <h3 className="font-bold text-gray-800 mb-4">担当者別ポイント</h3>
          <div className="space-y-3">
            {salesPersonStats.map(({ name, count, points }, i) => (
              <div key={name} className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-400 w-6">{i + 1}</span>
                <span className="text-sm font-medium text-gray-700 w-28">{name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full flex items-center justify-end px-2 text-xs text-white font-medium"
                    style={{
                      width: `${salesPersonStats.length > 0 ? Math.max((points / (salesPersonStats[0]?.points || 1)) * 100, 10) : 0}%`,
                    }}
                  >
                    {points}pt
                  </div>
                </div>
                <span className="text-sm text-gray-500 w-12 text-right">{count}件</span>
              </div>
            ))}
            {salesPersonStats.length === 0 && (
              <p className="text-gray-400 text-center py-4">データなし</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, value, color }: { title: string; value: string; color?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className={`text-2xl font-bold mt-1 ${color ?? 'text-gray-800'}`}>{value}</div>
    </div>
  );
}
