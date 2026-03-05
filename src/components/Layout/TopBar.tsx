import { useState, useRef, useEffect } from 'react';
import type { ViewMode } from '../../types';
import MiniCalendar from '../Calendar/MiniCalendar';

interface TopBarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onNewDeal: () => void;
  departments: string[];
  selectedDepartments: string[];
  onDepartmentToggle: (department: string) => void;
  onDepartmentSelectAll: () => void;
  onDepartmentsUpdate: (list: string[]) => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  officeName?: string;
  onLogout?: () => void;
}

const NAV_ITEMS: { view: ViewMode; label: string; icon: string }[] = [
  { view: 'calendar', label: 'カレンダー', icon: '📅' },
  { view: 'list', label: '案件一覧', icon: '📋' },
  { view: 'dashboard', label: 'ダッシュボード', icon: '📊' },
];

export default function TopBar({
  currentView,
  onViewChange,
  onNewDeal,
  departments,
  selectedDepartments,
  onDepartmentToggle,
  onDepartmentSelectAll,
  onDepartmentsUpdate,
  selectedDate,
  onDateSelect,
  officeName,
  onLogout,
}: TopBarProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [addingDept, setAddingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const calRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allSelected =
    selectedDepartments.length === 0 ||
    selectedDepartments.length === departments.length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    }
    if (calendarOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [calendarOpen]);

  useEffect(() => {
    if (addingDept && inputRef.current) inputRef.current.focus();
  }, [addingDept]);

  const handleAddDept = () => {
    const name = newDeptName.trim();
    if (name && !departments.includes(name)) {
      onDepartmentsUpdate([...departments, name]);
    }
    setNewDeptName('');
    setAddingDept(false);
  };

  const handleRemoveDept = (dept: string) => {
    if (confirm(`「${dept}」を削除しますか？`)) {
      onDepartmentsUpdate(departments.filter((d) => d !== dept));
    }
  };

  const dateLabel = `${selectedDate.getFullYear()}/${selectedDate.getMonth() + 1}/${selectedDate.getDate()}`;

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Row 1: Title + Nav + Date + New Deal */}
      <div className="px-4 py-2 flex items-center gap-4 flex-wrap">
        {/* Title */}
        <div className="flex items-center gap-2 mr-2">
          <h1 className="text-lg font-bold text-gray-800 whitespace-nowrap">出直しくん</h1>
          <span className="text-xs text-gray-400 hidden sm:inline whitespace-nowrap">営業パイプライン管理</span>
        </div>

        {/* Navigation tabs */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map(({ view, label, icon }) => (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === view
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-xs">{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        {/* Date picker */}
        <div className="relative" ref={calRef}>
          <button
            onClick={() => setCalendarOpen(!calendarOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-300 bg-white"
          >
            <span className="text-xs">📅</span>
            {dateLabel}
            <span className="text-[10px] text-gray-400 ml-1">▼</span>
          </button>
          {calendarOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2 w-56">
              <MiniCalendar
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  onDateSelect(date);
                  setCalendarOpen(false);
                }}
              />
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Office name */}
        {officeName && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap">
            {officeName}
          </span>
        )}

        {/* New Deal button */}
        <button
          onClick={onNewDeal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
        >
          + 新規案件
        </button>

        {/* Logout button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
          >
            ログアウト
          </button>
        )}
      </div>

      {/* Row 2: Department filter */}
      <div className="px-4 py-1.5 border-t border-gray-100 flex items-center gap-1 flex-wrap bg-gray-50">
        <span className="text-xs text-gray-500 font-semibold mr-1">所属:</span>
        <button
          onClick={onDepartmentSelectAll}
          className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
            allSelected
              ? 'bg-blue-100 text-blue-700 font-semibold'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          すべて
        </button>
        {departments.map((dept) => {
          const isActive =
            selectedDepartments.length > 0 &&
            selectedDepartments.includes(dept);
          return (
            <span key={dept} className="relative group inline-flex">
              <button
                onClick={() => onDepartmentToggle(dept)}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {dept}
              </button>
              <button
                onClick={() => handleRemoveDept(dept)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] leading-none hidden group-hover:flex items-center justify-center hover:bg-red-600"
                title={`${dept}を削除`}
              >
                ×
              </button>
            </span>
          );
        })}

        {addingDept ? (
          <form
            className="inline-flex items-center gap-1"
            onSubmit={(e) => { e.preventDefault(); handleAddDept(); }}
          >
            <input
              ref={inputRef}
              type="text"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="所属名"
              className="border border-gray-300 rounded px-2 py-0.5 text-xs w-24 focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
            <button
              type="submit"
              className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            >
              追加
            </button>
            <button
              type="button"
              onClick={() => { setAddingDept(false); setNewDeptName(''); }}
              className="px-1.5 py-0.5 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          </form>
        ) : (
          <button
            onClick={() => setAddingDept(true)}
            className="px-2 py-0.5 rounded text-xs font-medium text-blue-600 hover:bg-blue-50 border border-dashed border-blue-300"
            title="所属を追加"
          >
            + 追加
          </button>
        )}
      </div>
    </div>
  );
}
