import { getBaseUrl } from './url'
import { getSessionUser, FRAPPE_BASE } from './auth'

/** Require authenticated user — redirect to login if not */
export async function requireAuth(): Promise<boolean> {
  const user = await getSessionUser()
  if (!user) {
    window.location.href = `${getBaseUrl()}pages/auth/login.html`
    return false
  }
  return true
}

/** Require seller role — redirect based on status */
export async function requireSeller(): Promise<boolean> {
  const user = await getSessionUser()
  if (!user) {
    window.location.href = `${getBaseUrl()}pages/auth/login.html`
    return false
  }
  if (user.pending_seller_application) {
    window.location.href = `${getBaseUrl()}pages/seller/application-pending.html`
    return false
  }
  if (!user.is_seller) {
    window.location.href = getBaseUrl()
    return false
  }
  return true
}

/** Block admin users — redirect to Frappe panel */
export async function blockAdmin(): Promise<boolean> {
  const user = await getSessionUser()
  if (user?.is_admin) {
    window.location.href = `${FRAPPE_BASE}/app/tradehub`
    return false
  }
  return true
}
