// ─── Enums ────────────────────────────────────────────────────
export type UserRole = 'partner' | 'manager' | 'senior' | 'junior' | 'article' | 'client';

export type TaskStatus =
  | 'yet_to_start' | 'documents_requested' | 'documents_partial'
  | 'documents_received' | 'under_query' | 'query_resolved'
  | 'in_preparation' | 'internal_review' | 'partner_review'
  | 'ready_to_file' | 'filed' | 'acknowledgement_pending'
  | 'acknowledgement_received' | 'completed'
  | 'pending_approval' | 'approved' | 'in_progress';

export type TaskPriority = 'high' | 'medium' | 'low';

export type ComplianceType =
  | 'gst_r1' | 'gst_r3b' | 'gst_r9' | 'gst_r9c' | 'gst_r2b'
  | 'tds_q1' | 'tds_q2' | 'tds_q3' | 'tds_q4'
  | 'advance_tax_q1' | 'advance_tax_q2' | 'advance_tax_q3' | 'advance_tax_q4'
  | 'itr_individual' | 'itr_company' | 'tax_audit'
  | 'roc_annual_return' | 'mgt7' | 'aoc4' | 'dir3_kyc'
  | 'udin_audit' | 'transfer_pricing' | 'other';

export type BillingStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

// ─── Core entities ────────────────────────────────────────────
export interface User {
  id: string;
  firm_id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  designation?: string;
  is_active: boolean;
  max_tasks: number;
  skills?: string[];
  firm_name?: string;
}

export interface Client {
  id: string;
  firm_id: string;
  name: string;
  display_name?: string;
  client_code?: string;
  group_name?: string;
  pan?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  constitution?: string;
  health_score: number;
  portal_access: boolean;
  retainer_amount: number;
  retainer_balance: number;
  tags?: string[];
  is_active: boolean;
  client_registrations?: ClientRegistration[];
}

export interface ClientRegistration {
  id: string;
  client_id: string;
  type: string;
  registration_number: string;
  registered_name?: string;
  state?: string;
  is_active: boolean;
}

export interface Task {
  id: string;
  firm_id: string;
  client_id: string;
  title: string;
  description?: string;
  compliance_type?: ComplianceType;
  work_type?: string[];
  priority: TaskPriority;
  status: TaskStatus;
  inward_date?: string;
  due_date: string;
  target_date?: string;
  period_from?: string;
  period_to?: string;
  assigned_to: string[];
  assigned_team_id?: string;
  created_by?: string;
  filing_reference?: string;
  acknowledgement_number?: string;
  udin?: string;
  estimated_hours?: number;
  billable_hours?: number;
  fee_amount?: number;
  is_billed: boolean;
  is_recurring: boolean;
  tags?: string[];
  notes?: string;
  risk_score: number;
  created_at: string;
  updated_at: string;
  // Joined
  clients?: Pick<Client, 'id' | 'name' | 'client_code'>;
  teams?: Pick<Team, 'id' | 'name'>;
}

export interface TaskHistory {
  id: string;
  task_id: string;
  from_status?: TaskStatus;
  to_status: TaskStatus;
  changed_by?: string;
  remarks?: string;
  created_at: string;
  users?: { name: string };
}

export interface Team {
  id: string;
  firm_id: string;
  name: string;
  description?: string;
  lead_id?: string;
  team_members?: Array<{ user_id: string; users: Pick<User, 'id' | 'name' | 'role'> }>;
}

export interface TimeEntry {
  id: string;
  firm_id: string;
  user_id: string;
  task_id?: string;
  date: string;
  hours: number;
  description?: string;
  is_billable: boolean;
  created_at: string;
  tasks?: { title: string; clients?: { name: string } };
  users?: { name: string };
}

export interface Invoice {
  id: string;
  firm_id: string;
  client_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  status: BillingStatus;
  line_items: InvoiceLineItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  payment_date?: string;
  created_at: string;
  clients?: Pick<Client, 'name' | 'email'>;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Announcement {
  id: string;
  firm_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_by?: string;
  created_at: string;
  users?: { name: string };
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  task_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface StatutoryDeadline {
  id: string;
  compliance_type: ComplianceType;
  name: string;
  description?: string;
  due_date: string;
  penalty_per_day?: number;
  is_extended: boolean;
}

export interface DashboardStats {
  total?: number;
  completed?: number;
  pending?: number;
  pending_approval?: number;
  overdue?: number;
  due_today?: number;
  due_this_week?: number;
  high_risk?: number;
  // Employee
  assigned?: number;
}

// ─── UI helpers ───────────────────────────────────────────────
export const STATUS_LABELS: Record<TaskStatus, string> = {
  yet_to_start: 'Yet to Start',
  documents_requested: 'Docs Requested',
  documents_partial: 'Docs Partial',
  documents_received: 'Docs Received',
  under_query: 'Under Query',
  query_resolved: 'Query Resolved',
  in_preparation: 'In Preparation',
  internal_review: 'Internal Review',
  partner_review: 'Partner Review',
  ready_to_file: 'Ready to File',
  filed: 'Filed',
  acknowledgement_pending: 'Ack. Pending',
  acknowledgement_received: 'Ack. Received',
  completed: 'Completed',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  in_progress: 'In Progress',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  yet_to_start: 'badge-muted',
  documents_requested: 'badge-warning',
  documents_partial: 'badge-warning',
  documents_received: 'badge-info',
  under_query: 'badge-danger',
  query_resolved: 'badge-info',
  in_preparation: 'badge-brand',
  internal_review: 'badge-brand',
  partner_review: 'badge-info',
  ready_to_file: 'badge-success',
  filed: 'badge-success',
  acknowledgement_pending: 'badge-warning',
  acknowledgement_received: 'badge-success',
  completed: 'badge-success',
  pending_approval: 'badge-warning',
  approved: 'badge-success',
  in_progress: 'badge-brand',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  high: 'text-danger',
  medium: 'text-warning',
  low: 'text-success',
};

export const COMPLIANCE_LABELS: Partial<Record<ComplianceType, string>> = {
  gst_r1: 'GSTR-1',
  gst_r3b: 'GSTR-3B',
  gst_r9: 'GSTR-9',
  tds_q1: 'TDS Q1',
  tds_q2: 'TDS Q2',
  tds_q3: 'TDS Q3',
  tds_q4: 'TDS Q4',
  itr_individual: 'ITR Individual',
  itr_company: 'ITR Company',
  tax_audit: 'Tax Audit',
  roc_annual_return: 'ROC Annual Return',
  mgt7: 'MGT-7',
  aoc4: 'AOC-4',
  dir3_kyc: 'DIR-3 KYC',
  udin_audit: 'UDIN Audit',
  advance_tax_q1: 'Advance Tax Q1',
  advance_tax_q2: 'Advance Tax Q2',
  advance_tax_q3: 'Advance Tax Q3',
  advance_tax_q4: 'Advance Tax Q4',
  other: 'Other',
};
