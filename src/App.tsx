import { useState, useCallback } from 'react';
import type { Deal, DealFormData, ViewMode } from './types';
import { useDeals } from './hooks/useDeals';
import { useMasterData } from './hooks/useMasterData';
import Layout from './components/Layout/Layout';
import DepartmentCalendar from './components/Calendar/DepartmentCalendar';
import DealList from './components/List/DealList';
import Dashboard from './components/Dashboard/Dashboard';
import DealFormModal from './components/Form/DealFormModal';

export default function App() {
  const { deals, loading, addDeal, updateDeal, deleteDeal } = useDeals();
  const { departments, salesPersons } = useMasterData();

  const [currentView, setCurrentView] = useState<ViewMode>('calendar');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>();
  const [presetDate, setPresetDate] = useState<string>('');
  const [presetTime, setPresetTime] = useState<string>('');
  const [presetDepartment, setPresetDepartment] = useState<string>('');

  // Department filter & date selection
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  const openNewDeal = useCallback(() => {
    setEditingDeal(undefined);
    setPresetDate('');
    setPresetTime('');
    setPresetDepartment('');
    setModalOpen(true);
  }, []);

  const openEditDeal = useCallback((deal: Deal) => {
    setEditingDeal(deal);
    setModalOpen(true);
  }, []);

  const handleCellClick = useCallback((date: string, department: string) => {
    setEditingDeal(undefined);
    setPresetDate(date);
    setPresetTime('09:00');
    setPresetDepartment(department);
    setModalOpen(true);
  }, []);

  const handleSubmit = useCallback(async (data: DealFormData) => {
    if (editingDeal) {
      await updateDeal(editingDeal.id, data);
    } else {
      const formData = { ...data };
      if (presetDate) formData.visitDate = presetDate;
      if (presetTime) formData.visitTime = presetTime;
      if (presetDepartment) formData.department = presetDepartment;
      await addDeal(formData);
    }
  }, [editingDeal, presetDate, presetTime, presetDepartment, addDeal, updateDeal]);

  const handleDealDrop = useCallback(async (dealId: string, newDate: string, newDepartment: string) => {
    await updateDeal(dealId, { visitDate: newDate, department: newDepartment });
  }, [updateDeal]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteDeal(id);
  }, [deleteDeal]);

  const handleDepartmentToggle = useCallback((dept: string) => {
    setSelectedDepartments((prev) => {
      if (prev.length === 0) {
        // Currently showing all -> select only this one
        return [dept];
      }
      if (prev.includes(dept)) {
        // Deselect
        return prev.filter((d) => d !== dept);
      }
      // Add to selection
      return [...prev, dept];
    });
  }, []);

  const handleDepartmentSelectAll = useCallback(() => {
    setSelectedDepartments([]);
  }, []);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

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
      departments={departments}
      selectedDepartments={selectedDepartments}
      onDepartmentToggle={handleDepartmentToggle}
      onDepartmentSelectAll={handleDepartmentSelectAll}
      selectedDate={selectedDate}
      onDateSelect={handleDateSelect}
    >
      {currentView === 'calendar' && (
        <DepartmentCalendar
          deals={deals}
          departments={departments}
          selectedDepartments={selectedDepartments}
          selectedDate={selectedDate}
          onDealClick={openEditDeal}
          onDealDrop={handleDealDrop}
          onCellClick={handleCellClick}
          onDateChange={handleDateSelect}
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
        presetDepartment={presetDepartment}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </Layout>
  );
}
