import { getBaseUrl } from './url'

const BASE_URL = import.meta.env.VITE_API_URL || ''

export async function api<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('tradehub_auth')

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  if (res.status === 401) {
    localStorage.removeItem('tradehub_auth')
    window.location.href = `${getBaseUrl()}pages/auth/login.html`
    throw new Error('Unauthorized')
  }

  if (!res.ok) throw new Error(await res.text())

  return res.json()
}
