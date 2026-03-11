/**
 * LoginPage Component
 * Login page content with email/password login and 'Create account' link.
 * Handles real API login, 2FA OTP step, and error handling.
 * Used within AuthLayout for both desktop and mobile views.
 */

import { getBaseUrl } from './AuthLayout';
import { setTokens, setUser } from '../../utils/auth';
import type { AuthTokens, AuthUser } from '../../utils/auth';
import { apiPost } from '../../utils/api';
import { showToast } from '../../utils/toast';
import { EmailVerification, initEmailVerification, cleanupEmailVerification } from './EmailVerification';
import type { EmailVerificationState } from './EmailVerification';
import { t } from '../../i18n';

/* ── Types ──────────────────────────────────────────── */

export interface LoginPageOptions {
  /** Callback when 'Create account' is clicked */
  onCreateAccount?: () => void;
}

/** Login API success response */
interface LoginResponse {
  requires_2fa: boolean;
  session_id?: string;
  /** Token data (when 2FA is not required) */
  api_key?: string;
  api_secret?: string;
  expires_in?: number;
  /** User profile (when 2FA is not required) */
  user?: AuthUser;
}

/** 2FA verification API response */
interface Verify2FAResponse {
  api_key: string;
  api_secret: string;
  expires_in: number;
  user: AuthUser;
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
          id="login-submit-btn"
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

      <!-- 2FA OTP Container (hidden by default, shown when requires_2fa) -->
      <div id="login-2fa-container" class="hidden"></div>

    </div>
  `;
}

/* ── Init Logic ──────────────────────────────────────── */

/**
 * Initialize LoginPage interactivity
 * Sets up form submission with real API login, 2FA handling, and error display
 */
export function initLoginPage(options: LoginPageOptions = {}): void {
  const loginPage = document.getElementById('login-page');
  if (!loginPage) return;

  const baseUrl = getBaseUrl();

  // Track 2FA verification state for cleanup
  let verificationState: EmailVerificationState | null = null;

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
  const submitBtn = document.getElementById('login-submit-btn') as HTMLButtonElement | null;

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('email') as HTMLInputElement | null;
      const passwordInput = document.getElementById('password') as HTMLInputElement | null;
      const email = emailInput?.value?.trim();
      const password = passwordInput?.value;

      if (!email || !password) return;

      // Set loading state
      setSubmitLoading(submitBtn, true);

      try {
        const result = await apiPost<LoginResponse>(
          'tr_tradehub.api.v1.auth.login',
          { email, password },
        );

        if (result.requires_2fa && result.session_id) {
          // Show 2FA OTP step
          show2FAStep(email, result.session_id, baseUrl, (state) => {
            verificationState = state;
          });
        } else if (result.api_key && result.api_secret && result.user) {
          // Direct login success (no 2FA)
          handleLoginSuccess(result as Required<Pick<LoginResponse, 'api_key' | 'api_secret' | 'expires_in' | 'user'>>, baseUrl);
        }
      } catch (err) {
        handleLoginError(err, email, baseUrl);
      } finally {
        setSubmitLoading(submitBtn, false);
      }
    });
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (verificationState) {
      cleanupEmailVerification(verificationState);
    }
  });
}

/* ── Helper Functions ────────────────────────────────── */

/**
 * Set loading/disabled state on submit button
 */
function setSubmitLoading(btn: HTMLButtonElement | null, loading: boolean): void {
  if (!btn) return;

  btn.disabled = loading;

  if (loading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `
      <svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
    `;
    btn.classList.add('opacity-70', 'cursor-not-allowed');
  } else {
    if (btn.dataset.originalText) {
      btn.innerHTML = btn.dataset.originalText;
      delete btn.dataset.originalText;
    }
    btn.classList.remove('opacity-70', 'cursor-not-allowed');
  }
}

/**
 * Validate that a return URL is safe (same-origin only).
 * Prevents open-redirect attacks via crafted `?return=https://evil.com` params.
 */
function isSafeReturnUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.origin === window.location.origin;
  } catch {
    // Relative paths are safe
    return !url.startsWith('//') && !url.includes('://');
  }
}

/**
 * Handle successful login — store tokens/user and redirect
 */
function handleLoginSuccess(
  data: { api_key: string; api_secret: string; expires_in: number; user: AuthUser },
  baseUrl: string,
): void {
  // Store auth tokens
  setTokens({
    api_key: data.api_key,
    api_secret: data.api_secret,
    expires_in: data.expires_in,
  });

  // Store user profile
  setUser(data.user);

  // Determine redirect destination
  const params = new URLSearchParams(window.location.search);
  const returnUrl = params.get('return');

  if (returnUrl && isSafeReturnUrl(returnUrl)) {
    window.location.href = returnUrl;
  } else {
    // Redirect based on user_type
    const userType = data.user.user_type;
    if (userType === 'supplier') {
      window.location.href = `${baseUrl}pages/supplier-dashboard.html`;
    } else {
      window.location.href = `${baseUrl}pages/buyer-dashboard.html`;
    }
  }
}

/**
 * Handle login error — show appropriate toast or redirect
 */
function handleLoginError(err: unknown, email: string, baseUrl: string): void {
  const message = err instanceof Error ? err.message : String(err);

  // Check for email_not_verified error — redirect to verify page
  if (message.toLowerCase().includes('email_not_verified') || message.toLowerCase().includes('email not verified')) {
    window.location.href = `${baseUrl}pages/auth/verify.html?email=${encodeURIComponent(email)}`;
    return;
  }

  // Show error toast for all other errors
  showToast({
    message,
    type: 'error',
  });
}

/**
 * Show 2FA OTP verification step — hides login form and shows EmailVerification
 */
function show2FAStep(
  email: string,
  sessionId: string,
  baseUrl: string,
  onStateCreated: (state: EmailVerificationState) => void,
): void {
  const loginForm = document.getElementById('login-form');
  const twoFAContainer = document.getElementById('login-2fa-container');

  if (!loginForm || !twoFAContainer) return;

  // Hide login form
  loginForm.classList.add('hidden');

  // Also hide the create account link
  const createAccountSection = loginForm.nextElementSibling;
  if (createAccountSection) {
    (createAccountSection as HTMLElement).classList.add('hidden');
  }

  // Render EmailVerification component into 2FA container
  twoFAContainer.innerHTML = EmailVerification(email);
  twoFAContainer.classList.remove('hidden');

  // Initialize EmailVerification with 2FA callbacks
  const state = initEmailVerification({
    email,
    onComplete: async (otp: string) => {
      // Verify 2FA OTP
      const continueBtn = document.getElementById('otp-continue-btn') as HTMLButtonElement | null;
      if (continueBtn) {
        continueBtn.disabled = true;
        continueBtn.textContent = '...';
      }

      try {
        const result = await apiPost<Verify2FAResponse>(
          'tr_tradehub.api.v1.auth.verify_2fa',
          { email, otp, session_id: sessionId },
        );

        handleLoginSuccess(result, baseUrl);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        showToast({ message, type: 'error' });

        // Re-enable continue button
        if (continueBtn) {
          continueBtn.disabled = false;
          continueBtn.textContent = t('auth.otpVerifyAndContinue');
        }
      }
    },
    onBack: () => {
      // Return to login form
      twoFAContainer.classList.add('hidden');
      twoFAContainer.innerHTML = '';
      loginForm.classList.remove('hidden');

      // Show create account link again
      if (createAccountSection) {
        (createAccountSection as HTMLElement).classList.remove('hidden');
      }
    },
  });

  onStateCreated(state);
}
