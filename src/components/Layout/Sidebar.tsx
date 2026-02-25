import type { ViewMode } from '../../types';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const NAV_ITEMS: { view: ViewMode; label: string; icon: string }[] = [
  { view: 'calendar', label: 'カレンダー', icon: '📅' },
  { view: 'list', label: '案件一覧', icon: '📋' },
  { view: 'dashboard', label: 'ダッシュボード', icon: '📊' },
];

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <aside className="w-48 bg-gray-50 border-r border-gray-200 min-h-0 flex-shrink-0">
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
    </aside>
  );
}
