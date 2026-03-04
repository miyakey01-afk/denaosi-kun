import { useMemo } from 'react';
import type { Deal } from '../../types';
import { STATUS_LABELS, STATUS_COLORS } from '../../utils/constants';

interface DashboardProps {
  deals: Deal[];
}

interface DeptStats {
  department: string;
  count: number;
  totalPt: number;
  wonCount: number;
  wonPt: number;
  lostCount: number;
  pendingCount: number;
}

export default function Dashboard({ deals }: DashboardProps) {
  // 全体 KPI
  const totalCount = deals.length;
  const totalPt = deals.reduce((s, d) => s + d.expectedPoints, 0);
  const wonDeals = deals.filter((d) => d.result === 'won');
  const wonPt = wonDeals.reduce((s, d) => s + d.expectedPoints, 0);
  const winRate = totalCount > 0 ? Math.round((wonDeals.length / totalCount) * 100) : 0;

  // 所属課別集計
  const deptStats = useMemo(() => {
    const map = new Map<string, DeptStats>();
    for (const deal of deals) {
      const dept = deal.department || '未設定';
      if (!map.has(dept)) {
        map.set(dept, { department: dept, count: 0, totalPt: 0, wonCount: 0, wonPt: 0, lostCount: 0, pendingCount: 0 });
      }
      const s = map.get(dept)!;
      s.count++;
      s.totalPt += deal.expectedPoints;
      if (deal.result === 'won') { s.wonCount++; s.wonPt += deal.expectedPoints; }
      if (deal.result === 'lost') s.lostCount++;
      if (deal.result === 'pending') s.pendingCount++;
    }
    return [...map.values()].sort((a, b) => b.totalPt - a.totalPt);
  }, [deals]);

  // ステータス別集計
  const statusCounts = useMemo(() =>
    Object.keys(STATUS_LABELS).map((status) => {
      const filtered = deals.filter((d) => d.status === status);
      return {
        status,
        label: STATUS_LABELS[status as keyof typeof STATUS_LABELS],
        color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
        count: filtered.length,
        points: filtered.reduce((s, d) => s + d.expectedPoints, 0),
      };
    }),
  [deals]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="総案件数" value={`${totalCount}件`} />
        <KPICard title="総ポイント" value={`${totalPt}pt`} />
        <KPICard title="受注ポイント" value={`${wonPt}pt`} color="text-green-600" />
        <KPICard title="受注率" value={`${winRate}%`} color="text-blue-600" />
      </div>

      {/* 所属課別集計テーブル */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-5 py-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-800">所属課別 集計</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left font-medium text-gray-600">所属課</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">案件数</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">総Pt</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">受注</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">受注Pt</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">失注</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">未確定</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">受注率</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Pt構成</th>
              </tr>
            </thead>
            <tbody>
              {deptStats.map((s) => {
                const rate = s.count > 0 ? Math.round((s.wonCount / s.count) * 100) : 0;
                const barWidth = totalPt > 0 ? Math.max((s.totalPt / totalPt) * 100, 4) : 0;
                return (
                  <tr key={s.department} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{s.department}</td>
                    <td className="px-4 py-3 text-right">{s.count}</td>
                    <td className="px-4 py-3 text-right font-semibold">{s.totalPt}pt</td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">{s.wonCount}</td>
                    <td className="px-4 py-3 text-right text-green-600">{s.wonPt}pt</td>
                    <td className="px-4 py-3 text-right text-gray-500">{s.lostCount}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{s.pendingCount}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${rate >= 50 ? 'text-green-600' : rate > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                        {rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 w-40">
                      <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {deptStats.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-400">データなし</td>
                </tr>
              )}
              {/* 合計行 */}
              {deptStats.length > 0 && (
                <tr className="bg-gray-50 font-bold">
                  <td className="px-4 py-3 text-gray-800">合計</td>
                  <td className="px-4 py-3 text-right">{totalCount}</td>
                  <td className="px-4 py-3 text-right">{totalPt}pt</td>
                  <td className="px-4 py-3 text-right text-green-600">{wonDeals.length}</td>
                  <td className="px-4 py-3 text-right text-green-600">{wonPt}pt</td>
                  <td className="px-4 py-3 text-right text-gray-500">{deals.filter(d => d.result === 'lost').length}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{deals.filter(d => d.result === 'pending').length}</td>
                  <td className="px-4 py-3 text-right">{winRate}%</td>
                  <td className="px-4 py-3"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ステータス別 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      width: `${totalCount > 0 ? Math.max((count / totalCount) * 100, 8) : 0}%`,
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

        {/* 所属課別ポイントランキング */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="font-bold text-gray-800 mb-4">所属課別 ポイントランキング</h3>
          <div className="space-y-3">
            {deptStats.map(({ department, count, totalPt: pt }, i) => (
              <div key={department} className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-400 w-6">{i + 1}</span>
                <span className="text-sm font-medium text-gray-700 w-28 truncate">{department}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full flex items-center justify-end px-2 text-xs text-white font-medium"
                    style={{
                      width: `${deptStats.length > 0 ? Math.max((pt / (deptStats[0]?.totalPt || 1)) * 100, 10) : 0}%`,
                    }}
                  >
                    {pt}pt
                  </div>
                </div>
                <span className="text-sm text-gray-500 w-12 text-right">{count}件</span>
              </div>
            ))}
            {deptStats.length === 0 && (
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
