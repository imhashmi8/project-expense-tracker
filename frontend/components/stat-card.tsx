"use client";

interface StatCardProps {
  label: string;
  value: string;
  tone?: "light" | "accent";
}

export function StatCard({ label, value, tone = "light" }: StatCardProps) {
  return (
    <article className={`stat-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
