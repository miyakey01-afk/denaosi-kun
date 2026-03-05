import { useState, useCallback } from 'react';
import type { Deal, DealFormData, ViewMode } from './types';
import { useOfficeAuth } from './hooks/useOfficeAuth';
import { useDeals } from './hooks/useDeals';
import { useMasterData } from './hooks/useMasterData';
import Layout from './components/Layout/Layout';
import DepartmentCalendar from './components/Calendar/DepartmentCalendar';
import DealList from './components/List/DealList';
import Dashboard from './components/Dashboard/Dashboard';
import DealFormModal from './components/Form/DealFormModal';
import PasscodePage from './components/Auth/PasscodePage';
import AdminPage from './components/Admin/AdminPage';

export default function App() {
  const auth = useOfficeAuth();
  const { deals, loading, addDeal, updateDeal, deleteDeal } = useDeals(auth.officeId);
  const { departments, salesPersons, staffMembers, updateDepartments } = useMasterData(auth.office);

  const [currentView, setCurrentView] = useState<ViewMode>('calendar');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | undefined>();
  const [presetDate, setPresetDate] = useState<string>('');
  const [presetTime, setPresetTime] = useState<string>('');
  const [presetDepartment, setPresetDepartment] = useState<string>('');

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
      if (prev.length === 0) return [dept];
      if (prev.includes(dept)) return prev.filter((d) => d !== dept);
      return [...prev, dept];
    });
  }, []);

  const handleDepartmentSelectAll = useCallback(() => {
    setSelectedDepartments([]);
  }, []);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  // Loading state
  if (auth.loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  // Admin mode
  if (auth.isAdmin) {
    return <AdminPage onLogout={auth.logout} />;
  }

  // Not authenticated
  if (!auth.officeId) {
    return <PasscodePage error={auth.error} onLogin={auth.login} />;
  }

  // Data loading
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
      onDepartmentsUpdate={updateDepartments}
      selectedDate={selectedDate}
      onDateSelect={handleDateSelect}
      officeName={auth.office?.name}
      onLogout={auth.logout}
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
          onDealDelete={handleDelete}
        />
      )}

      {currentView === 'dashboard' && (
        <Dashboard deals={deals} departments={departments} selectedDate={selectedDate} onDateChange={handleDateSelect} />
      )}

      <DealFormModal
        isOpen={modalOpen}
        deal={editingDeal}
        departments={departments}
        salesPersons={salesPersons}
        staffMembers={staffMembers}
        presetDepartment={presetDepartment}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </Layout>
  );
}
