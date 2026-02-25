import { useState, useCallback } from 'react';
import type { Deal, DealFormData, ViewMode } from './types';
import { useDeals } from './hooks/useDeals';
import { useMasterData } from './hooks/useMasterData';
import { useCalendarEvents } from './hooks/useCalendarEvents';
import Layout from './components/Layout/Layout';
import CalendarView from './components/Calendar/CalendarView';
import DealList from './components/List/DealList';
import Dashboard from './components/Dashboard/Dashboard';
import DealFormModal from './components/Form/DealFormModal';

export default function App() {
  const { deals, loading, addDeal, updateDeal, deleteDeal } = useDeals();
  const { departments, salesPersons } = useMasterData();
  const events = useCalendarEvents(deals);

  const [currentView, setCurrentView] = useState<ViewMode>('calendar');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>();
  const [presetDate, setPresetDate] = useState<string>('');
  const [presetTime, setPresetTime] = useState<string>('');

  const openNewDeal = useCallback(() => {
    setEditingDeal(undefined);
    setPresetDate('');
    setPresetTime('');
    setModalOpen(true);
  }, []);

  const openEditDeal = useCallback((deal: Deal) => {
    setEditingDeal(deal);
    setModalOpen(true);
  }, []);

  const handleDateSelect = useCallback((date: string, time: string) => {
    setEditingDeal(undefined);
    setPresetDate(date);
    setPresetTime(time);
    setModalOpen(true);
  }, []);

  const handleSubmit = useCallback(async (data: DealFormData) => {
    if (editingDeal) {
      await updateDeal(editingDeal.id, data);
    } else {
      const formData = { ...data };
      if (presetDate) formData.visitDate = presetDate;
      if (presetTime) formData.visitTime = presetTime;
      await addDeal(formData);
    }
  }, [editingDeal, presetDate, presetTime, addDeal, updateDeal]);

  const handleEventDrop = useCallback(async (dealId: string, newDate: string) => {
    await updateDeal(dealId, { visitDate: newDate });
  }, [updateDeal]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteDeal(id);
  }, [deleteDeal]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <Layout
      currentView={currentView}
      onViewChange={setCurrentView}
      onNewDeal={openNewDeal}
    >
      {currentView === 'calendar' && (
        <CalendarView
          events={events}
          onEventClick={openEditDeal}
          onEventDrop={handleEventDrop}
          onDateSelect={handleDateSelect}
        />
      )}

      {currentView === 'list' && (
        <DealList
          deals={deals}
          onDealClick={openEditDeal}
        />
      )}

      {currentView === 'dashboard' && (
        <Dashboard deals={deals} />
      )}

      <DealFormModal
        isOpen={modalOpen}
        deal={editingDeal}
        departments={departments}
        salesPersons={salesPersons}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </Layout>
  );
}
