"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren, useState } from "react";

import { api } from "@/lib/api";
import { clearSession } from "@/lib/auth";
import type { HealthResponse, User } from "@/lib/types";

interface AppShellProps extends PropsWithChildren {
  user: User;
  heading: string;
  subheading: string;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/team", label: "Team Reports" },
];

export function AppShell({ user, heading, subheading, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCheckingServices, setIsCheckingServices] = useState(false);
  const [showServicePanel, setShowServicePanel] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<HealthResponse | null>(null);
  const [serviceError, setServiceError] = useState("");

  async function handleCheckServices() {
    setIsCheckingServices(true);
    setServiceError("");
    setShowServicePanel(true);

    try {
      const health = await api.health();
      setServiceStatus(health);
    } catch {
      setServiceError("Unable to complete service checks.");
      setServiceStatus(null);
    } finally {
      setIsCheckingServices(false);
    }
  }

  const serviceRows = serviceStatus
    ? [
        { label: "DB connected", status: serviceStatus.checks.database },
        { label: "Redis connected", status: serviceStatus.checks.redis },
        { label: "Blob storage connected", status: serviceStatus.checks.blob_storage },
        { label: "Backend connected", status: serviceStatus.checks.backend },
      ]
    : [];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">EX</div>
          <div className="brand-copy">
            <p className="eyebrow">ExpenseFlow Command Center</p>
            <h1>Enterprise Spend Intelligence</h1>
            <p className="brand-subtle">Policy-aware approvals, analytics, and finance operations in one workspace.</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "nav-link active" : "nav-link"}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-user">
          <p>{user.full_name}</p>
          <span>
            {user.title} · {user.role}
          </span>
          <button
            className="ghost-button"
            onClick={() => {
              clearSession();
              router.push("/login");
            }}
          >
            Log out
          </button>
          <div className="credit-block">
            <span>Designed and developed by Md Qamar Hashmi</span>
            <a
              href="https://www.linkedin.com/in/md-qamar-hashmi/"
              target="_blank"
              rel="noreferrer"
              className="credit-link"
            >
              LinkedIn profile
            </a>
          </div>
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">{user.team_name}</p>
            <h2>{heading}</h2>
            <p className="subtle">{subheading}</p>
          </div>
          <div className="service-check-wrap">
            <button className="pill service-trigger" type="button" onClick={handleCheckServices} disabled={isCheckingServices}>
              <span className="pill-dot" />
              {isCheckingServices ? "Checking services..." : "Check services"}
            </button>
            {showServicePanel ? (
              <div className="service-panel">
                <div className="service-panel-header">
                  <strong>Platform connectivity</strong>
                  <button className="service-close" type="button" onClick={() => setShowServicePanel(false)}>
                    Close
                  </button>
                </div>

                {serviceError ? <p className="service-error">{serviceError}</p> : null}

                {serviceRows.length ? (
                  <div className="service-list">
                    {serviceRows.map((item) => (
                      <div className="service-row" key={item.label}>
                        <span>{item.label}</span>
                        <strong className={item.status === "connected" ? "service-ok" : "service-bad"}>
                          {item.status === "connected" ? "Yes" : "No"}
                        </strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="subtle">Run the check to see infrastructure connectivity.</p>
                )}
              </div>
            ) : null}
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
