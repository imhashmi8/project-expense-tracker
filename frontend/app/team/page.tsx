"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { TeamReportPanel } from "@/components/team-report";
import { api, ApiError } from "@/lib/api";
import { getStoredUser, getToken } from "@/lib/auth";
import type { TeamReportResponse, User } from "@/lib/types";

export default function TeamPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [report, setReport] = useState<TeamReportResponse | null>(null);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    async function load() {
      try {
        const [me, teamReport] = await Promise.all([api.me(), api.teamReport()]);
        setUser(me);
        setReport(teamReport);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Unable to load team report");
      }
    }

    void load();
  }, [router]);

  if (!user) {
    return null;
  }

  async function exportCsv() {
    try {
      setExporting(true);
      const csv = await api.downloadTeamReportCsv();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "team-report.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to export report");
    } finally {
      setExporting(false);
    }
  }

  return (
    <AppShell
      user={user}
      heading="Team reports"
      subheading="Manager and admin visibility into submissions, approvals, and category hotspots."
    >
      <div className="top-actions">
        <button className="primary-button" type="button" onClick={exportCsv}>
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>
      {error ? <div className="banner-error">{error}</div> : null}
      {report ? <TeamReportPanel report={report} /> : <div className="empty-state">Loading report...</div>}
    </AppShell>
  );
}
