/**
 * Login Page — Entry Point
 * Assembles AuthLayout with LoginPage content for the login flow.
 * Integrates real Frappe login with role-based redirect.
 */

import '../style.css'
import { initFlowbite } from 'flowbite'
import { startAlpine } from '../alpine'
import { t } from '../i18n'

// Auth components
import { AuthLayout, initAuthLayout, LoginPage, initLoginPage } from '../components/auth'

// Auth utilities for real login flow
import { login, getSessionUser, getRedirectUrl } from '../utils/auth'

/* ── App Setup ───────────────────────────────────────── */

const appEl = document.querySelector<HTMLDivElement>('#app')!
appEl.innerHTML = AuthLayout(LoginPage(), {
  title: t('auth.login.title'),
  showBackButton: true,
})

/* ── Initialize Behaviors ─────────────────────────────── */

// Initialize Flowbite components (dropdowns, modals, etc.)
initFlowbite()

// Initialize auth layout (back button handler)
initAuthLayout()

// Wire up real login form handler before initLoginPage so it takes priority
const loginForm = document.getElementById('login-form') as HTMLFormElement | null
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    e.stopImmediatePropagation()

    const emailInput = document.getElementById('email') as HTMLInputElement
    const passwordInput = document.getElementById('password') as HTMLInputElement
    const submitBtn = loginForm.querySelector('button[type="submit"]') as HTMLButtonElement

    const email = emailInput?.value?.trim()
    const password = passwordInput?.value

    if (!email || !password) return

    // Clear previous error
    const existingError = loginForm.querySelector('#login-error')
    if (existingError) existingError.remove()

    // Show loading state
    const originalBtnHtml = submitBtn?.innerHTML
    if (submitBtn) {
      submitBtn.disabled = true
      submitBtn.innerHTML = '<span>…</span>'
    }

    try {
      // Step 1: Authenticate via Frappe API
      await login(email, password)

      // Step 2: Fetch session user with roles
      const user = await getSessionUser()
      if (!user) {
        throw new Error('Login failed. Please try again.')
      }

      // Step 3: Role-based redirect (window.location.href handles cross-origin)
      const redirectUrl = getRedirectUrl(user)
      window.location.href = redirectUrl
    } catch (err) {
      // Show error feedback to user
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.'
      const errorDiv = document.createElement('div')
      errorDiv.id = 'login-error'
      errorDiv.className = 'p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded border border-red-200 dark:border-red-800'
      errorDiv.textContent = message
      loginForm.insertBefore(errorDiv, loginForm.firstChild)

      // Restore button state
      if (submitBtn) {
        submitBtn.disabled = false
        submitBtn.innerHTML = originalBtnHtml || `<span>${t('auth.login.continue')}</span>`
      }
    }
  })
}

// Initialize login page interactivity (social buttons, links)
initLoginPage()

// Start Alpine AFTER innerHTML is set so it can find all x-data directives in the DOM
startAlpine()
