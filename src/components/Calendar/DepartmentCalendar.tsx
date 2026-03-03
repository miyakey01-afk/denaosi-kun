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
const SUB_COLS = ['担当者', '時間', '客先', '物件', 'Pt', '状態', '決済', '結果'];
const SUB_COL_COUNT = SUB_COLS.length;
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

      {/* Spreadsheet */}
      <div className="overflow-auto">
        <table className="border-collapse text-[11px] leading-tight">
          <thead className="sticky top-0 z-20">
            {/* Row 1: Day headers */}
            <tr>
              <th
                rowSpan={2}
                className="border border-gray-300 px-2 py-2 text-xs font-bold text-gray-700 bg-gray-100 sticky left-0 z-30 min-w-[72px]"
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
            </tr>
            {/* Row 2: Sub-column headers */}
            <tr>
              {weekdays.map((day) => {
                const ds = fmt(day);
                const isToday = ds === todayStr;
                return SUB_COLS.map((col) => (
                  <th
                    key={`${ds}-${col}`}
                    className={`border border-gray-200 px-1 py-1 font-semibold whitespace-nowrap ${
                      isToday
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    {col}
                  </th>
                ));
              })}
            </tr>
          </thead>

          <tbody>
            {visibleDepts.map((dept, deptIdx) => {
              const rc = rowCounts.get(dept) || MIN_ROWS;
              const ci = deptIdx % DEPARTMENT_COLORS.length;
              const colors = DEPARTMENT_COLORS[ci];
              const dm = grid.get(dept);

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
                      className={`border border-gray-300 px-2 py-1 text-xs font-bold text-center sticky left-0 z-10 whitespace-nowrap ${colors.header}`}
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
                      const cellClass = `border border-gray-200 px-1.5 py-0.5 cursor-pointer hover:bg-white/60 ${todayBg}`;
                      return (
                        <Fragment key={ds}>
                          <td
                            className={`${cellClass} font-semibold cursor-grab`}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', deal.id);
                              e.dataTransfer.effectAllowed = 'move';
                              (e.target as HTMLElement).closest('tr')!.style.opacity = '0.4';
                            }}
                            onDragEnd={(e) => {
                              const tr = (e.target as HTMLElement).closest('tr');
                              if (tr) tr.style.opacity = '1';
                            }}
                            onClick={() => onDealClick(deal)}
                          >
                            {deal.salesPerson}
                          </td>
                          <td className={cellClass} onClick={() => onDealClick(deal)}>
                            {deal.visitTime}
                          </td>
                          <td className={cellClass} onClick={() => onDealClick(deal)}>
                            {deal.customerName}
                          </td>
                          <td className={cellClass} onClick={() => onDealClick(deal)}>
                            {deal.property}
                          </td>
                          <td
                            className={`${cellClass} text-right`}
                            onClick={() => onDealClick(deal)}
                          >
                            {deal.expectedPoints}
                          </td>
                          <td className={cellClass} onClick={() => onDealClick(deal)}>
                            {STATUS_LABELS[deal.status]}
                          </td>
                          <td className={cellClass} onClick={() => onDealClick(deal)}>
                            {SETTLEMENT_LABELS[deal.settlement]}
                          </td>
                          <td className={cellClass} onClick={() => onDealClick(deal)}>
                            {RESULT_LABELS[deal.result]}
                          </td>
                        </Fragment>
                      );
                    }

                    // Empty cells (drop target)
                    const emptyClass = `border border-gray-200 px-1.5 py-0.5 ${
                      isDragOver ? 'bg-blue-200/60' : todayBg
                    }`;
                    return (
                      <Fragment key={ds}>
                        {Array.from({ length: SUB_COL_COUNT }, (_, i) => (
                          <td
                            key={i}
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
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
