import { clearSession, getToken } from "@/lib/auth";
import type {
  AnalyticsOverview,
  AuthResponse,
  Budget,
  Expense,
  ExpenseStatus,
  HealthResponse,
  Notification,
  TeamReportResponse,
  User,
} from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";
const SERVICE_BASE = API_BASE.endsWith("/api") ? API_BASE.slice(0, -4) : API_BASE;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}, withAuth = true): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (withAuth) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = "Something went wrong";
    try {
      const payload = await response.json();
      message = payload.detail ?? message;
    } catch {
      message = response.statusText || message;
    }

    if (response.status === 401) {
      clearSession();
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }, false),
  me: () => request<User>("/auth/me"),
  analytics: () => request<AnalyticsOverview>("/analytics/overview"),
  budgets: () => request<Budget[]>("/budgets"),
  expenses: (limit = 8) => request<Expense[]>(`/expenses?limit=${limit}`),
  health: async () => {
    const response = await fetch(`${SERVICE_BASE}/health`);
    let payload: HealthResponse | null = null;
    try {
      payload = (await response.json()) as HealthResponse;
    } catch {
      payload = null;
    }

    if (!response.ok && payload === null) {
      throw new ApiError("Unable to read health status", response.status);
    }
    if (payload === null) {
      throw new ApiError("Unable to read health status", response.status);
    }
    return payload;
  },
  notifications: () => request<Notification[]>("/notifications"),
  createExpense: (payload: {
    title: string;
    category: string;
    amount: number;
    currency: string;
    spent_at: string;
    notes?: string;
    receipt_url?: string;
  }) =>
    request<Expense>("/expenses", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  reviewExpense: (expenseId: number, status: ExpenseStatus) =>
    request<Expense>(`/expenses/${expenseId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  teamReport: () => request<TeamReportResponse>("/reports/team"),
  downloadTeamReportCsv: async () => {
    const response = await fetch(`${API_BASE}/reports/team/export`, {
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });

    if (!response.ok) {
      throw new ApiError("Unable to export report", response.status);
    }

    return response.text();
  },
};
