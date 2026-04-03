import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing-page">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Expense Tacker Project</p>
          <h1>ExpenseFlow is a modern three-tier SaaS app for expense approvals, analytics, and team reporting.</h1>
          <p className="subtle">
            Built to help you learn boards, CI/CD, secure deployments, and full-stack interview storytelling with a realistic React + FastAPI + PostgreSQL architecture.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href="/login">
              Launch app
            </Link>
            <Link className="ghost-button" href="/dashboard">
              Preview dashboard
            </Link>
          </div>
          <div className="hero-credit">
            <span>Designed and developed by Md Qamar Hashmi</span>
            <a href="https://www.linkedin.com/in/md-qamar-hashmi/" target="_blank" rel="noreferrer">
              Connect on LinkedIn
            </a>
          </div>
        </div>

        <div className="hero-metrics">
          <article>
            <span>Tier 1</span>
            <strong>Next.js frontend</strong>
          </article>
          <article>
            <span>Tier 2</span>
            <strong>FastAPI backend</strong>
          </article>
          <article>
            <span>Tier 3</span>
            <strong>PostgreSQL + Redis + Blob</strong>
          </article>
        </div>
      </section>
    </main>
  );
}
