/**
 * WelcomePage Component
 * Role-specific onboarding wizard shown to first-time users.
 *
 * Buyer steps:  welcome -> search -> rfq -> messaging -> done
 * Supplier steps: welcome -> profile -> products -> quotes -> done
 *
 * Features:
 * - Progress bar tracking current step
 * - Next / Skip / Complete buttons
 * - On complete: calls apiPost('tr_tradehub.api.v1.auth.complete_onboarding'),
 *   updates user.has_completed_onboarding in localStorage, redirects to dashboard
 */

import Alpine from 'alpinejs'
import { getUser, setUser } from '../../utils/auth'
import type { AuthUser } from '../../utils/auth'
import { apiPost } from '../../utils/api'
import { showToast } from '../../utils/toast'
import { getBaseUrl } from '../auth/AuthLayout'
import { t } from '../../i18n'

/* ── Types ──────────────────────────────────────────── */

type UserType = 'buyer' | 'supplier'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: string
}

/* ── Step Definitions ───────────────────────────────── */

function getBuyerSteps(): OnboardingStep[] {
  return [
    {
      id: 'welcome',
      title: t('onboarding.buyer.welcome.title', { defaultValue: 'Welcome to TradeHub!' }),
      description: t('onboarding.buyer.welcome.description', { defaultValue: 'Your B2B sourcing journey starts here. Let us show you around in a few quick steps.' }),
      icon: `<svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
      </svg>`,
    },
    {
      id: 'search',
      title: t('onboarding.buyer.search.title', { defaultValue: 'Search Products' }),
      description: t('onboarding.buyer.search.description', { defaultValue: 'Browse millions of products from verified suppliers. Use filters to find exactly what you need.' }),
      icon: `<svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
      </svg>`,
    },
    {
      id: 'rfq',
      title: t('onboarding.buyer.rfq.title', { defaultValue: 'Submit Requests for Quotation' }),
      description: t('onboarding.buyer.rfq.description', { defaultValue: 'Need custom pricing? Submit an RFQ and let suppliers compete to offer you the best deal.' }),
      icon: `<svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>`,
    },
    {
      id: 'messaging',
      title: t('onboarding.buyer.messaging.title', { defaultValue: 'Message Suppliers' }),
      description: t('onboarding.buyer.messaging.description', { defaultValue: 'Chat directly with suppliers to discuss details, negotiate terms, and build relationships.' }),
      icon: `<svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>`,
    },
    {
      id: 'done',
      title: t('onboarding.buyer.done.title', { defaultValue: 'You\'re All Set!' }),
      description: t('onboarding.buyer.done.description', { defaultValue: 'Your account is ready. Start exploring products and connect with trusted suppliers worldwide.' }),
      icon: `<svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>`,
    },
  ]
}

function getSupplierSteps(): OnboardingStep[] {
  return [
    {
      id: 'welcome',
      title: t('onboarding.supplier.welcome.title', { defaultValue: 'Welcome to TradeHub!' }),
      description: t('onboarding.supplier.welcome.description', { defaultValue: 'Grow your business by reaching buyers worldwide. Let us walk you through the key features.' }),
      icon: `<svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
      </svg>`,
    },
    {
      id: 'profile',
      title: t('onboarding.supplier.profile.title', { defaultValue: 'Complete Your Profile' }),
      description: t('onboarding.supplier.profile.description', { defaultValue: 'Add your company information, logo, and description to build trust with potential buyers.' }),
      icon: `<svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>`,
    },
    {
      id: 'products',
      title: t('onboarding.supplier.products.title', { defaultValue: 'List Your Products' }),
      description: t('onboarding.supplier.products.description', { defaultValue: 'Upload your product catalog with images, pricing, and specifications to attract buyers.' }),
      icon: `<svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>`,
    },
    {
      id: 'quotes',
      title: t('onboarding.supplier.quotes.title', { defaultValue: 'Respond to Quotes' }),
      description: t('onboarding.supplier.quotes.description', { defaultValue: 'Receive quote requests from interested buyers and respond with competitive offers to win deals.' }),
      icon: `<svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>`,
    },
    {
      id: 'done',
      title: t('onboarding.supplier.done.title', { defaultValue: 'You\'re All Set!' }),
      description: t('onboarding.supplier.done.description', { defaultValue: 'Your supplier account is ready. Start listing products and connecting with buyers today.' }),
      icon: `<svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>`,
    },
  ]
}

function getStepsForUserType(userType: UserType): OnboardingStep[] {
  return userType === 'supplier' ? getSupplierSteps() : getBuyerSteps()
}

/* ── Component HTML ─────────────────────────────────── */

/**
 * Renders the welcome/onboarding page HTML.
 * Uses Alpine.js x-data="welcomePage" for reactive state management.
 */
