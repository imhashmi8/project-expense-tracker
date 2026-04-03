"use client";

import type { Expense, Notification } from "@/lib/types";

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

export function ExpenseTable({ expenses }: { expenses: Expense[] }) {
  if (!expenses.length) {
    return <div className="empty-state">No expenses submitted yet.</div>;
  }

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
