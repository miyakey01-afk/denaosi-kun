import { useMemo, useState } from 'react';
import type { Deal } from '../../types';
import { STATUS_LABELS, STATUS_COLORS } from '../../utils/constants';

interface DashboardProps {
  deals: Deal[];
  departments: string[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

interface WeekRange {
  label: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

interface WeeklyRow {
  key: string;
  label: string;
  subLabel?: string;
  weeks: { count: number; pt: number }[];
  count: number;
  totalPt: number;
  wonCount: number;
  wonPt: number;
  lostCount: number;
  pendingCount: number;
}

/** 対象月の週リストを返す（第1週〜第4or5週） */
function getWeeksOfMonth(date: Date): WeekRange[] {
  const y = date.getFullYear();
  const m = date.getMonth();
  const lastDay = new Date(y, m + 1, 0);
  const lastDate = lastDay.getDate();

  // 月曜始まり: 第1週 = 1日〜最初の日曜まで
  const weeks: WeekRange[] = [];
  let weekStart = 1;
  let weekNum = 1;

  while (weekStart <= lastDate) {
    const d = new Date(y, m, weekStart);
    const dow = d.getDay(); // 0=Sun
    // 週末 = 次の日曜日（dow==0ならその日、それ以外は7-dow日後）
    const daysToSunday = dow === 0 ? 0 : 7 - dow;
    let weekEnd = Math.min(weekStart + daysToSunday, lastDate);

    // 残り日数が7日以内なら最終週に統合
    if (weekEnd < lastDate && lastDate - weekEnd <= 7) {
      weekEnd = lastDate;
    }

    const startStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(weekStart).padStart(2, '0')}`;
    const endStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(weekEnd).padStart(2, '0')}`;
    weeks.push({
      label: `第${weekNum}週`,
      start: startStr,
      end: endStr,
    });
    weekStart = weekEnd + 1;
    weekNum++;
  }
  return weeks;
}

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function classifyDealToWeek(visitDate: string, weeks: WeekRange[]): number {
  for (let i = 0; i < weeks.length; i++) {
    if (visitDate >= weeks[i].start && visitDate <= weeks[i].end) return i;
  }
  return -1;
}

export default function Dashboard({ deals, departments, selectedDate, onDateChange }: DashboardProps) {
  const monthLabel = `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月`;
  const [activeDept, setActiveDept] = useState<string | null>(null); // null = すべて

  const weeks = useMemo(() => getWeeksOfMonth(selectedDate), [selectedDate]);

  // 対象月のdealだけフィルタ（+ 所属タブフィルタ）
  const monthDeals = useMemo(() => {
    const ym = fmt(selectedDate);
    let filtered = deals.filter((d) => d.visitDate.startsWith(ym));
    if (activeDept) {
      filtered = filtered.filter((d) => d.department === activeDept);
    }
    return filtered;
  }, [deals, selectedDate, activeDept]);

  // 全体 KPI
  const totalCount = monthDeals.length;
  const totalPt = monthDeals.reduce((s, d) => s + d.expectedPoints, 0);
  const wonDeals = monthDeals.filter((d) => d.result === 'won');
  const wonPt = wonDeals.reduce((s, d) => s + d.expectedPoints, 0);
  const winRate = totalCount > 0 ? Math.round((wonDeals.length / totalCount) * 100) : 0;

  // 所属課別 週別集計
  const deptRows = useMemo(() => {
    const map = new Map<string, WeeklyRow>();
    for (const deal of monthDeals) {
      const dept = deal.department || '未設定';
      if (!map.has(dept)) {
        map.set(dept, {
          key: dept, label: dept,
          weeks: weeks.map(() => ({ count: 0, pt: 0 })),
          count: 0, totalPt: 0, wonCount: 0, wonPt: 0, lostCount: 0, pendingCount: 0,
        });
      }
      const r = map.get(dept)!;
      r.count++;
      r.totalPt += deal.expectedPoints;
      if (deal.result === 'won') { r.wonCount++; r.wonPt += deal.expectedPoints; }
      if (deal.result === 'lost') r.lostCount++;
      if (deal.result === 'prospect') r.pendingCount++;
      const wi = classifyDealToWeek(deal.visitDate, weeks);
      if (wi >= 0) { r.weeks[wi].count++; r.weeks[wi].pt += deal.expectedPoints; }
    }
    return [...map.values()].sort((a, b) => b.totalPt - a.totalPt);
  }, [monthDeals, weeks]);

  // 個人別 週別集計
  const personRows = useMemo(() => {
    const map = new Map<string, WeeklyRow>();
    for (const deal of monthDeals) {
      const person = deal.salesPerson || '未設定';
      if (!map.has(person)) {
        map.set(person, {
          key: person, label: person, subLabel: deal.department,
          weeks: weeks.map(() => ({ count: 0, pt: 0 })),
          count: 0, totalPt: 0, wonCount: 0, wonPt: 0, lostCount: 0, pendingCount: 0,
        });
      }
      const r = map.get(person)!;
      r.count++;
      r.totalPt += deal.expectedPoints;
      if (deal.result === 'won') { r.wonCount++; r.wonPt += deal.expectedPoints; }
      if (deal.result === 'lost') r.lostCount++;
      if (deal.result === 'prospect') r.pendingCount++;
      const wi = classifyDealToWeek(deal.visitDate, weeks);
      if (wi >= 0) { r.weeks[wi].count++; r.weeks[wi].pt += deal.expectedPoints; }
    }
    return [...map.values()].sort((a, b) => b.totalPt - a.totalPt);
  }, [monthDeals, weeks]);

  // ステータス別集計
  const statusCounts = useMemo(() =>
    Object.keys(STATUS_LABELS).map((status) => {
      const filtered = monthDeals.filter((d) => d.status === status);
      return {
        status,
        label: STATUS_LABELS[status as keyof typeof STATUS_LABELS],
        color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
        count: filtered.length,
        points: filtered.reduce((s, d) => s + d.expectedPoints, 0),
      };
    }),
  [monthDeals]);

  const prevMonth = () => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() - 1);
    onDateChange(d);
  };
  const nextMonth = () => {
    const d = new Date(selectedDate);
    d.setMonth(d.getMonth() + 1);
    onDateChange(d);
  };
  const goThisMonth = () => onDateChange(new Date());

