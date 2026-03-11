/**
 * ForgotPasswordPage Component
 * 3-step password reset flow:
 *   Step 1: "Hesabınızı bulun" — Email/username input
 *   Step 2: "Kimliğinizi doğrulayın" — 6-digit OTP verification
 *   Step 3: "Şifrenizi yenileyin" — New password with requirements
 *
 * Uses Alpine.js x-data="forgotPasswordPage" for step navigation and form state.
 * Uses a minimal layout (logo header + centered card on gray bg),
 * matching the Alibaba forgot-password style.
 */

import { getBaseUrl } from './AuthLayout';
import { t } from '../../i18n';

/* ── Types ──────────────────────────────────────────── */

export type ForgotPasswordStep = 'find-account' | 'verify-code' | 'reset-password';

export interface ForgotPasswordState {
  step: ForgotPasswordStep;
  email: string;
  otp: string[];
  countdownSeconds: number;
  countdownInterval: number | null;
  canResend: boolean;
}

/* ── Helper ─────────────────────────────────────────── */

export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 3)}***@${domain}`;
}

const supportLink = `
  <a href="javascript:void(0)" class="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
      <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"/>
    </svg>
    <span data-i18n="auth.forgot.contactSupport">${t('auth.forgot.contactSupport')}</span>
  </a>
