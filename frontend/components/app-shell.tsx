"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PropsWithChildren } from "react";

import { clearSession } from "@/lib/auth";
import type { User } from "@/lib/types";

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

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">EF</div>
          <div>
            <p className="eyebrow">ExpenseFlow SaaS</p>
            <h1>Control spend with style</h1>
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
          <div className="pill">
            <span className="pill-dot" />
            Tracker Expense App
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
