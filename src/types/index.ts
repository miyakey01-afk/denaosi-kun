export type DealStatus =
  | 'first_visit'
  | 'proposing'
  | 'quote_submitted'
  | 'negotiating'
  | 'closing';

export type Settlement =
  | 'unsettled'
  | 'in_progress'
  | 'settled';

export type DealResult =
  | 'pending'
  | 'won'
  | 'lost'
  | 'on_hold';

export interface StaffMember {
  employeeId: number;
  name: string;
  department: string;
}

export interface Deal {
  id: string;
  salesPerson: string;
  department: string;
  customerName: string;
  visitDate: string;
  visitTime: string;
  property: string;
  expectedPoints: number;
  status: DealStatus;
  settlement: Settlement;
  result: DealResult;
  memo: string;
  createdAt: string;
  updatedAt: string;
}

export type DealFormData = Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>;

export type ViewMode = 'calendar' | 'list' | 'dashboard';
