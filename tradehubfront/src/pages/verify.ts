/**
 * Verify Page — Entry Point
 * Assembles AuthLayout with VerifyPage content for email OTP verification.
 */

import '../style.css'
import { initFlowbite } from 'flowbite'
import { startAlpine } from '../alpine'
import { t } from '../i18n'

// Auth components
import { AuthLayout, initAuthLayout } from '../components/auth'
import { VerifyPage, initVerifyPage } from '../components/auth/VerifyPage'

/* ── App Setup ───────────────────────────────────────── */

const appEl = document.querySelector<HTMLDivElement>('#app')!
appEl.innerHTML = AuthLayout(VerifyPage(), {
  title: t('auth.verifyEmail'),
  showBackButton: true,
})

/* ── Initialize Behaviors ─────────────────────────────── */

// Initialize Flowbite components (dropdowns, modals, etc.)
initFlowbite()

// Initialize auth layout (back button handler)
initAuthLayout()

// Initialize verify page interactivity (OTP verification, resend, navigation)
initVerifyPage()

// Start Alpine AFTER innerHTML is set so it can find all x-data directives in the DOM
startAlpine()
