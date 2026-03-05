import { Fragment, useState, useMemo, useCallback, type DragEvent } from 'react';
import type { Deal } from '../../types';
import {
  STATUS_LABELS,
  SETTLEMENT_LABELS,
  RESULT_LABELS,
  DEPARTMENT_COLORS,
} from '../../utils/constants';

interface DepartmentCalendarProps {
  deals: Deal[];
  departments: string[];
  selectedDepartments: string[];
  selectedDate: Date;
  onDealClick: (deal: Deal) => void;
  onDealDrop: (dealId: string, newDate: string, newDepartment: string) => void;
  onCellClick: (date: string, department: string) => void;
  onDateChange: (date: Date) => void;
}

const WEEKDAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

/**
 * 列幅仕様（px）
 * 全角1文字 ≈ 11px, 半角1文字 ≈ 6px  + padding 12px(px-1.5×2)
 */
const SUB_COL_SPECS = [
  { label: '担当者', w: 56, wrap: false },  // 全角4文字
  { label: '時間',   w: 42, wrap: false },  // 半角5文字 (12:00)
  { label: '客先',   w: 144, wrap: true },  // 全角12文字
  { label: '物件',   w: 68, wrap: true },   // 全角5文字
  { label: 'Pt',     w: 36, wrap: false },  // 半角4文字
  { label: '状態',   w: 56, wrap: true },   // 全角4文字
  { label: '決済',   w: 56, wrap: true },   // 全角4文字
  { label: '結果',   w: 56, wrap: true },   // 全角4文字
];
const SUB_COL_COUNT = SUB_COL_SPECS.length;
const DAY_WIDTH = SUB_COL_SPECS.reduce((s, c) => s + c.w, 0); // 1日分の幅
const SUMMARY_COLS = [
  { label: '件数', w: 36 },
  { label: 'Pt計', w: 40 },
];
const DEPT_COL_W = 96;
const MIN_ROWS = 3;

function fmt(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekdays(base: Date): Date[] {
  const d = new Date(base);
  const dow = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  const days: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    days.push(dt);
  }
  return days;
}

/** style helper for fixed-width columns */
function colStyle(w: number) {
  return { width: w, minWidth: w, maxWidth: w } as const;
}

