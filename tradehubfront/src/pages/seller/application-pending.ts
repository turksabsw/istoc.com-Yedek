/**
 * Seller Application Pending — Entry Point
 * Status page informing the user that their seller application is under review.
 * Shows 'awaiting approval' message with link back to storefront.
 * Protected by auth guard.
 */

import '../../style.css'
import { initFlowbite } from 'flowbite'
import { t } from '../../i18n'
import { requireAuth } from '../../utils/auth-guard'
import { getSessionUser, type AuthUser } from '../../utils/auth'

/* ── Auth Guard ───────────────────────────────────────── */

async function init(): Promise<void> {
  const authorized = await requireAuth()
  if (!authorized) return

  const user = await getSessionUser()

  renderPage(user)

  // Initialize Flowbite components
  initFlowbite()
}

/* ── Page Render ──────────────────────────────────────── */

function renderPage(user: AuthUser | null): void {
  const appEl = document.querySelector<HTMLDivElement>('#app')!

  appEl.innerHTML = `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/" class="flex items-center gap-2">
            <img src="/images/istoc-logo.png" alt="iSTOC" class="h-8 w-auto" />
            <span class="text-lg font-bold text-gray-900 dark:text-white">TradeHub</span>
          </a>
          ${user ? `
            <span class="text-sm text-gray-500 dark:text-gray-400">${user.email}</span>
          ` : ''}
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div class="max-w-lg w-full text-center">
          <!-- Status Icon -->
          <div class="mx-auto w-20 h-20 mb-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <svg class="w-10 h-10 text-orange-500 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>

          <!-- Title -->
          <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ${t('sellerApplication.pendingTitle')}
          </h1>

          <!-- Subtitle -->
          <p class="text-lg text-orange-600 dark:text-orange-400 font-medium mb-4">
            ${t('sellerApplication.pendingSubtitle')}
          </p>

          <!-- Message -->
          <p class="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            ${t('sellerApplication.pendingMessage')}
          </p>

          <!-- Status Badge -->
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-full mb-6">
            <span class="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            <span class="text-sm font-medium text-orange-700 dark:text-orange-300">
              ${t('sellerApplication.pendingStatusLabel')}: ${t('sellerApplication.pendingStatusValue')}
            </span>
          </div>

          <!-- Timeline Info -->
          <p class="text-sm text-gray-500 dark:text-gray-500 mb-8">
            ${t('sellerApplication.pendingTimeline')}
          </p>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/"
              class="inline-flex items-center justify-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-orange-500/20 focus:outline-none">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              ${t('sellerApplication.pendingBackToStore')}
            </a>
            <button id="check-status-btn"
              class="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:ring-2 focus:ring-gray-200/50 focus:outline-none">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              ${t('sellerApplication.pendingCheckStatus')}
            </button>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            &copy; ${new Date().getFullYear()} iSTOC TradeHub. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  `

  // Wire up check status button
  initCheckStatus()
}

/* ── Check Status Handler ─────────────────────────────── */

function initCheckStatus(): void {
  const btn = document.getElementById('check-status-btn')
  if (!btn) return

  btn.addEventListener('click', async () => {
    btn.setAttribute('disabled', 'true')
    btn.classList.add('opacity-50', 'cursor-not-allowed')

    const user = await getSessionUser()

    btn.removeAttribute('disabled')
    btn.classList.remove('opacity-50', 'cursor-not-allowed')

    if (!user) {
      window.location.href = '/pages/auth/login.html'
      return
    }

    // If seller role has been granted (application approved), redirect to seller dashboard
    if (user.is_seller && user.has_seller_profile) {
      window.location.href = 'http://localhost:5174/'
      return
    }

    // If no pending application (rejected or withdrawn), redirect to storefront
    if (!user.pending_seller_application) {
      window.location.href = '/'
      return
    }

    // Still pending — show brief feedback
    const statusBadge = document.querySelector('.animate-pulse')?.parentElement
    if (statusBadge) {
      statusBadge.classList.add('ring-2', 'ring-orange-300')
      setTimeout(() => {
        statusBadge.classList.remove('ring-2', 'ring-orange-300')
      }, 1500)
    }
  })
}

/* ── Bootstrap ────────────────────────────────────────── */

init()
