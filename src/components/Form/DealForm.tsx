import { useState, useMemo, type FormEvent } from 'react';
import type { Deal, DealFormData, DealStatus, Settlement, DealResult, StaffMember } from '../../types';
import { STATUS_LABELS, SETTLEMENT_LABELS, RESULT_LABELS } from '../../utils/constants';
import { formatDate } from '../../utils/helpers';

interface DealFormProps {
  initialData?: Deal;
  departments: string[];
  salesPersons: string[];
  staffMembers: StaffMember[];
  presetDepartment?: string;
  onSubmit: (data: DealFormData) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

/** 30分刻みの時間帯（9:00〜18:00） */
const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 9; h <= 18; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 18 && m > 0) break;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return slots;
})();

const EMPTY_FORM: DealFormData = {
  salesPerson: '',
  department: '',
  customerName: '',
  visitDate: formatDate(new Date()),
  visitTime: '09:00',
  property: '',
  expectedPoints: 0,
  status: 'first_visit',
  settlement: 'unsettled',
  result: 'pending',
  memo: '',
};

export default function DealForm({
  initialData,
  departments,
  salesPersons: _salesPersons,
  staffMembers,
  presetDepartment,
  onSubmit,
  onCancel,
  onDelete,
}: DealFormProps) {
  void _salesPersons;
  const [form, setForm] = useState<DealFormData>(
    initialData
      ? {
          salesPerson: initialData.salesPerson,
          department: initialData.department,
          customerName: initialData.customerName,
          visitDate: initialData.visitDate,
          visitTime: initialData.visitTime,
          property: initialData.property,
          expectedPoints: initialData.expectedPoints,
          status: initialData.status,
          settlement: initialData.settlement,
          result: initialData.result,
          memo: initialData.memo,
        }
      : {
          ...EMPTY_FORM,
          department: presetDepartment || '',
        }
  );

  // Whether user is entering a name manually (not in master)
  const [manualInput, setManualInput] = useState(false);

  // Build a map: name → department for quick lookup
  const staffMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of staffMembers) map.set(s.name, s.department);
    return map;
  }, [staffMembers]);

  // Group staff by department for the dropdown
  const staffByDept = useMemo(() => {
    const map = new Map<string, StaffMember[]>();
    for (const s of staffMembers) {
      const list = map.get(s.department) || [];
      list.push(s);
      map.set(s.department, list);
    }
    return map;
  }, [staffMembers]);

  const handleChange = (field: keyof DealFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleNameSelect = (name: string) => {
    if (name === '__manual__') {
      setManualInput(true);
      setForm((prev) => ({ ...prev, salesPerson: '' }));
      return;
    }
    setManualInput(false);
    setForm((prev) => {
      const dept = staffMap.get(name);
      return {
        ...prev,
        salesPerson: name,
        department: dept || prev.department,
      };
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  // Check if current salesPerson is in the staff master
  const isKnownStaff = staffMap.has(form.salesPerson);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 担当者 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">担当者 *</label>
        {manualInput ? (
          <div className="space-y-1">
            <input
              type="text"
              value={form.salesPerson}
              onChange={(e) => handleChange('salesPerson', e.target.value)}
              placeholder="氏名を入力"
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => setManualInput(false)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              一覧から選択
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <select
              value={isKnownStaff || !form.salesPerson ? form.salesPerson : '__manual__'}
              onChange={(e) => handleNameSelect(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">選択してください</option>
              {[...staffByDept.entries()].map(([dept, members]) => (
                <optgroup key={dept} label={dept}>
                  {members.map((s) => (
                    <option key={s.employeeId} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value="__manual__">-- その他（手入力）--</option>
            </select>
          </div>
        )}
      </div>

      {/* 所属 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          所属課 *
          {isKnownStaff && (
            <span className="ml-2 text-xs text-green-600 font-normal">自動反映済</span>
          )}
        </label>
        <select
          value={form.department}
          onChange={(e) => handleChange('department', e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">選択してください</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* 顧客名 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">顧客名 *</label>
        <input
          type="text"
          value={form.customerName}
          onChange={(e) => handleChange('customerName', e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* 訪問日・時間 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">訪問日 *</label>
          <input
            type="date"
            value={form.visitDate}
            onChange={(e) => handleChange('visitDate', e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">訪問時間 *</label>
          <select
            value={form.visitTime}
            onChange={(e) => handleChange('visitTime', e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 提案物件 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">提案物件 *</label>
        <input
          type="text"
          value={form.property}
          onChange={(e) => handleChange('property', e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* 予想ポイント */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">予想ポイント *</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            value={form.expectedPoints}
            onChange={(e) => handleChange('expectedPoints', Number(e.target.value))}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-sm text-gray-500 whitespace-nowrap">pt</span>
        </div>
      </div>

      {/* 状態・決済・結果 */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">状態 *</label>
          <select
            value={form.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">決済 *</label>
          <select
            value={form.settlement}
            onChange={(e) => handleChange('settlement', e.target.value as Settlement)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(SETTLEMENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">結果</label>
          <select
            value={form.result}
            onChange={(e) => handleChange('result', e.target.value as DealResult)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.entries(RESULT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* メモ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
        <textarea
          value={form.memo}
          onChange={(e) => handleChange('memo', e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      {/* ボタン */}
      <div className="flex items-center justify-between pt-2">
        <div>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              削除
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {initialData ? '更新' : '保存'}
          </button>
        </div>
      </div>
    </form>
  );
}

// Suppress unused import warnings - these are used via string type values
void (0 as unknown as DealStatus);
