"use client";

import type { TeamReportResponse } from "@/lib/types";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function TeamReportPanel({ report }: { report: TeamReportResponse }) {
  return (
    <div className="team-layout">
      <div className="table-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Team report</p>
            <h3>Submission performance</h3>
          </div>
          <span>{new Date(report.generated_at).toLocaleString()}</span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Submitted</th>
                <th>Approved</th>
                <th>Pending</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={row.user_id}>
                  <td>
                    <strong>{row.full_name}</strong>
                    <div className="subtle-row">{row.email}</div>
                  </td>
                  <td>{row.role}</td>
                  <td>{row.submitted_count}</td>
                  <td>{money.format(row.approved_total)}</td>
                  <td>{money.format(row.pending_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="table-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Highlights</p>
            <h3>Top spend categories</h3>
          </div>
        </div>
        <div className="highlight-list">
          {report.top_categories.map((item) => (
            <article key={item.category} className="highlight-item">
              <span>{item.category}</span>
              <strong>{money.format(item.total)}</strong>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
