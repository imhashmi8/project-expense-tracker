"use client";

import type { AnalyticsOverview, Expense, User } from "@/lib/types";

import { StatCard } from "@/components/stat-card";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function buildSparkline(points: AnalyticsOverview["trend"]) {
  if (!points.length) {
    return "0,74 100,74";
  }

  const max = Math.max(...points.map((point) => point.amount), 1);
  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 82 - (point.amount / max) * 58;
      return `${x},${y}`;
    })
    .join(" ");
}

interface DashboardHeroProps {
  analytics: AnalyticsOverview;
  expenses: Expense[];
  user: User;
}

export function DashboardHero({ analytics, expenses, user }: DashboardHeroProps) {
  const latestMonth = analytics.trend.at(-1)?.month ?? "This month";
  const latestAmount = analytics.trend.at(-1)?.amount ?? 0;
  const previousAmount = analytics.trend.at(-2)?.amount ?? 0;
  const deltaPercent =
    previousAmount > 0 ? Math.round(((latestAmount - previousAmount) / previousAmount) * 100) : 0;
  const pendingReviews = expenses.filter((expense) => expense.status === "pending").length;
  const totalRemainingBudget = analytics.budget_performance.reduce(
    (sum, item) => sum + item.remaining,
    0,
  );
  const averageUtilization = analytics.budget_performance.length
    ? Math.round(
        analytics.budget_performance.reduce((sum, item) => sum + item.utilization_percent, 0) /
          analytics.budget_performance.length,
      )
    : 0;

  return (
    <section className="dashboard-hero-grid">
      <article className="summary-hero-card">
        <div className="summary-hero-copy">
          <div>
            <p className="eyebrow">Finance pulse</p>
            <h3>{user.team_name} spend overview</h3>
            <p className="subtle">
              A cleaner view of approvals, active budgets, and month-to-date expense momentum.
            </p>
          </div>

          <div className="summary-total-row">
            <div>
              <span className="summary-label">Total spend tracked</span>
              <strong>{money.format(analytics.total_spend)}</strong>
            </div>
            <div className={deltaPercent >= 0 ? "summary-delta rise" : "summary-delta fall"}>
              <span>{latestMonth}</span>
              <strong>{deltaPercent >= 0 ? `+${deltaPercent}%` : `${deltaPercent}%`}</strong>
            </div>
          </div>
        </div>

        <div className="sparkline-card">
          <div className="sparkline-copy">
            <span>Monthly rhythm</span>
            <strong>{money.format(latestAmount)}</strong>
          </div>
          <svg viewBox="0 0 100 90" className="mini-sparkline" preserveAspectRatio="none">
            <defs>
              <linearGradient id="heroSparklineFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#53f0d5" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#53f0d5" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <polyline
              fill="none"
              stroke="#9ff7ea"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={buildSparkline(analytics.trend)}
            />
          </svg>
          <div className="sparkline-labels">
            {analytics.trend.slice(-4).map((point) => (
              <span key={point.month}>{point.month}</span>
            ))}
          </div>
        </div>

        <div className="summary-metrics-strip">
          <div>
            <span>Approved</span>
            <strong>{money.format(analytics.approved_spend)}</strong>
          </div>
          <div>
            <span>Pending queue</span>
            <strong>{pendingReviews}</strong>
          </div>
          <div>
            <span>Remaining budgets</span>
            <strong>{money.format(totalRemainingBudget)}</strong>
          </div>
        </div>
      </article>

      <div className="summary-side-cards">
        <StatCard
          label="Approvals in queue"
          value={String(analytics.pending_expenses)}
          hint="Needs manager/admin review"
          tone="accent"
        />
        <StatCard
          label="Average budget use"
          value={`${averageUtilization}%`}
          hint="Across active categories"
        />
        <StatCard
          label="Active team members"
          value={String(analytics.team_members)}
          hint="Contributors in this workspace"
        />
      </div>
    </section>
  );
}
