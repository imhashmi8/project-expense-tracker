"use client";

import type { AnalyticsTrendPoint, BudgetPerformance, CategoryBreakdown } from "@/lib/types";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function SpendTrendChart({ points }: { points: AnalyticsTrendPoint[] }) {
  if (!points.length) {
    return <div className="empty-state">No trend data yet.</div>;
  }

  const maxAmount = Math.max(...points.map((point) => point.amount), 1);
  const path = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - (point.amount / maxAmount) * 78;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="chart-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Spend trend</p>
          <h3>Monthly outflow</h3>
        </div>
        <span>{currency.format(points.at(-1)?.amount ?? 0)}</span>
      </div>

      <svg viewBox="0 0 100 100" className="trend-chart" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#18d1b5" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#18d1b5" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polyline fill="none" stroke="url(#trendGradient)" strokeWidth="4" points={path} />
        <polyline fill="none" stroke="#f6f8ff" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.2" points="0,84 100,84" />
      </svg>

      <div className="chart-labels">
        {points.map((point) => (
          <span key={point.month}>{point.month}</span>
        ))}
      </div>
    </div>
  );
}

export function CategoryDonut({ items }: { items: CategoryBreakdown[] }) {
  const total = items.reduce((sum, item) => sum + item.total, 0);
  const palette = ["#18d1b5", "#ff8f3f", "#7cb3ff", "#ffd166", "#ff5f6d", "#7ef0a3"];

  if (!items.length || total === 0) {
    return <div className="empty-state">No category data yet.</div>;
  }

  let cursor = 0;
  const segments = items.map((item, index) => {
    const percent = (item.total / total) * 100;
    const color = palette[index % palette.length];
    const segment = `${color} ${cursor}% ${cursor + percent}%`;
    cursor += percent;
    return segment;
  });

  return (
    <div className="chart-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Category mix</p>
          <h3>Where the budget goes</h3>
        </div>
        <span>{currency.format(total)}</span>
      </div>

      <div className="donut-wrap">
        <div
          className="donut-chart"
          style={{ background: `conic-gradient(${segments.join(", ")})` }}
        >
          <div className="donut-center">
            <strong>{items.length}</strong>
            <span>active</span>
          </div>
        </div>

        <div className="legend">
          {items.map((item, index) => (
            <div key={item.category} className="legend-row">
              <div className="legend-label">
                <span
                  className="legend-swatch"
                  style={{ backgroundColor: palette[index % palette.length] }}
                />
                {item.category}
              </div>
              <strong>{currency.format(item.total)}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BudgetBars({ items }: { items: BudgetPerformance[] }) {
  if (!items.length) {
    return <div className="empty-state">No budgets configured yet.</div>;
  }

  return (
    <div className="chart-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Budget analytics</p>
          <h3>Utilization by category</h3>
        </div>
      </div>

      <div className="budget-list">
        {items.map((item) => (
          <div key={item.category} className="budget-row">
            <div className="budget-copy">
              <strong>{item.category}</strong>
              <span>
                {currency.format(item.spent)} of {currency.format(item.budget_limit)}
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(item.utilization_percent, 100)}%` }}
              />
            </div>
            <span className="budget-pill">{item.utilization_percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