export default function DepartmentCalendar({
  deals,
  departments,
  selectedDepartments,
  selectedDate,
  onDealClick,
  onDealDrop,
  onCellClick,
  onDateChange,
}: DepartmentCalendarProps) {
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  const visibleDepts =
    selectedDepartments.length > 0
      ? departments.filter((d) => selectedDepartments.includes(d))
      : departments;

  const weekdays = useMemo(() => getWeekdays(selectedDate), [selectedDate]);
  const todayStr = fmt(new Date());

  // Build grid: dept → dateStr → Deal[]
  const grid = useMemo(() => {
    const map = new Map<string, Map<string, Deal[]>>();
    for (const dept of visibleDepts) {
      const dm = new Map<string, Deal[]>();
      for (const day of weekdays) dm.set(fmt(day), []);
      map.set(dept, dm);
    }
    for (const deal of deals) {
      const dm = map.get(deal.department);
      if (!dm) continue;
      const list = dm.get(deal.visitDate);
      if (list) list.push(deal);
    }
    for (const [, dm] of map) {
      for (const [, list] of dm) {
        list.sort((a, b) => a.visitTime.localeCompare(b.visitTime));
      }
    }
    return map;
  }, [deals, visibleDepts, weekdays]);

  // Row count per department
  const rowCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const [dept, dm] of grid) {
      let max = 0;
      for (const [, list] of dm) max = Math.max(max, list.length);
      counts.set(dept, Math.max(max, MIN_ROWS));
    }
    return counts;
  }, [grid]);

  // Weekly summary per department: { count, totalPt }
  const weeklySummary = useMemo(() => {
    const summary = new Map<string, { count: number; totalPt: number }>();
    for (const [dept, dm] of grid) {
      let count = 0;
      let totalPt = 0;
      for (const [, list] of dm) {
        count += list.length;
        for (const deal of list) totalPt += deal.expectedPoints;
      }
      summary.set(dept, { count, totalPt });
    }
    return summary;
  }, [grid]);

  const prevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    onDateChange(d);
  };
  const nextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    onDateChange(d);
  };
  const goToday = () => onDateChange(new Date());

  const handleDragOver = useCallback((e: DragEvent, key: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCell(key);
  }, []);

  const handleDragLeave = useCallback(() => setDragOverCell(null), []);

  const handleDrop = useCallback(
    (e: DragEvent, date: string, dept: string) => {
      e.preventDefault();
      setDragOverCell(null);
      const id = e.dataTransfer.getData('text/plain');
      if (id) onDealDrop(id, date, dept);
    },
    [onDealDrop]
  );

  const w0 = weekdays[0];
  const w4 = weekdays[4];
  const headerLabel = w0 && w4
    ? `${w0.getFullYear()}年 ${w0.getMonth() + 1}/${w0.getDate()} 〜 ${w4.getMonth() + 1}/${w4.getDate()}`
    : '';

  // Total table width
  const summaryW = SUMMARY_COLS.reduce((s, c) => s + c.w, 0);
  const tableWidth = DEPT_COL_W + DAY_WIDTH * 5 + summaryW;

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Week navigation */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="px-2 py-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded text-sm"
          >
            ◀ 前週
          </button>
          <h2 className="text-base font-bold text-gray-800 mx-2">{headerLabel}</h2>
          <button
            onClick={nextWeek}
            className="px-2 py-1 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded text-sm"
          >
            次週 ▶
          </button>
          <button
            onClick={goToday}
            className="ml-2 px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
          >
            今週
          </button>
        </div>
        <p className="text-xs text-gray-400 hidden sm:block">
          ドラッグ&ドロップで移動可能
        </p>
      </div>

      {/* Spreadsheet — horizontal scroll */}
      <div className="overflow-x-auto overflow-y-auto">
        <table
          className="border-collapse text-[11px] leading-tight table-fixed"
          style={{ width: tableWidth }}
        >
          {/* colgroup で各列の幅を明示的に定義 */}
          <colgroup>
            <col style={{ width: DEPT_COL_W }} />
            {weekdays.map((day) => {
              const ds = fmt(day);
              return SUB_COL_SPECS.map((col, ci) => (
                <col key={`${ds}-${ci}`} style={{ width: col.w }} />
              ));
            })}
            {SUMMARY_COLS.map((col, i) => (
              <col key={`sum-${i}`} style={{ width: col.w }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-20">
            {/* Row 1: Day headers */}
            <tr>
              <th
                rowSpan={2}
                style={colStyle(DEPT_COL_W)}
                className="border border-gray-300 px-2 py-2 text-xs font-bold text-gray-700 bg-gray-100 sticky left-0 z-30"
              >
                課
              </th>
              {weekdays.map((day) => {
                const ds = fmt(day);
                const isToday = ds === todayStr;
                return (
                  <th
                    key={ds}
                    colSpan={SUB_COL_COUNT}
                    style={colStyle(DAY_WIDTH)}
                    className={`border border-gray-300 px-1 py-1.5 text-xs font-bold whitespace-nowrap ${
                      isToday
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {WEEKDAY_NAMES[day.getDay()]}曜日 {day.getMonth() + 1}/
                    {day.getDate()}
                  </th>
                );
              })}
              <th
                colSpan={SUMMARY_COLS.length}
                style={colStyle(summaryW)}
                className="border border-gray-300 px-1 py-1.5 text-xs font-bold whitespace-nowrap bg-indigo-100 text-indigo-800"
              >
                週計
              </th>
            </tr>
            {/* Row 2: Sub-column headers */}
            <tr>
              {weekdays.map((day) => {
                const ds = fmt(day);
                const isToday = ds === todayStr;
                return SUB_COL_SPECS.map((col) => (
                  <th
                    key={`${ds}-${col.label}`}
                    style={colStyle(col.w)}
                    className={`border border-gray-200 px-1 py-1 font-semibold whitespace-nowrap ${
                      isToday
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    {col.label}
                  </th>
                ));
              })}
              {SUMMARY_COLS.map((col) => (
                <th
                  key={`summary-${col.label}`}
                  style={colStyle(col.w)}
                  className="border border-gray-200 px-1 py-1 font-semibold whitespace-nowrap bg-indigo-50 text-indigo-600"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visibleDepts.map((dept, deptIdx) => {
              const rc = rowCounts.get(dept) || MIN_ROWS;
              const ci = deptIdx % DEPARTMENT_COLORS.length;
              const colors = DEPARTMENT_COLORS[ci];
              const dm = grid.get(dept);

              const deptSummary = weeklySummary.get(dept) || { count: 0, totalPt: 0 };

              return Array.from({ length: rc }, (_, ri) => (
                <tr
                  key={`${dept}-${ri}`}
                  className={`${colors.row} ${
                    ri === rc - 1 ? 'dept-border-bottom' : ''
                  }`}
                >
                  {/* Department name (first row only) */}
                  {ri === 0 && (
                    <td
                      rowSpan={rc}
                      style={colStyle(DEPT_COL_W)}
                      className={`border border-gray-300 px-2 py-1 text-xs font-bold text-center sticky left-0 z-10 whitespace-nowrap overflow-hidden text-ellipsis ${colors.header}`}
                    >
                      {dept}
                    </td>
                  )}

                  {/* Cells for each weekday */}
                  {weekdays.map((day) => {
                    const ds = fmt(day);
                    const dayDeals = dm?.get(ds) || [];
                    const deal = dayDeals[ri];
                    const cellKey = `${ds}|${dept}|${ri}`;
                    const isToday = ds === todayStr;
                    const isDragOver = dragOverCell === cellKey;
                    const todayBg = isToday ? 'bg-blue-50/40' : '';

                    if (deal) {
                      const isWon = deal.result === 'won';
                      const wonBg = isWon ? 'bg-red-100 text-red-900 font-semibold' : '';
                      const values = [
                        deal.salesPerson,
                        deal.visitTime,
                        deal.customerName,
                        deal.property,
                        String(deal.expectedPoints),
                        STATUS_LABELS[deal.status],
                        SETTLEMENT_LABELS[deal.settlement],
                        RESULT_LABELS[deal.result],
                      ];
                      return (
                        <Fragment key={ds}>
                          {SUB_COL_SPECS.map((col, ci) => (
                            <td
                              key={ci}
                              style={colStyle(col.w)}
                              className={`border border-gray-200 px-1.5 py-0.5 cursor-pointer hover:bg-white/60 ${wonBg || todayBg} ${
                                ci === 0 ? 'font-semibold cursor-grab' : ''
                              } ${ci === 4 ? 'text-right' : ''} ${
                                col.wrap ? 'break-all' : 'whitespace-nowrap overflow-hidden text-ellipsis'
                              }`}
                              draggable={ci === 0}
                              onDragStart={ci === 0 ? (e) => {
                                e.dataTransfer.setData('text/plain', deal.id);
                                e.dataTransfer.effectAllowed = 'move';
                                (e.target as HTMLElement).closest('tr')!.style.opacity = '0.4';
                              } : undefined}
                              onDragEnd={ci === 0 ? (e) => {
                                const tr = (e.target as HTMLElement).closest('tr');
                                if (tr) tr.style.opacity = '1';
                              } : undefined}
                              onClick={() => onDealClick(deal)}
                            >
                              {values[ci]}
                            </td>
                          ))}
                        </Fragment>
                      );
                    }

                    // Empty cells (drop target)
                    const emptyClass = `border border-gray-200 px-1.5 py-0.5 ${
                      isDragOver ? 'bg-blue-200/60' : todayBg
                    }`;
                    return (
                      <Fragment key={ds}>
                        {SUB_COL_SPECS.map((col, i) => (
                          <td
                            key={i}
                            style={colStyle(col.w)}
                            className={`${emptyClass} ${
                              i === 0 ? 'cursor-pointer hover:bg-blue-100/40' : ''
                            }`}
                            onClick={
                              i === 0
                                ? () => onCellClick(ds, dept)
                                : undefined
                            }
                            onDragOver={(e) => handleDragOver(e, cellKey)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, ds, dept)}
                          >
                            {'\u00A0'}
                          </td>
                        ))}
                      </Fragment>
                    );
                  })}

                  {/* Weekly summary (first row only) */}
                  {ri === 0 && (
                    <>
                      <td
                        rowSpan={rc}
                        style={colStyle(SUMMARY_COLS[0].w)}
                        className="border border-gray-200 px-2 py-1 text-center font-bold text-indigo-700 bg-indigo-50/60"
                      >
                        {deptSummary.count}
                      </td>
                      <td
                        rowSpan={rc}
                        style={colStyle(SUMMARY_COLS[1].w)}
                        className="border border-gray-200 px-2 py-1 text-right font-bold text-indigo-700 bg-indigo-50/60"
                      >
                        {deptSummary.totalPt}
                      </td>
                    </>
                  )}
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
