/**
 * Mock authentication utility
 * Uses localStorage to persist login state across pages.
 * Replace with real API calls when backend is ready.
 */

const AUTH_KEY = 'tradehub_auth';

export interface AuthUser {
  email: string;
  name: string;
}

/** Check if user is logged in */
export function isLoggedIn(): boolean {
  return localStorage.getItem(AUTH_KEY) !== null;
}

/** Get current user info (or null if not logged in) */
export function getUser(): AuthUser | null {
  const data = localStorage.getItem(AUTH_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as AuthUser;
  } catch {
    return null;
  }
}

/** Mock login — stores user in localStorage */
export function login(email: string): void {
  const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const user: AuthUser = { email, name };
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

/** Logout — clears auth state */
export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}
