import type { DealStatus, Settlement, DealResult } from '../types';

export const STATUS_COLORS: Record<DealStatus, string> = {
  first_visit: '#3B82F6',
  revisit: '#EAB308',
  follow_up: '#F97316',
  closing: '#8B5CF6',
  prospect: '#22C55E',
};

export const RESULT_COLORS: Record<DealResult, string> = {
  won: '#DC2626',
  lost: '#374151',
  prospect: '#F59E0B',
};

export const STATUS_LABELS: Record<DealStatus, string> = {
  first_visit: '初回訪問',
  revisit: '行直し',
  follow_up: '出直し',
  closing: 'クロージング',
  prospect: '見込中',
};

export const SETTLEMENT_LABELS: Record<Settlement, string> = {
  has_settlement: '決済あり',
  no_settlement: '決済なし',
  unknown: '不明',
};

export const RESULT_LABELS: Record<DealResult, string> = {
  won: '受注',
  lost: '失注',
  prospect: '見込',
};

export { STAFF_DEPARTMENTS as DEFAULT_DEPARTMENTS, STAFF_NAMES as DEFAULT_SALES_PERSONS } from '../data/staffMaster';

export const DEPARTMENT_COLORS = [
  { row: 'bg-orange-50', header: 'bg-orange-200 text-orange-900' },
  { row: 'bg-emerald-50', header: 'bg-emerald-200 text-emerald-900' },
  { row: 'bg-yellow-50', header: 'bg-yellow-200 text-yellow-900' },
  { row: 'bg-slate-100', header: 'bg-slate-300 text-slate-800' },
  { row: 'bg-purple-50', header: 'bg-purple-200 text-purple-900' },
  { row: 'bg-sky-50', header: 'bg-sky-200 text-sky-900' },
];
