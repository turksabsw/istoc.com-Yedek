import { getBaseUrl } from './url'

export function requireAuth() {
  const token = localStorage.getItem('tradehub_auth')
  if (!token) {
    window.location.href = `${getBaseUrl()}pages/auth/login.html`
  }
}
