import type { ReactNode } from 'react';
import type { ViewMode } from '../../types';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onNewDeal: () => void;
  departments: string[];
  selectedDepartments: string[];
  onDepartmentToggle: (department: string) => void;
  onDepartmentSelectAll: () => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  children: ReactNode;
}

export default function Layout({
  currentView,
  onViewChange,
  onNewDeal,
  departments,
  selectedDepartments,
  onDepartmentToggle,
  onDepartmentSelectAll,
  selectedDate,
  onDateSelect,
  children,
}: LayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Header onNewDeal={onNewDeal} />
      <div className="flex flex-1 min-h-0">
        <Sidebar
          currentView={currentView}
          onViewChange={onViewChange}
          departments={departments}
          selectedDepartments={selectedDepartments}
          onDepartmentToggle={onDepartmentToggle}
          onDepartmentSelectAll={onDepartmentSelectAll}
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
        />
        <main className="flex-1 p-4 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
