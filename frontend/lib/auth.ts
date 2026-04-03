import type { AuthResponse, User } from "@/lib/types";

const TOKEN_KEY = "expenseflow.token";
const USER_KEY = "expenseflow.user";
const ORG_KEY = "expenseflow.organization";

export function saveSession(payload: AuthResponse) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(TOKEN_KEY, payload.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
  localStorage.setItem(ORG_KEY, JSON.stringify(payload.organization));
}

export function clearSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ORG_KEY);
}

export function getToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = localStorage.getItem(USER_KEY);
  return value ? (JSON.parse(value) as User) : null;
}
