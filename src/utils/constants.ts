import type { DealStatus, Settlement, DealResult } from '../types';

export const STATUS_COLORS: Record<DealStatus, string> = {
  first_visit: '#3B82F6',
  proposing: '#EAB308',
  quote_submitted: '#F97316',
  negotiating: '#EF4444',
  closing: '#8B5CF6',
};

export const RESULT_COLORS: Record<DealResult, string> = {
  pending: '#6B7280',
  won: '#22C55E',
  lost: '#374151',
  on_hold: '#F59E0B',
};

export const STATUS_LABELS: Record<DealStatus, string> = {
  first_visit: '初回訪問',
  proposing: '提案中',
  quote_submitted: '見積提出',
  negotiating: '交渉中',
  closing: 'クロージング',
};

export const SETTLEMENT_LABELS: Record<Settlement, string> = {
  unsettled: '未決済',
  in_progress: '決済中',
  settled: '決済済',
};

export const RESULT_LABELS: Record<DealResult, string> = {
  pending: '未確定',
  won: '受注',
  lost: '失注',
  on_hold: '保留',
};

export const DEFAULT_DEPARTMENTS = [
  '営業1課',
  '営業2課',
  '東京支店',
  '大阪支店',
];

export const DEFAULT_SALES_PERSONS = [
  '田中太郎',
  '山田花子',
  '佐藤次郎',
];
