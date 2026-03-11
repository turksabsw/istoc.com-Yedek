/**
 * Authentication utility — Real Frappe API integration
 * Replaces mock localStorage auth with session-based Frappe auth.
 */

const FRAPPE_BASE = 'http://marketplace.local:8000';

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
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.message;
    if (!result?.success || !result?.logged_in) return null;
    return result.user as AuthUser;
  } catch {
    return null;
  }
}

/** Get role-based redirect URL after login */
export function getRedirectUrl(user: AuthUser): string {
  if (user.is_admin) {
    return `${FRAPPE_BASE}/app/tradehub`;
  }
  if (user.is_seller && user.has_seller_profile) {
    return 'http://localhost:5174/';
  }
  if (user.pending_seller_application) {
    return '/pages/seller/application-pending.html';
  }
  return '/';
}

/** Check if user is logged in by querying session */
export async function isLoggedIn(): Promise<boolean> {
  const user = await getSessionUser();
  return user !== null;
}

/** Logout — call Frappe logout endpoint */
export async function logout(): Promise<void> {
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
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Registration failed');
  }

  const data = await res.json();
  return data.message;
}
