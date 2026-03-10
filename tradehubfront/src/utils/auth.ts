/**
 * Authentication utility
 * Manages auth tokens and user profile in localStorage.
 * Tokens use Frappe's api_key:api_secret format with expiry tracking.
 */

const TOKEN_KEY = 'tradehub_tokens';
const USER_KEY = 'tradehub_user';

/** Frappe API token pair with expiry tracking */
export interface AuthTokens {
  api_key: string;
  api_secret: string;
  /** Token lifetime in seconds (as returned by the server) */
  expires_in: number;
  /** Absolute expiry timestamp in milliseconds (Date.now()-based) */
  expires_at: number;
}

/** Authenticated user profile */
export interface AuthUser {
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  roles: string[];
  user_type: string;
  is_verified: boolean;
  has_completed_onboarding: boolean;
}

/** Get stored tokens, or null if missing/expired */
export function getTokens(): AuthTokens | null {
  const data = localStorage.getItem(TOKEN_KEY);
  if (!data) return null;
  try {
    const tokens = JSON.parse(data) as AuthTokens;
    if (Date.now() > tokens.expires_at) {
      clearAuth();
      return null;
    }
    return tokens;
  } catch {
    clearAuth();
    return null;
  }
}

/** Store tokens with calculated expiry timestamp */
export function setTokens(tokens: Omit<AuthTokens, 'expires_at'> & { expires_at?: number }): void {
  const stored: AuthTokens = {
    api_key: tokens.api_key,
    api_secret: tokens.api_secret,
    expires_in: tokens.expires_in,
    expires_at: tokens.expires_at ?? Date.now() + tokens.expires_in * 1000,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(stored));
}

/** Get stored user profile (or null if not stored) */
export function getUser(): AuthUser | null {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as AuthUser;
  } catch {
    return null;
  }
}

/** Store user profile */
export function setUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** Check if user is logged in (has non-expired tokens) */
export function isLoggedIn(): boolean {
  return getTokens() !== null;
}

/** Clear all auth state (tokens + user profile) */
export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** @deprecated Use clearAuth() instead */
export function logout(): void {
  clearAuth();
}
