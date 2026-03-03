import { useState, useMemo } from 'react';

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function MiniCalendar({ selectedDate, onDateSelect }: MiniCalendarProps) {
  const [displayMonth, setDisplayMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const days = useMemo(() => {
    const year = displayMonth.getFullYear();
    const month = displayMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d));
    }
    return cells;
  }, [displayMonth]);

  const prevMonth = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setDisplayMonth(new Date(displayMonth.getFullYear(), displayMonth.getMonth() + 1, 1));
  };

  const isSelected = (date: Date) =>
    date.getFullYear() === selectedDate.getFullYear() &&
    date.getMonth() === selectedDate.getMonth() &&
    date.getDate() === selectedDate.getDate();

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isSameMonth = (date: Date) =>
    date.getMonth() === selectedDate.getMonth() &&
    date.getFullYear() === selectedDate.getFullYear();

  return (
    <div className="px-3">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={prevMonth}
          className="text-gray-400 hover:text-gray-700 p-1 text-xs"
        >
          ◀
        </button>
        <span className="text-sm font-medium text-gray-700">
          {displayMonth.getFullYear()}年{displayMonth.getMonth() + 1}月
        </span>
        <button
          onClick={nextMonth}
          className="text-gray-400 hover:text-gray-700 p-1 text-xs"
        >
          ▶
        </button>
      </div>
      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={`py-0.5 text-[10px] font-medium ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
            }`}
          >
            {d}
          </div>
        ))}
        {days.map((date, i) => (
          <div key={i} className="flex justify-center py-px">
            {date ? (
              <button
                onClick={() => {
                  onDateSelect(date);
                  if (
                    date.getMonth() !== displayMonth.getMonth() ||
                    date.getFullYear() !== displayMonth.getFullYear()
                  ) {
                    setDisplayMonth(new Date(date.getFullYear(), date.getMonth(), 1));
                  }
                }}
                className={`w-6 h-6 rounded-full text-[11px] leading-6 transition-colors
                  ${isSelected(date) ? 'bg-blue-600 text-white' : ''}
                  ${isToday(date) && !isSelected(date) ? 'bg-blue-100 text-blue-700 font-bold' : ''}
                  ${!isSelected(date) && !isToday(date) && isSameMonth(date) ? 'hover:bg-gray-200 text-gray-700' : ''}
                  ${!isSelected(date) && !isToday(date) && !isSameMonth(date) ? 'text-gray-300' : ''}
                  ${date.getDay() === 0 && !isSelected(date) ? 'text-red-500' : ''}
                  ${date.getDay() === 6 && !isSelected(date) ? 'text-blue-500' : ''}
                `}
              >
                {date.getDate()}
              </button>
            ) : (
              <div className="w-6 h-6" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
