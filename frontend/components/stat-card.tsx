"use client";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "light" | "accent";
}

export function StatCard({ label, value, hint, tone = "light" }: StatCardProps) {
  return (
    <article className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <p>{hint}</p> : null}
    </article>
  );
}
