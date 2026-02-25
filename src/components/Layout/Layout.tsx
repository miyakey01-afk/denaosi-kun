import type { ReactNode } from 'react';
import type { ViewMode } from '../../types';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onNewDeal: () => void;
  children: ReactNode;
}

export default function Layout({ currentView, onViewChange, onNewDeal, children }: LayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Header onNewDeal={onNewDeal} />
      <div className="flex flex-1 min-h-0">
        <Sidebar currentView={currentView} onViewChange={onViewChange} />
        <main className="flex-1 p-4 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
