import type { ViewMode } from '../../types';
import MiniCalendar from '../Calendar/MiniCalendar';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  departments: string[];
  selectedDepartments: string[];
  onDepartmentToggle: (department: string) => void;
  onDepartmentSelectAll: () => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const NAV_ITEMS: { view: ViewMode; label: string; icon: string }[] = [
  { view: 'calendar', label: 'カレンダー', icon: '📅' },
  { view: 'list', label: '案件一覧', icon: '📋' },
  { view: 'dashboard', label: 'ダッシュボード', icon: '📊' },
];

export default function Sidebar({
  currentView,
  onViewChange,
  departments,
  selectedDepartments,
  onDepartmentToggle,
  onDepartmentSelectAll,
  selectedDate,
  onDateSelect,
}: SidebarProps) {
  const allSelected =
    selectedDepartments.length === 0 ||
    selectedDepartments.length === departments.length;

  return (
    <aside className="w-56 bg-gray-50 border-r border-gray-200 min-h-0 flex-shrink-0 overflow-y-auto">
      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {NAV_ITEMS.map(({ view, label, icon }) => (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === view
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <span>{icon}</span>
            {label}
          </button>
        ))}
      </nav>

      {/* Divider */}
      <div className="border-t border-gray-200 mx-3 my-1" />

      {/* Mini Calendar */}
      <MiniCalendar selectedDate={selectedDate} onDateSelect={onDateSelect} />

      {/* Divider */}
      <div className="border-t border-gray-200 mx-3 my-2" />

      {/* Department Filter */}
      <div className="px-3 pb-4">
        <h3 className="text-xs font-semibold text-gray-500 mb-2 tracking-wide">
          所属課フィルター
        </h3>
        <div className="space-y-0.5">
          <button
            onClick={onDepartmentSelectAll}
            className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
              allSelected
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            すべて表示
          </button>
          {departments.map((dept) => {
            const isActive =
              selectedDepartments.length > 0 &&
              selectedDepartments.includes(dept);
            return (
              <button
                key={dept}
                onClick={() => onDepartmentToggle(dept)}
                className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {dept}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
