/**
 * Welcome Page — Entry Point
 * Renders the onboarding wizard for first-time users.
 * Protected by authMiddleware (redirects to login if unauthenticated).
 */

import '../style.css'
import { initFlowbite } from 'flowbite'
import { startAlpine } from '../alpine'
import { authMiddleware } from '../utils/middleware'

// Onboarding components
import { WelcomePage, initWelcomePage } from '../components/onboarding/WelcomePage'

/* ── Auth Middleware ───────────────────────────────────── */

// Run auth middleware before rendering (checks token, skips onboarding redirect for this page)
await authMiddleware()

/* ── App Setup ───────────────────────────────────────── */

const appEl = document.querySelector<HTMLDivElement>('#app')!
appEl.innerHTML = WelcomePage()

/* ── Initialize Behaviors ─────────────────────────────── */

// Initialize Flowbite components (dropdowns, modals, etc.)
initFlowbite()

// Initialize welcome page interactivity
initWelcomePage()

// Start Alpine AFTER innerHTML is set so it can find all x-data directives in the DOM
startAlpine()