export function WelcomePage(): string {
  const user = getUser()
  const userType = (user?.user_type === 'supplier' ? 'supplier' : 'buyer') as UserType
  const steps = getStepsForUserType(userType)
  const firstName = user?.first_name || ''

  const skipAllLabel = t('onboarding.skipAll', { defaultValue: 'Skip all' })
  const stepOfLabel = t('onboarding.stepOf', { defaultValue: 'Step' })
  const backLabel = t('onboarding.back', { defaultValue: 'Back' })
  const nextLabel = t('onboarding.next', { defaultValue: 'Next' })
  const getStartedLabel = t('onboarding.getStarted', { defaultValue: 'Get Started' })

  return `
    <div id="welcome-page"
         x-data="welcomePage"
         data-user-type="${userType}"
         data-first-name="${escapeAttr(firstName)}"
         class="min-h-screen bg-gray-50 dark:bg-gray-900">

      <!-- Header -->
      <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img src="${getBaseUrl()}images/istoc-logo.png" alt="iSTOC" class="h-8" />
            <span class="text-sm font-medium text-gray-500 dark:text-gray-400">TradeHub</span>
          </div>
          <button
            type="button"
            @click="skipOnboarding()"
            :disabled="completing"
            class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ${skipAllLabel}
          </button>
        </div>
      </header>

      <!-- Progress Bar -->
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-3">
          <div class="flex items-center gap-2">
            ${steps.map((_step, i) => `
              <div class="flex-1 h-1.5 rounded-full transition-all duration-300"
                   :class="currentStepIndex >= ${i}
                     ? 'bg-primary-500'
                     : 'bg-gray-200 dark:bg-gray-700'">
              </div>
            `).join('')}
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2"
             x-text="'${stepOfLabel}' + ' ' + (currentStepIndex + 1) + ' / ' + totalSteps">
          </p>
        </div>
      </div>

      <!-- Step Content -->
      <main class="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">

          <!-- Step Icon -->
          <div class="flex justify-center mb-6">
            <div class="w-20 h-20 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-500 flex items-center justify-center">
              ${steps.map((step, i) => `
                <template x-if="currentStepIndex === ${i}">
                  <div>${step.icon}</div>
                </template>
              `).join('')}
            </div>
          </div>

          <!-- Step Title & Description -->
          ${steps.map((step, i) => `
            <template x-if="currentStepIndex === ${i}">
              <div>
                <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  ${step.title}
                </h1>
                <p class="text-gray-500 dark:text-gray-400 text-base sm:text-lg leading-relaxed max-w-lg mx-auto">
                  ${step.description}
                </p>
              </div>
            </template>
          `).join('')}

          <!-- Action Buttons -->
          <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <!-- Back button (hidden on first step) -->
            <button
              type="button"
              x-show="currentStepIndex > 0"
              @click="prevStep()"
              :disabled="completing"
              class="order-2 sm:order-1 w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ${backLabel}
            </button>

            <!-- Next / Complete button -->
            <button
              type="button"
              @click="isLastStep ? completeOnboarding() : nextStep()"
              :disabled="completing"
              class="order-1 sm:order-2 w-full sm:w-auto px-8 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <template x-if="completing">
                <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              </template>
              <span x-text="isLastStep ? '${getStartedLabel}' : '${nextLabel}'"></span>
            </button>
          </div>
        </div>
      </main>
    </div>
  `
}

/* ── Alpine Data Component ──────────────────────────── */

Alpine.data('welcomePage', () => ({
  currentStepIndex: 0,
  totalSteps: 0,
  completing: false,
  userType: 'buyer' as UserType,

  get isLastStep(): boolean {
    return this.currentStepIndex >= this.totalSteps - 1
  },

  init() {
    const el = this.$el as HTMLElement
    this.userType = (el.dataset.userType === 'supplier' ? 'supplier' : 'buyer') as UserType
    this.totalSteps = getStepsForUserType(this.userType).length
  },

  nextStep() {
    if (this.currentStepIndex < this.totalSteps - 1) {
      this.currentStepIndex++
    }
  },

  prevStep() {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--
    }
  },

  async completeOnboarding() {
    if (this.completing) return
    this.completing = true

    try {
      await apiPost<{ success: boolean }>(
        'tr_tradehub.api.v1.auth.complete_onboarding',
        {},
      )

      // Update user profile in localStorage
      const user = getUser()
      if (user) {
        const updatedUser: AuthUser = {
          ...user,
          has_completed_onboarding: true,
        }
        setUser(updatedUser)
      }

      showToast({
        message: t('onboarding.completed', { defaultValue: 'Onboarding complete! Welcome aboard.' }),
        type: 'success',
      })

      // Redirect to the appropriate dashboard
      const baseUrl = getBaseUrl()
      setTimeout(() => {
        if (this.userType === 'supplier') {
          window.location.href = `${baseUrl}pages/seller/sell.html`
        } else {
          window.location.href = `${baseUrl}pages/dashboard/buyer-dashboard.html`
        }
      }, 500)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      showToast({ message, type: 'error' })
    } finally {
      this.completing = false
    }
  },

  async skipOnboarding() {
    // Skipping is the same as completing — marks onboarding as done
    await this.completeOnboarding()
  },
}))

/* ── Init Logic ──────────────────────────────────────── */

/**
 * Initialize WelcomePage interactivity.
 * Since the component is fully Alpine-driven, this is a no-op for now
 * but follows the init pattern used by other page components.
 */
export function initWelcomePage(): void {
  // Alpine.data('welcomePage') handles all interactivity.
  // This function exists for consistency with other page components.
}

/* ── Helper Functions ────────────────────────────────── */

/** Escape a string for safe use in an HTML attribute */
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
