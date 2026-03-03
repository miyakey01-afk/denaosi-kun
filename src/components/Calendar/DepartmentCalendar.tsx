import { useState, useMemo, useCallback, type DragEvent } from 'react';
import type { Deal } from '../../types';
import { STATUS_COLORS, STATUS_LABELS, SETTLEMENT_LABELS } from '../../utils/constants';

interface DepartmentCalendarProps {
  deals: Deal[];
  departments: string[];
  selectedDepartments: string[];
  selectedDate: Date;
  onDealClick: (deal: Deal) => void;
  onDealDrop: (dealId: string, newDate: string, newDepartment: string) => void;
  onCellClick: (date: string, department: string) => void;
}

const WEEKDAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeekdaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const count = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= count; d++) {
    const date = new Date(year, month, d);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) {
      days.push(date);
    }
  }
  return days;
}

function DealCard({
  deal,
  onDealClick,
}: {
  deal: Deal;
  onDealClick: (deal: Deal) => void;
}) {
  const handleDragStart = (e: DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', deal.id);
    e.dataTransfer.effectAllowed = 'move';
    (e.target as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = (e: DragEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).style.opacity = '1';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        onDealClick(deal);
      }}
      className="rounded-md px-2 py-1.5 mb-1 text-xs text-white cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow select-none"
      style={{ backgroundColor: STATUS_COLORS[deal.status] }}
    >
      <div className="font-semibold truncate">
        {deal.visitTime} {deal.customerName}
      </div>
      <div className="truncate opacity-90">{deal.salesPerson}</div>
      <div className="truncate opacity-80">
        {deal.property} | {deal.expectedPoints}pt
      </div>
      <div className="flex gap-1 mt-0.5 flex-wrap">
        <span className="bg-white/30 rounded px-1 text-[10px]">
          {STATUS_LABELS[deal.status]}
        </span>
        <span className="bg-white/30 rounded px-1 text-[10px]">
          {SETTLEMENT_LABELS[deal.settlement]}
        </span>
      </div>
    </div>
  );
}

export default function DepartmentCalendar({
  deals,
  departments,
  selectedDepartments,
  selectedDate,
  onDealClick,
  onDealDrop,
  onCellClick,
}: DepartmentCalendarProps) {
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  const visibleDepartments =
    selectedDepartments.length > 0
      ? departments.filter((d) => selectedDepartments.includes(d))
      : departments;

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const days = useMemo(() => getWeekdaysInMonth(year, month), [year, month]);

  const dealMap = useMemo(() => {
    const map = new Map<string, Deal[]>();
    for (const deal of deals) {
      const key = `${deal.visitDate}|${deal.department}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(deal);
    }
    for (const [, cellDeals] of map) {
      cellDeals.sort((a, b) => a.visitTime.localeCompare(b.visitTime));
    }
    return map;
  }, [deals]);

  const todayStr = formatDateStr(new Date());

  const handleDragOver = useCallback((e: DragEvent, cellKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCell(cellKey);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCell(null);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent, date: string, department: string) => {
      e.preventDefault();
      setDragOverCell(null);
      const dealId = e.dataTransfer.getData('text/plain');
      if (dealId) {
        onDealDrop(dealId, date, department);
      }
    },
    [onDealDrop]
  );

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-800">
          {year}年{month + 1}月
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          カードをドラッグ&ドロップで移動できます
        </p>
      </div>

      {/* Grid */}
      <div className="overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 sticky top-0 z-10">
              <th className="border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 w-20 text-left sticky left-0 bg-gray-50 z-20">
                日付
              </th>
              {visibleDepartments.map((dept) => (
                <th
                  key={dept}
                  className="border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700"
                  style={{ minWidth: '180px' }}
                >
                  {dept}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const dateStr = formatDateStr(day);
              const weekday = WEEKDAY_NAMES[day.getDay()];
              const isTodayRow = dateStr === todayStr;

              return (
                <tr
                  key={dateStr}
                  className={isTodayRow ? 'bg-blue-50/60' : ''}
                >
                  <td
                    className={`border border-gray-200 px-3 py-2 text-sm font-medium whitespace-nowrap sticky left-0 z-[5] ${
                      isTodayRow
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'bg-white text-gray-700'
                    }`}
                  >
                    <div>{day.getDate()}</div>
                    <div className="text-[10px] text-gray-400">
                      ({weekday})
                    </div>
                  </td>
                  {visibleDepartments.map((dept) => {
                    const cellKey = `${dateStr}|${dept}`;
                    const cellDeals = dealMap.get(cellKey) || [];
                    const isDragOver = dragOverCell === cellKey;

                    return (
                      <td
                        key={cellKey}
                        className={`border border-gray-200 px-1.5 py-1 align-top cursor-pointer transition-colors ${
                          isDragOver
                            ? 'bg-blue-100 ring-2 ring-inset ring-blue-300'
                            : ''
                        } ${!isDragOver && isTodayRow ? 'bg-blue-50/60' : ''} ${
                          !isDragOver && !isTodayRow
                            ? 'hover:bg-gray-50'
                            : ''
                        }`}
                        style={{ minHeight: '48px' }}
                        onClick={() => onCellClick(dateStr, dept)}
                        onDragOver={(e) => handleDragOver(e, cellKey)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, dateStr, dept)}
                      >
                        {cellDeals.map((deal) => (
                          <DealCard
                            key={deal.id}
                            deal={deal}
                            onDealClick={onDealClick}
                          />
                        ))}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
