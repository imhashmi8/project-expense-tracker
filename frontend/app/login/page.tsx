"use client";

import type { FormEvent } from "react";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import { api, ApiError } from "@/lib/api";
import { saveSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@northstar.dev");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    try {
      const payload = await api.login(email, password);
      saveSession(payload);
      startTransition(() => {
        router.push("/dashboard");
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to sign in");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <main className="centered-page">
      <section className="auth-card">
        <div className="auth-copy">
          <p className="eyebrow">ExpenseFlow login</p>
          <h1>Enter the finance command center.</h1>
          <p className="subtle">
            Use the seeded demo accounts to explore role-based access, analytics, and reporting.
          </p>
          <div className="demo-creds">
            <span>`admin@northstar.dev / Admin@123`</span>
            <span>`manager@northstar.dev / Manager@123`</span>
            <span>`employee@northstar.dev / Employee@123`</span>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="primary-button" disabled={isPending} type="submit">
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
