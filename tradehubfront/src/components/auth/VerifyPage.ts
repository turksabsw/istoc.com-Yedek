/**
 * VerifyPage Component
 * Standalone email verification page with OTP input.
 * Used post-registration and when login detects unverified email.
 * Reads email from URL params, shows EmailVerification OTP component,
 * handles verify/resend via API, and redirects to dashboard on success.
 */

import { getBaseUrl } from './AuthLayout';
import { setTokens, setUser, mapBackendUser } from '../../utils/auth';
import type { AuthUser, BackendUser } from '../../utils/auth';
import { apiPost } from '../../utils/api';
import { showToast } from '../../utils/toast';
import {
  EmailVerification,
  initEmailVerification,
  showOTPError,
  clearOTPInputs,
  cleanupEmailVerification,
} from './EmailVerification';
import type { EmailVerificationState } from './EmailVerification';
import { t } from '../../i18n';

/* ── Types ──────────────────────────────────────────── */

export interface VerifyPageOptions {
  /** Callback on successful verification (overrides default redirect) */
  onSuccess?: () => void;
}

/** verify_email API response */
interface VerifyEmailResponse {
  success: boolean;
  token: {
    api_key: string;
    api_secret: string;
    token_type: string;
  };
  user: BackendUser;
}

/* ── Component HTML ─────────────────────────────────── */

/**
 * Renders the verify page content wrapping the EmailVerification OTP component.
 * Reads email from URL query params.
 */
export function VerifyPage(): string {
  const params = new URLSearchParams(window.location.search);
  const email = params.get('email') || '';

  return `
    <div id="verify-page" class="w-full" data-email="${escapeAttr(email)}">
      ${EmailVerification(email)}
    </div>
  `;
}

/* ── Init Logic ──────────────────────────────────────── */

/**
 * Initialize VerifyPage interactivity.
 * Sets up OTP verification submit, resend with 60s cooldown, and back navigation.
 */
export function initVerifyPage(options: VerifyPageOptions = {}): void {
  const verifyPage = document.getElementById('verify-page');
  if (!verifyPage) return;

  const baseUrl = getBaseUrl();
  const email = verifyPage.dataset.email || '';

  if (!email) {
    // No email provided — redirect to login
    window.location.href = `${baseUrl}pages/auth/login.html`;
    return;
  }

  // Track verification state for cleanup
  let verificationState: EmailVerificationState | null = null;

  // Prevent double submissions
  let isSubmitting = false;
  let isResending = false;

  // Initialize EmailVerification with verify/resend/back callbacks
  verificationState = initEmailVerification({
    email,
    resendCountdown: 60,

    onComplete: async (otp: string) => {
      if (isSubmitting) return;
      isSubmitting = true;

      const continueBtn = document.getElementById('otp-continue-btn') as HTMLButtonElement | null;
      setSubmitLoading(continueBtn, true);

      try {
        const result = await apiPost<VerifyEmailResponse>(
          'tr_tradehub.api.v1.auth.verify_email',
          { email, otp },
        );

        // Store auth tokens (no server-side expiry for API tokens, default 24h)
        setTokens({
          api_key: result.token.api_key,
          api_secret: result.token.api_secret,
          expires_in: 86400,
        });

        // Map backend user and store profile
        const user = mapBackendUser(result.user);
        setUser(user);

        // Redirect or call success callback
        if (options.onSuccess) {
          options.onSuccess();
        } else {
          // Redirect based on user_type
          const userType = user.user_type;
          if (userType === 'supplier') {
            window.location.href = `${baseUrl}pages/seller/sell.html`;
          } else {
            window.location.href = `${baseUrl}pages/dashboard/buyer-dashboard.html`;
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        showOTPError(message);
        clearOTPInputs();
      } finally {
        isSubmitting = false;
        setSubmitLoading(continueBtn, false);
      }
    },

    onResend: async () => {
      if (isResending) return;
      isResending = true;

      try {
        await apiPost<{ success: boolean }>(
          'tr_tradehub.api.v1.auth.resend_verification_otp',
          { email },
        );

        showToast({
          message: t('auth.otpResent'),
          type: 'success',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        showToast({ message, type: 'error' });
      } finally {
        isResending = false;
      }
    },

    onBack: () => {
      // Navigate back to login page
      window.location.href = `${baseUrl}pages/auth/login.html`;
    },
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (verificationState) {
      cleanupEmailVerification(verificationState);
    }
  });
}

/* ── Helper Functions ────────────────────────────────── */

/**
 * Escape a string for safe use in an HTML attribute
 */
function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

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