`;

/* ── Layout ─────────────────────────────────────────── */

/** Minimal header with logo + language selector */
function ForgotPasswordHeader(): string {
  const baseUrl = getBaseUrl();
  return `
    <header class="bg-white border-b-2" style="border-color: var(--auth-header-border, #FF6600)">
      <div class="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
        <a href="${baseUrl}" aria-label="iSTOC Ana Sayfa">
          <img src="${baseUrl}images/istoc-logo.png" alt="iSTOC" class="h-7" />
        </a>
        <div class="relative">
          <select class="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1 bg-white appearance-none pr-6 cursor-pointer auth-input-focus">
            <option>${t('common.turkish')}</option>
            <option>${t('common.english')}</option>
          </select>
          <svg class="w-3.5 h-3.5 absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="m19 9-7 7-7-7"/></svg>
        </div>
      </div>
    </header>
  `;
}

/** Wrap step content in a centered card */
function ForgotPasswordCard(content: string): string {
  return `
    <div class="min-h-[calc(100vh-58px)] bg-gray-100 flex items-start justify-center pt-8 sm:pt-12 pb-12 px-2 sm:px-4">
      <div class="w-full max-w-xl bg-white rounded-xl shadow-sm p-5 sm:p-8 md:p-12">
        ${content}
      </div>
    </div>
  `;
}

/* ── Step 1: Hesabınızı bulun ───────────────────────── */

function StepFindAccount(): string {
  return `
    <div x-show="step === 'find-account'">
      <h1 class="text-2xl font-bold text-gray-900 text-center mb-3" data-i18n="auth.forgot.findAccount">${t('auth.forgot.findAccount')}</h1>
      <p class="text-sm text-gray-500 text-center mb-8" data-i18n="auth.forgot.findAccountDesc">${t('auth.forgot.findAccountDesc')}</p>

      <form @submit.prevent="submitFindAccount()" class="space-y-5">
        <div>
          <label for="fp-email" class="sr-only" data-i18n="auth.forgot.usernameOrEmail">${t('auth.forgot.usernameOrEmail')}</label>
          <input
            type="text"
            id="fp-email"
            name="email"
            x-model="email"
            class="w-full h-12 px-4 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 auth-input-focus transition-colors"
            placeholder="${t('auth.forgot.usernameOrEmail')}" data-i18n-placeholder="auth.forgot.usernameOrEmail"
            required
            autocomplete="email"
          />
        </div>

        <button
          type="submit"
          :disabled="!email.trim()"
          disabled
          class="w-full h-12 th-btn th-btn-pill disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span data-i18n="auth.forgot.continue">${t('auth.forgot.continue')}</span>
        </button>
      </form>

      <div class="mt-16 flex justify-end">
        ${supportLink}
      </div>
    </div>
  `;
}

/* ── Step 2: Kimliğinizi doğrulayın ─────────────────── */

function StepVerifyCode(): string {
  const otpInputs = Array.from({ length: 6 }, (_, i) => `
    <input
      type="text"
      inputmode="numeric"
      pattern="[0-9]*"
      maxlength="1"
      data-fp-otp-index="${i}"
      class="w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 text-center text-lg sm:text-xl md:text-2xl font-bold
             rounded-lg border-2 border-gray-200
             bg-white text-gray-900
             auth-otp-focus
             transition-all duration-200 outline-none"
      placeholder=""
      autocomplete="one-time-code"
      aria-label="${t('auth.forgot.otpDigitLabel')} ${i + 1}"
    />
  `).join('');

  return `
    <div x-show="step === 'verify-code'" x-cloak>
      <h1 class="text-2xl font-bold text-gray-900 text-center mb-3" data-i18n="auth.forgot.verifyIdentity">${t('auth.forgot.verifyIdentity')}</h1>
      <p class="text-sm text-gray-500 text-center mb-1" data-i18n="auth.forgot.otpDesc">${t('auth.forgot.otpDesc')}</p>
      <p class="text-sm font-bold text-gray-900 text-center mb-8" x-text="maskedEmail"></p>

      <!-- OTP Inputs -->
      <div x-ref="otpContainer"
           @input="handleOtpInput($event)"
           @keydown="handleOtpKeydown($event)"
           @paste="handleOtpPaste($event)"
           class="flex justify-center gap-1.5 sm:gap-2 md:gap-3 mb-6">
        ${otpInputs}
      </div>

      <!-- OTP Error -->
      <p class="text-sm text-red-600 text-center mb-4" x-show="otpError" x-cloak data-i18n="auth.forgot.invalidCode">${t('auth.forgot.invalidCode')}</p>

      <!-- Resend -->
      <div class="text-center mb-6">
        <button
          type="button"
          :disabled="countdown > 0"
          @click="resendCode()"
          class="w-full h-12 border border-gray-300 rounded-full text-sm text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span data-i18n="auth.forgot.resendCode">${t('auth.forgot.resendCode')}</span> <span x-show="countdown > 0">(<span x-text="countdown"></span> ${t('auth.forgot.secondsAbbr')})</span>
        </button>
      </div>

      <!-- ID Verification Link -->
      <div class="text-center mb-12">
        <a href="javascript:void(0)" class="text-sm font-medium text-gray-900 underline hover:no-underline">
          <span data-i18n="auth.forgot.verifyWithId">${t('auth.forgot.verifyWithId')}</span>
        </a>
      </div>

      <div class="flex justify-end">
        ${supportLink}
      </div>
    </div>
  `;
}

/* ── Step 3: Şifrenizi yenileyin ────────────────────── */

function StepResetPassword(): string {
  return `
    <div x-show="step === 'reset-password'" x-cloak>
      <h1 class="text-2xl font-bold text-gray-900 text-center mb-8" data-i18n="auth.forgot.resetPassword">${t('auth.forgot.resetPassword')}</h1>

      <form @submit.prevent="submitReset()" class="space-y-5">
        <!-- New Password -->
        <div class="relative">
          <label for="fp-new-password" class="sr-only" data-i18n="auth.forgot.newPassword">${t('auth.forgot.newPassword')}</label>
          <input
            :type="showPassword ? 'text' : 'password'"
            id="fp-new-password"
            name="new-password"
            x-ref="newPassword"
            @input="validatePassword()"
            class="w-full h-12 px-4 pr-12 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 auth-input-focus transition-colors"
            placeholder="${t('auth.forgot.newPassword')}" data-i18n-placeholder="auth.forgot.newPassword"
            required
            autocomplete="new-password"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="${t('auth.forgot.showHidePassword')}" data-i18n-aria-label="auth.forgot.showHidePassword"
          >
            <!-- Eye closed (password hidden) -->
            <svg x-show="!showPassword" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"/>
            </svg>
            <!-- Eye open (password visible) -->
            <svg x-show="showPassword" x-cloak class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
            </svg>
          </button>
        </div>

        <!-- Password Requirements -->
        <ul class="space-y-1.5 text-sm text-gray-500 list-disc pl-5">
          <li :style="reqStyle(reqLength)" data-i18n="auth.forgot.passwordLength">${t('auth.forgot.passwordLength')}</li>
          <li :style="reqStyle(reqChars)" data-i18n="auth.forgot.passwordComplexity">${t('auth.forgot.passwordComplexity')}</li>
          <li :style="reqStyle(reqEmoji)" data-i18n="auth.forgot.passwordNoEmoji">${t('auth.forgot.passwordNoEmoji')}</li>
        </ul>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="!passwordValid"
          disabled
          class="w-full h-12 th-btn th-btn-pill disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span data-i18n="auth.forgot.resetAndLogin">${t('auth.forgot.resetAndLogin')}</span>
        </button>
      </form>
    </div>
  `;
}

/* ── Main Component ─────────────────────────────────── */

/** Render the full forgot-password page */
export function ForgotPasswordPage(): string {
  return `
    <div id="forgot-password-page" x-data="forgotPasswordPage">
      ${ForgotPasswordHeader()}
      ${ForgotPasswordCard(`
        ${StepFindAccount()}
        ${StepVerifyCode()}
        ${StepResetPassword()}
      `)}
    </div>
  `;
}

/* ── Init Logic ─────────────────────────────────────── */

/** @deprecated No-op — Alpine handles all interactivity */
export function initForgotPasswordPage(): void { /* no-op */ }
