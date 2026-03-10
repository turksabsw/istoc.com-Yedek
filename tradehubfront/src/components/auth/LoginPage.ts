/**
 * LoginPage Component
 * Login page content with email/password login and 'Create account' link.
 * Used within AuthLayout for both desktop and mobile views.
 */

import { getBaseUrl } from './AuthLayout';
import { login } from '../../utils/auth';
import { t } from '../../i18n';

/* ── Types ──────────────────────────────────────────── */

export interface LoginPageOptions {
  /** Callback when 'Create account' is clicked */
  onCreateAccount?: () => void;
}

/* ── Component HTML ─────────────────────────────────── */

export function LoginPage(): string {
  const baseUrl = getBaseUrl();

  return `
    <div id="login-page" class="w-full">
      <!-- Header Area -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2" data-i18n="auth.login.title">${t('auth.login.title')}</h1>
      </div>

      <!-- Login Form -->
      <form id="login-form" class="space-y-5">
        
        <!-- Email Input -->
        <div>
          <label for="email" class="sr-only" data-i18n="auth.login.email">${t('auth.login.email')}</label>
          <input 
            type="email" 
            id="email" 
            name="email"
            class="w-full h-12 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white placeholder-gray-500 auth-input-focus transition-colors"
            placeholder="${t('auth.login.email')}" data-i18n-placeholder="auth.login.email"
            required
          >
        </div>

        <!-- Password Input -->
        <div class="relative">
          <label for="password" class="sr-only" data-i18n="auth.login.password">${t('auth.login.password')}</label>
          <input 
            type="password" 
            id="password" 
            name="password"
            class="w-full h-12 px-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white placeholder-gray-500 auth-input-focus transition-colors"
            placeholder="${t('auth.login.password')}" data-i18n-placeholder="auth.login.password"
            required
          >
          <button 
            type="button" 
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>

        <!-- Forgot Password -->
        <div class="text-right">
          <a href="${baseUrl}pages/auth/forgot-password.html" class="text-sm font-medium text-gray-900 dark:text-gray-300 hover:underline">
            <span data-i18n="auth.login.forgotPassword">${t('auth.login.forgotPassword')}</span>
          </a>
        </div>

        <!-- Submit Button -->
        <button 
          type="submit" 
          class="w-full h-12 th-btn th-btn-pill"
        >
          <span data-i18n="auth.login.continue">${t('auth.login.continue')}</span>
        </button>

      </form>


      <!-- Create Account Link -->
      <div class="mt-8 text-center">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          <span data-i18n="auth.login.newUser">${t('auth.login.newUser')}</span>
          <a
            href="${baseUrl}pages/auth/register.html"
            id="login-create-account-link"
            class="font-medium text-gray-900 dark:text-white hover:underline ml-1"
          >
            <span data-i18n="auth.login.createAccount">${t('auth.login.createAccount')}</span>
          </a>
        </p>
      </div>

    </div>
  `;
}

/* ── Init Logic ──────────────────────────────────────── */

/**
 * Initialize LoginPage interactivity
 * Sets up social login button handlers and create account link
 */
export function initLoginPage(options: LoginPageOptions = {}): void {
  const loginPage = document.getElementById('login-page');
  if (!loginPage) return;

  // Handle 'Create account' link
  const createAccountLink = document.getElementById('login-create-account-link');
  if (createAccountLink && options.onCreateAccount) {
    createAccountLink.addEventListener('click', (e) => {
      e.preventDefault();
      options.onCreateAccount!();
    });
  }

  // Handle Form Submission
  const loginForm = document.getElementById('login-form') as HTMLFormElement;
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = (document.getElementById('email') as HTMLInputElement)?.value;
      if (email) {
        login(email);
        window.location.href = getBaseUrl();
      }
    });
  }
}
