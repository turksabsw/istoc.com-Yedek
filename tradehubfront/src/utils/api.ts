/**
 * Frappe-compatible API client.
 *
 * All requests use `credentials: 'include'` so Frappe's session cookie (sid)
 * is sent automatically. When API tokens are present in localStorage they are
 * sent via the `Authorization: token api_key:api_secret` header (lowercase
 * `token` — Frappe's native format). POST requests include the CSRF token
 * read from the `csrf_token` cookie as `X-Frappe-CSRF-Token`.
 *
 * Frappe wraps every successful response in `{ message: T }`. The helpers
 * here unwrap that automatically so callers receive `T` directly.
 *
 * A 403 response is treated as session expiry: auth state is cleared and the
 * user is redirected to the login page.
 */

import { getTokens, clearAuth } from './auth'
import { getBaseUrl } from './url'

const BASE_URL = import.meta.env.VITE_API_URL || ''

/** Frappe standard response envelope */
export interface FrappeResponse<T> {
  message: T
}

/**
 * Custom error class for Frappe API errors.
 * Preserves the `title` field from `_server_messages` so callers can
 * distinguish error types (e.g. title="email_not_verified") without
 * parsing the human-readable message text.
 */
export class FrappeError extends Error {
  title?: string
  constructor(message: string, title?: string) {
    super(message)
    this.name = 'FrappeError'
    this.title = title
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Read the CSRF token that Frappe sets as a cookie (`csrf_token`). */
function getCsrfToken(): string {
  const match = document.cookie
    .split(';')
    .find(c => c.trim().startsWith('csrf_token='))
  return match ? match.split('=')[1]!.trim() : ''
}

/** Build common headers shared by every request. */
function buildHeaders(includeCsrf: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  const tokens = getTokens()
  if (tokens) {
    headers['Authorization'] = `token ${tokens.api_key}:${tokens.api_secret}`
  }

  if (includeCsrf) {
    const csrf = getCsrfToken()
    if (csrf) {
      headers['X-Frappe-CSRF-Token'] = csrf
    }
  }

  return headers
}

/** Handle non-OK responses. 403 → session expiry. */
async function handleError(res: Response): Promise<never> {
  if (res.status === 403) {
    clearAuth()
    window.location.href = `${getBaseUrl()}pages/auth/login.html`
    throw new FrappeError('Session expired')
  }

  let detail: string
  let errorTitle: string | undefined
  try {
    const body = await res.json() as { exc_type?: string; _server_messages?: string }
    // Frappe sometimes returns structured error info
    if (body._server_messages) {
      const msgs = JSON.parse(body._server_messages) as string[]
      detail = msgs.map(m => {
        try {
          const parsed = JSON.parse(m) as { message: string; title?: string }
          // Capture the title from the first message that has one
          if (parsed.title && !errorTitle) errorTitle = parsed.title
          return parsed.message
        } catch { return m }
      }).join('; ')
    } else {
      detail = body.exc_type ?? res.statusText
    }
  } catch {
    detail = await res.text().catch(() => res.statusText)
  }

  throw new FrappeError(detail, errorTitle)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Perform a GET request against a Frappe whitelisted method.
 *
 * @param method  Dotted method path, e.g. `tr_tradehub.api.v1.auth.get_sso_status`
 * @param params  Optional query-string parameters
 * @returns       Unwrapped `message` value from the Frappe response
 */
export async function apiGet<T>(
  method: string,
  params?: Record<string, string>,
): Promise<T> {
  let url = `${BASE_URL}/api/method/${method}`

  if (params) {
    const qs = new URLSearchParams(params).toString()
    if (qs) url += `?${qs}`
  }

  const res = await fetch(url, {
    method: 'GET',
    headers: buildHeaders(false),
    credentials: 'include',
  })

  if (!res.ok) return handleError(res)

  const data = (await res.json()) as FrappeResponse<T>
  return data.message
}

/**
 * Perform a POST request against a Frappe whitelisted method.
 *
 * @param method  Dotted method path, e.g. `tr_tradehub.api.v1.auth.login`
 * @param body    JSON-serialisable request body
 * @returns       Unwrapped `message` value from the Frappe response
 */
export async function apiPost<T>(
  method: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const url = `${BASE_URL}/api/method/${method}`

  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(true),
    credentials: 'include',
    body: JSON.stringify(body),
  })

  if (!res.ok) return handleError(res)

  const data = (await res.json()) as FrappeResponse<T>
  return data.message
}
