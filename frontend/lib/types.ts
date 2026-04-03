export type Role = "admin" | "manager" | "employee";
export type ExpenseStatus = "pending" | "approved" | "rejected";

export interface User {
  id: number;
  organization_id: number;
  full_name: string;
  email: string;
  role: Role;
  title: string;
  team_name: string;
  is_active: boolean;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  organization: Organization;
}

export interface Budget {
  id: number;
  organization_id: number;
  category: string;
  month_start: string;
  monthly_limit: number;
}

export interface Expense {
  id: number;
  organization_id: number;
  owner_id: number;
  title: string;
  category: string;
  amount: number;
  currency: string;
  status: ExpenseStatus;
  spent_at: string;
  notes?: string | null;
  receipt_url?: string | null;
  created_at: string;
  updated_at: string;
  owner: User;
}

export interface Notification {
  id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AnalyticsTrendPoint {
  month: string;
  amount: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
}

export interface BudgetPerformance {
  category: string;
  budget_limit: number;
  spent: number;
  remaining: number;
  utilization_percent: number;
}

export interface AnalyticsOverview {
  total_spend: number;
  pending_expenses: number;
  approved_spend: number;
  team_members: number;
  trend: AnalyticsTrendPoint[];
  category_breakdown: CategoryBreakdown[];
  budget_performance: BudgetPerformance[];
}

export interface TeamReportRow {
  user_id: number;
  full_name: string;
  email: string;
  role: Role;
  submitted_count: number;
  approved_total: number;
  pending_total: number;
}

export interface TeamReportResponse {
  generated_at: string;
  rows: TeamReportRow[];
  top_categories: CategoryBreakdown[];
}

export interface HealthResponse {
  status: "ok" | "degraded";
  service: string;
  checks: {
    backend: "connected" | "not_connected";
    database: "connected" | "not_connected";
    redis: "connected" | "not_connected";
    blob_storage: "connected" | "not_connected";
  };
}
