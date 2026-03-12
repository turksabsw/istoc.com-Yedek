/**
 * Authentication utility — Real Frappe API integration
 * Replaces mock localStorage auth with session-based Frappe auth.
 *
 * Provides both async API (getSessionUser) for fresh server checks
 * and sync accessors (getUser, isLoggedIn) for template rendering.
 */

export const FRAPPE_BASE = import.meta.env.VITE_FRAPPE_BASE ?? '';

export interface AuthUser {
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  username: string;
  user_image: string | null;
  is_sso_user: boolean;
  roles: string[];
  tenant: string | null;
  is_admin: boolean;
  is_seller: boolean;
  is_buyer: boolean;
  has_seller_profile: boolean;
  pending_seller_application: boolean;
  seller_profile: {
    name: string;
    business_name: string;
    seller_type: string;
    status: string;
  } | null;
}

/** Backward-compatible user shape for sync consumers (includes .name alias) */
export interface AuthUserCompat extends AuthUser {
  name: string;
}

/** Cached session user — populated by getSessionUser(), read by sync helpers */
let _cachedUser: AuthUser | null = null;

/** Frappe API fetch wrapper with credentials and CSRF */
async function frappeCall(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${FRAPPE_BASE}${path}`;
  return fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Frappe-CSRF-Token': 'fetch',
      ...(options.headers as Record<string, string> || {}),
    },
    ...options,
  });
}

/** Login via Frappe — sets session cookie */
export async function login(email: string, password: string): Promise<void> {
  const res = await frappeCall('/api/method/login', {
    method: 'POST',
    body: JSON.stringify({ usr: email, pwd: password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Login failed');
  }
}

/** Fetch current session user from enhanced get_session_user endpoint */
export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const res = await frappeCall('/api/method/tr_tradehub.api.v1.auth.get_session_user');
    if (!res.ok) {
      _cachedUser = null;
      return null;
    }
    const data = await res.json();
    const result = data.message;
    if (!result?.success || !result?.logged_in) {
      _cachedUser = null;
      return null;
    }
    _cachedUser = result.user as AuthUser;
    return _cachedUser;
  } catch {
    _cachedUser = null;
    return null;
  }
}

/** Get role-based redirect URL after login */
export function getRedirectUrl(user: AuthUser): string {
  if (user.is_admin) {
    return `${FRAPPE_BASE}/app/tradehub`;
  }
  if (user.is_seller && user.has_seller_profile) {
    return import.meta.env.VITE_SELLER_PANEL_URL ?? 'http://localhost:8082/';
  }
  if (user.pending_seller_application) {
    return '/pages/seller/application-pending.html';
  }
  return '/';
}

/** Sync: Check if user is logged in (based on cached session data) */
export function isLoggedIn(): boolean {
  return _cachedUser !== null;
}

/** Sync: Get cached user info with backward-compatible .name property */
export function getUser(): AuthUserCompat | null {
  if (!_cachedUser) return null;
  return { ..._cachedUser, name: _cachedUser.full_name };
}

/** Logout — call Frappe logout endpoint and clear cache */
export async function logout(): Promise<void> {
  _cachedUser = null;
  await frappeCall('/api/method/logout', { method: 'POST' });
}

/** Register a new user via register_user endpoint */
export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  accountType: string,
  phone: string,
  country: string,
  acceptTerms: boolean,
  acceptKvkk: boolean,
): Promise<{ success: boolean; account_type: string; seller_application?: unknown }> {
  const res = await frappeCall('/api/method/tr_tradehub.api.v1.identity.register_user', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      account_type: accountType,
      phone,
      country,
      accept_terms: acceptTerms,
      accept_kvkk: acceptKvkk,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as Record<string, unknown>;
    let message = 'Registration failed';
    if (data._server_messages) {
      try {
        const msgs = JSON.parse(data._server_messages as string) as string[];
        const first = JSON.parse(msgs[0]) as { message?: string };
        if (first.message) message = first.message;
      } catch { /* fallback to generic message */ }
    } else if (typeof data.message === 'string') {
      message = data.message;
    }
    throw new Error(message);
  }

  const data = await res.json();
  return data.message;
}