  const totalRow = (rows: WeeklyRow[]) => ({
    weeks: weeks.map((_, wi) => rows.reduce((s, r) => ({ count: s.count + r.weeks[wi].count, pt: s.pt + r.weeks[wi].pt }), { count: 0, pt: 0 })),
    count: rows.reduce((s, r) => s + r.count, 0),
    totalPt: rows.reduce((s, r) => s + r.totalPt, 0),
    wonCount: rows.reduce((s, r) => s + r.wonCount, 0),
    wonPt: rows.reduce((s, r) => s + r.wonPt, 0),
    lostCount: rows.reduce((s, r) => s + r.lostCount, 0),
    pendingCount: rows.reduce((s, r) => s + r.pendingCount, 0),
  });

  return (
    <div className="space-y-6">
      {/* Month navigation */}
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="px-2 py-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded text-sm">◀ 前月</button>
        <h2 className="text-lg font-bold text-gray-800">{monthLabel}</h2>
        <button onClick={nextMonth} className="px-2 py-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded text-sm">次月 ▶</button>
        <button onClick={goThisMonth} className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded border border-blue-200">今月</button>
      </div>

      {/* 所属タブ */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveDept(null)}
          className={`px-4 py-1.5 text-sm rounded-full font-medium transition-colors ${
            activeDept === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          すべて
        </button>
        {departments.map((dept) => (
          <button
            key={dept}
            onClick={() => setActiveDept(dept)}
            className={`px-4 py-1.5 text-sm rounded-full font-medium transition-colors ${
              activeDept === dept
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {dept}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="総案件数" value={`${totalCount}件`} />
        <KPICard title="総ポイント" value={`${totalPt}pt`} />
        <KPICard title="受注ポイント" value={`${wonPt}pt`} color="text-green-600" />
        <KPICard title="受注率" value={`${winRate}%`} color="text-blue-600" />
      </div>

      {/* 所属課別集計テーブル */}
      <SummaryTable
        title="所属課別 集計"
        weeks={weeks}
        rows={deptRows}
        totals={totalRow(deptRows)}
        showSubLabel={false}
      />

      {/* 個人別集計テーブル */}
      <SummaryTable
        title="個人別 集計"
        weeks={weeks}
        rows={personRows}
        totals={totalRow(personRows)}
        showSubLabel={true}
      />

      {/* ステータス別 & ランキング */}
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
            {deptRows.map(({ label, count, totalPt: pt }, i) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-400 w-6">{i + 1}</span>
                <span className="text-sm font-medium text-gray-700 w-28 truncate">{label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full flex items-center justify-end px-2 text-xs text-white font-medium"
                    style={{
                      width: `${deptRows.length > 0 ? Math.max((pt / (deptRows[0]?.totalPt || 1)) * 100, 10) : 0}%`,
                    }}
                  >
                    {pt}pt
                  </div>
                </div>
                <span className="text-sm text-gray-500 w-12 text-right">{count}件</span>
              </div>
            ))}
            {deptRows.length === 0 && (
              <p className="text-gray-400 text-center py-4">データなし</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───── 週別集計テーブル共通コンポーネント ───── */

function SummaryTable({
  title,
  weeks,
  rows,
  totals,
  showSubLabel,
}: {
  title: string;
  weeks: WeekRange[];
  rows: WeeklyRow[];
  totals: Omit<WeeklyRow, 'key' | 'label' | 'subLabel'>;
  showSubLabel: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="font-bold text-gray-800">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left font-medium text-gray-600" rowSpan={2}>
                {showSubLabel ? '担当者' : '所属課'}
              </th>
              {showSubLabel && (
                <th className="px-4 py-3 text-left font-medium text-gray-600" rowSpan={2}>所属課</th>
              )}
              {weeks.map((w) => (
                <th key={w.label} colSpan={2} className="px-2 py-2 text-center font-medium text-indigo-700 bg-indigo-50 border-l border-gray-200">
                  {w.label}
                </th>
              ))}
              <th colSpan={2} className="px-2 py-2 text-center font-medium text-gray-700 bg-gray-100 border-l border-gray-200">合計</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600 border-l border-gray-200" rowSpan={2}>受注</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600" rowSpan={2}>受注Pt</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600" rowSpan={2}>失注</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600" rowSpan={2}>見込</th>
              <th className="px-3 py-3 text-right font-medium text-gray-600" rowSpan={2}>受注率</th>
            </tr>
            <tr className="bg-gray-50 border-b">
              {weeks.map((w) => (
                <WeekSubHeaders key={w.label} />
              ))}
              <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 bg-gray-100 border-l border-gray-200">件数</th>
              <th className="px-2 py-1 text-right text-xs font-medium text-gray-500 bg-gray-100">Pt</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const rate = r.count > 0 ? Math.round((r.wonCount / r.count) * 100) : 0;
              return (
                <tr key={r.key} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-800 whitespace-nowrap">{r.label}</td>
                  {showSubLabel && (
                    <td className="px-4 py-2 text-gray-500 text-xs whitespace-nowrap">{r.subLabel}</td>
                  )}
                  {r.weeks.map((w, wi) => (
                    <WeekCells key={wi} count={w.count} pt={w.pt} />
                  ))}
                  <td className="px-2 py-2 text-right font-semibold border-l border-gray-200">{r.count}</td>
                  <td className="px-2 py-2 text-right font-semibold">{r.totalPt}pt</td>
                  <td className="px-3 py-2 text-right text-green-600 font-medium border-l border-gray-200">{r.wonCount}</td>
                  <td className="px-3 py-2 text-right text-green-600">{r.wonPt}pt</td>
                  <td className="px-3 py-2 text-right text-gray-500">{r.lostCount}</td>
                  <td className="px-3 py-2 text-right text-gray-500">{r.pendingCount}</td>
                  <td className="px-3 py-2 text-right">
                    <span className={`font-semibold ${rate >= 50 ? 'text-green-600' : rate > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>
                      {rate}%
                    </span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={99} className="px-4 py-8 text-center text-gray-400">データなし</td>
              </tr>
            )}
            {/* 合計行 */}
            {rows.length > 0 && (
              <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                <td className="px-4 py-2 text-gray-800">合計</td>
                {showSubLabel && <td />}
                {totals.weeks.map((w, wi) => (
                  <WeekCells key={wi} count={w.count} pt={w.pt} bold />
                ))}
                <td className="px-2 py-2 text-right border-l border-gray-200">{totals.count}</td>
                <td className="px-2 py-2 text-right">{totals.totalPt}pt</td>
                <td className="px-3 py-2 text-right text-green-600 border-l border-gray-200">{totals.wonCount}</td>
                <td className="px-3 py-2 text-right text-green-600">{totals.wonPt}pt</td>
                <td className="px-3 py-2 text-right text-gray-500">{totals.lostCount}</td>
                <td className="px-3 py-2 text-right text-gray-500">{totals.pendingCount}</td>
                <td className="px-3 py-2 text-right">
                  {totals.count > 0 ? Math.round((totals.wonCount / totals.count) * 100) : 0}%
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WeekSubHeaders() {
  return (
    <>
      <th className="px-2 py-1 text-right text-xs font-medium text-indigo-500 bg-indigo-50 border-l border-gray-200">件数</th>
      <th className="px-2 py-1 text-right text-xs font-medium text-indigo-500 bg-indigo-50">Pt</th>
    </>
  );
}

function WeekCells({ count, pt, bold }: { count: number; pt: number; bold?: boolean }) {
  const cls = bold ? 'font-bold' : '';
  return (
    <>
      <td className={`px-2 py-2 text-right text-indigo-700 border-l border-gray-200 ${cls}`}>
        {count || <span className="text-gray-300">-</span>}
      </td>
      <td className={`px-2 py-2 text-right text-indigo-700 ${cls}`}>
        {pt ? `${pt}` : <span className="text-gray-300">-</span>}
      </td>
    </>
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
