/**
 * Auth middleware.
 *
 * Runs on protected page load. Responsibilities:
 * 1. Skips auth checks for PUBLIC_PATHS (login, register, etc.)
 * 2. Checks token presence — redirects to login with return URL if missing
 * 3. Refreshes token if it expires within 5 minutes via refresh_token endpoint
 * 4. Redirects to welcome page if user has not completed onboarding
 * 5. Listens for storage events for cross-tab logout detection
 */

import { getTokens, setTokens, getUser, clearAuth } from './auth'
import type { AuthTokens } from './auth'
import { apiPost } from './api'
import { getBaseUrl } from './url'

/** Paths that do not require authentication */
const PUBLIC_PATHS = [
  'pages/auth/login.html',
  'pages/auth/register.html',
  'pages/auth/forgot-password.html',
  'pages/auth/verify.html',
]

/** Paths that should skip the onboarding redirect */
const SKIP_ONBOARDING_PATHS = [
  'pages/welcome.html',
]

/** Time threshold for proactive token refresh (5 minutes in ms) */
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000

/** Flag to prevent concurrent token refresh calls */
let refreshInProgress = false

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Check if the current page path ends with any entry in the given list.
 */
function isPathMatch(paths: string[]): boolean {
  const currentPath = window.location.pathname
  return paths.some(p => currentPath.endsWith(p))
}

/**
 * Refresh auth token if it expires within REFRESH_THRESHOLD_MS.
 * A flag prevents race conditions when multiple callers trigger refresh
 * concurrently (e.g. multiple Alpine components mounting at once).
 */
async function refreshAuthToken(tokens: AuthTokens): Promise<void> {
  const timeUntilExpiry = tokens.expires_at - Date.now()
  if (timeUntilExpiry > REFRESH_THRESHOLD_MS) return
  if (refreshInProgress) return

  refreshInProgress = true
  try {
    const result = await apiPost<{
      api_key?: string
      api_secret?: string
      expires_in?: number
    }>('tr_tradehub.api.v1.auth.refresh_token', {})

    // Only update tokens if the response contains valid token data.
    // The refresh_token endpoint may return a different format for SSO
    // users (without api_key/api_secret), in which case we preserve
    // the existing tokens and just extend their client-side expiry.
    if (result.api_key && result.api_secret && result.expires_in) {
      setTokens({
        api_key: result.api_key,
        api_secret: result.api_secret,
        expires_in: result.expires_in,
      })
    } else if (result.expires_in) {
      // Extend existing token expiry without replacing credentials
      setTokens({
        api_key: tokens.api_key,
        api_secret: tokens.api_secret,
        expires_in: result.expires_in,
      })
    }
  } catch {
    // Refresh failed — token may still be valid until actual expiry.
    // The next page load will retry. Don't clear auth here.
  } finally {
    refreshInProgress = false
  }
}

/**
 * Redirect to login page, preserving the current URL as a return parameter.
 */
function redirectToLogin(): void {
  const returnUrl = encodeURIComponent(window.location.href)
  window.location.href = `${getBaseUrl()}pages/auth/login.html?return=${returnUrl}`
}

/**
 * Redirect to the welcome / onboarding page.
 */
function redirectToWelcome(): void {
  window.location.href = `${getBaseUrl()}pages/welcome.html`
}

/**
 * Listen for `storage` events fired by other tabs.
 * When tokens are removed elsewhere (logout), mirror that here immediately.
 */
function initCrossTabLogoutListener(): void {
  window.addEventListener('storage', (event: StorageEvent) => {
    if (event.key === 'tradehub_tokens' && event.newValue === null) {
      clearAuth()
      redirectToLogin()
    }
  })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Main auth middleware — call once on page load.
 *
 * Public pages are skipped automatically. For protected pages the function
 * checks token presence, proactively refreshes near-expiry tokens, and
 * redirects users who haven't completed onboarding to the welcome page.
 *
 * Also registers a cross-tab logout listener so logging out in one tab
 * is reflected in all other open tabs.
 */
export async function authMiddleware(): Promise<void> {
  // 1. Public pages need no auth checks
  if (isPathMatch(PUBLIC_PATHS)) return

  // 2. Cross-tab logout detection (register once per page load)
  initCrossTabLogoutListener()

  // 3. Token presence check
  const tokens = getTokens()
  if (!tokens) {
    redirectToLogin()
    return
  }

  // 4. Proactive token refresh when close to expiry
  await refreshAuthToken(tokens)

  // 5. Onboarding gate (skip for welcome page itself)
  if (!isPathMatch(SKIP_ONBOARDING_PATHS)) {
    const user = getUser()
    if (user && !user.has_completed_onboarding) {
      redirectToWelcome()
      return
    }
  }
}
