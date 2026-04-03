"use client";

import type { FormEvent } from "react";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DashboardHero } from "@/components/dashboard-hero";
import { BudgetBars, CategoryDonut, SpendTrendChart } from "@/components/charts";
import { ExpenseTable, NotificationList } from "@/components/expense-table";
import { StatCard } from "@/components/stat-card";
import { api, ApiError } from "@/lib/api";
import { getStoredUser, getToken } from "@/lib/auth";
import type { AnalyticsOverview, Budget, Expense, Notification, User } from "@/lib/types";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const initialAnalytics: AnalyticsOverview = {
  total_spend: 0,
  pending_expenses: 0,
  approved_spend: 0,
  team_members: 0,
  trend: [],
  category_breakdown: [],
  budget_performance: [],
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [reviewingExpenseId, setReviewingExpenseId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "Hotel stay for client workshop",
    category: "Travel",
    amount: "460",
    currency: "INR",
    spent_at: new Date().toISOString().slice(0, 16),
    notes: "Two-night stay near client office",
  });

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    async function load() {
      try {
        const [me, overview, recentExpenses, budgetItems, notificationItems] = await Promise.all([
          api.me(),
          api.analytics(),
          api.expenses(8),
          api.budgets(),
          api.notifications(),
        ]);
        startTransition(() => {
          setUser(me);
          setAnalytics(overview);
          setExpenses(recentExpenses);
          setBudgets(budgetItems);
          setNotifications(notificationItems);
        });
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Unable to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [router]);

  async function refreshDashboardData() {
    const [overview, recentExpenses, budgetItems, notificationItems] = await Promise.all([
      api.analytics(),
      api.expenses(8),
      api.budgets(),
      api.notifications(),
    ]);
    setAnalytics(overview);
    setExpenses(recentExpenses);
    setBudgets(budgetItems);
    setNotifications(notificationItems);
  }

  async function createExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError("");

    try {
      await api.createExpense({
        title: form.title,
        category: form.category,
        amount: Number(form.amount),
        currency: form.currency,
        spent_at: new Date(form.spent_at).toISOString(),
        notes: form.notes,
      });
      await refreshDashboardData();
      setForm({
        title: "",
        category: "Travel",
        amount: "",
        currency: "INR",
        spent_at: new Date().toISOString().slice(0, 16),
        notes: "",
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create expense");
    } finally {
      setCreating(false);
    }
  }

  async function handleReview(expenseId: number, status: "approved" | "rejected") {
    try {
      setReviewingExpenseId(expenseId);
      setError("");
      await api.reviewExpense(expenseId, status);
      await refreshDashboardData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to review expense");
    } finally {
      setReviewingExpenseId(null);
    }
  }

  if (!user) {
    return null;
  }

  return (
    <AppShell
      user={user}
      heading="Dashboard"
      subheading="Track approvals, spending patterns, and budget health across your finance workspace."
    >
      {loading ? <div className="empty-state">Loading dashboard...</div> : null}
      {error ? <div className="banner-error">{error}</div> : null}

      <DashboardHero analytics={analytics} expenses={expenses} user={user} />

      <section className="stats-grid compact">
        <StatCard label="Total spend" value={money.format(analytics.total_spend)} hint="Month-to-date tracked expenses" />
        <StatCard label="Approved spend" value={money.format(analytics.approved_spend)} hint="Cleared by reviewers" />
        <StatCard
          label="Pending expenses"
          value={String(analytics.pending_expenses)}
          hint="Awaiting a decision"
        />
        <StatCard
          label="Team members"
          value={String(analytics.team_members || budgets.length)}
          hint="Users active in this org"
        />
      </section>

      <section className="dashboard-grid">
        <SpendTrendChart points={analytics.trend} />
        <CategoryDonut items={analytics.category_breakdown} />
      </section>

      <section className="dashboard-grid single-right">
        <BudgetBars items={analytics.budget_performance.length ? analytics.budget_performance : budgets.map((budget) => ({
          category: budget.category,
          budget_limit: budget.monthly_limit,
          spent: 0,
          remaining: budget.monthly_limit,
          utilization_percent: 0,
        }))} />
        <div className="table-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Quick add</p>
              <h3>Create expense</h3>
            </div>
          </div>
          <form className="expense-form" onSubmit={createExpense}>
            <input
              placeholder="Expense title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              required
            />
            <div className="form-row">
              <input
                placeholder="Category"
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                required
              />
              <input
                placeholder="Amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                required
              />
            </div>
            <div className="form-row">
              <input
                placeholder="Currency"
                value={form.currency}
                onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))}
                required
              />
              <input
                type="datetime-local"
                value={form.spent_at}
                onChange={(event) => setForm((current) => ({ ...current, spent_at: event.target.value }))}
                required
              />
            </div>
            <textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              rows={4}
            />
            <button className="primary-button" disabled={creating} type="submit">
              {creating ? "Saving..." : "Submit expense"}
            </button>
          </form>
        </div>
      </section>

      <section className="dashboard-grid single-right">
        <ExpenseTable
          expenses={expenses}
          viewerRole={user.role}
          activeReviewId={reviewingExpenseId}
          onReview={handleReview}
        />
        <NotificationList items={notifications} />
      </section>
    </AppShell>
  );
}
