import { getTokens } from './auth'
import { getBaseUrl } from './url'

/**
 * Require authentication to access the current page.
 * Redirects to login with a return URL parameter if no valid tokens exist.
 */
export function requireAuth() {
  const tokens = getTokens()
  if (!tokens) {
    const returnUrl = encodeURIComponent(window.location.href)
    window.location.href = `${getBaseUrl()}pages/auth/login.html?return=${returnUrl}`
  }
}
