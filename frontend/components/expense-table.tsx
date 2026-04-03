"use client";

import type { Expense, Notification, Role } from "@/lib/types";

type ReviewAction = "approved" | "rejected";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

interface ExpenseTableProps {
  expenses: Expense[];
  viewerRole: Role;
  activeReviewId?: number | null;
  onReview?: (expenseId: number, status: ReviewAction) => void;
}

export function ExpenseTable({
  expenses,
  viewerRole,
  activeReviewId = null,
  onReview,
}: ExpenseTableProps) {
  if (!expenses.length) {
    return <div className="empty-state">No expenses submitted yet.</div>;
  }

  const canReview = viewerRole === "admin" || viewerRole === "manager";

  return (
    <div className="table-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Recent activity</p>
          <h3>Latest expenses</h3>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Owner</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Status</th>
              {canReview ? <th>Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td>{expense.title}</td>
                <td>{expense.owner.full_name}</td>
                <td>{expense.category}</td>
                <td>{money.format(expense.amount)}</td>
                <td>
                  <span className={`status-chip ${expense.status}`}>{expense.status}</span>
                </td>
                {canReview ? (
                  <td>
                    {expense.status === "pending" ? (
                      <div className="table-actions">
                        <button
                          className="table-action approve"
                          disabled={activeReviewId === expense.id}
                          onClick={() => onReview?.(expense.id, "approved")}
                          type="button"
                        >
                          {activeReviewId === expense.id ? "Saving..." : "Approve"}
                        </button>
                        <button
                          className="table-action reject"
                          disabled={activeReviewId === expense.id}
                          onClick={() => onReview?.(expense.id, "rejected")}
                          type="button"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="subtle-row">Reviewed</span>
                    )}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function NotificationList({ items }: { items: Notification[] }) {
  if (!items.length) {
    return <div className="empty-state">No notifications yet.</div>;
  }

  return (
    <div className="table-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Workflow alerts</p>
          <h3>Async notifications</h3>
        </div>
      </div>

      <div className="notification-list">
        {items.map((item) => (
          <article className="notification-item" key={item.id}>
            <strong>{item.type.replaceAll("_", " ")}</strong>
            <p>{item.message}</p>
            <span>{new Date(item.created_at).toLocaleString()}</span>
          </article>
        ))}
      </div>
    </div>
  );
}
