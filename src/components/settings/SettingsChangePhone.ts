/**
 * SettingsChangePhone Component
 * Phone number change with verification.
 * Uses Alpine.js x-data="settingsChangePhone" for step navigation and form state.
 */

import { t } from '../../i18n';

export function SettingsChangePhone(): string {
  return `
    <div class="flex justify-center" x-data="settingsChangePhone">
      <div class="w-full max-w-[640px]">
        <!-- Step 1: Enter phone -->
        <div x-show="step === 1">
          <div class="bg-white rounded-xl p-8 shadow-sm max-md:p-6 max-sm:px-4 max-sm:py-5">
            <h2 class="text-xl max-sm:text-lg font-bold mb-2 m-0 text-center" style="color:var(--color-text-heading, #111827)">${t('settings.changePhone')}</h2>
            <p class="text-sm max-sm:text-[13px] text-center mb-6 max-sm:mb-4 m-0" style="color:var(--color-text-muted, #666666)">${t('settings.changePhoneDesc')}</p>
            <div class="mb-4 max-sm:mb-3">
              <label class="block text-[13px] max-sm:text-xs font-medium mb-1.5" style="color:var(--color-text-muted, #666666)">${t('settings.countryCode')}</label>
              <input type="text" class="w-full max-w-[120px] py-2.5 px-3.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10" style="color:var(--color-text-heading, #111827)" x-model="countryCode" placeholder="+90" />
            </div>
            <div class="mb-4 max-sm:mb-3">
              <label class="block text-[13px] max-sm:text-xs font-medium mb-1.5" style="color:var(--color-text-muted, #666666)">${t('settings.phoneNumber')}</label>
              <input type="tel" class="w-full max-w-[320px] max-sm:max-w-full py-2.5 px-3.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10" style="color:var(--color-text-heading, #111827)" x-model="phoneNumber" placeholder="5XX XXX XX XX" />
            </div>
            <p class="text-[13px] text-red-500 mb-3" x-show="phoneError" x-text="phoneError" x-cloak></p>
            <button class="th-btn block w-full max-w-[320px] max-sm:max-w-full" type="button" @click="sendCode()">${t('settings.sendVerificationCode')}</button>
          </div>
        </div>

        <!-- Step 2: Verify code -->
        <div x-show="step === 2" x-cloak>
          <div class="bg-white rounded-xl p-8 shadow-sm max-md:p-6 max-sm:px-4 max-sm:py-5">
            <h2 class="text-xl max-sm:text-lg font-bold mb-2 m-0 text-center" style="color:var(--color-text-heading, #111827)">${t('settings.enterVerificationCode')}</h2>
            <p class="text-sm max-sm:text-[13px] text-center mb-6 max-sm:mb-4 m-0" style="color:var(--color-text-muted, #666666)">${t('settings.enterCodeDesc')}</p>
            <div class="flex items-center gap-2.5 mb-5 max-sm:mb-4 max-w-[280px] mx-auto max-sm:max-w-full">
              <input type="text" class="flex-1 py-2.5 px-3.5 border border-gray-300 rounded-lg text-sm text-center outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10" x-ref="phoneVerifyCode" maxlength="6" placeholder="${t('settings.sixDigitCode')}" />
              <span class="py-1.5 px-2.5 border border-primary-500 rounded-lg text-[13px] max-sm:text-xs font-semibold whitespace-nowrap flex-shrink-0" style="color:var(--color-primary-500, #cc9900)" x-text="countdown > 0 ? countdown + ' s' : ''"></span>
            </div>
            <p class="text-[13px] text-red-500 mb-3" x-show="verifyError" x-text="verifyError" x-cloak></p>
            <button class="th-btn block w-full max-w-[320px] mx-auto max-sm:max-w-full" type="button" @click="verify()">${t('settings.verify')}</button>
          </div>
        </div>

        <!-- Step 3: Success -->
        <div x-show="step === 3" x-cloak>
          <div class="bg-white rounded-xl p-8 shadow-sm text-center max-md:p-6 max-sm:px-4 max-sm:py-5">
            <div class="mb-4">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" fill="#22c55e"/><path d="M14 24l7 7 13-13" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <h2 class="text-xl max-sm:text-lg font-bold mb-2 m-0" style="color:var(--color-text-heading, #111827)">${t('settings.phoneUpdated')}</h2>
            <p class="text-sm max-sm:text-[13px] mb-5 m-0" style="color:var(--color-text-muted, #666666)">${t('settings.newPhoneSaved')}</p>
            <a href="#" class="th-btn block w-full max-w-[320px] mx-auto max-sm:max-w-full text-center no-underline">${t('settings.backToSettings')}</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

/** @deprecated No-op — Alpine handles all interactivity */
export function initSettingsChangePhone(): void { /* no-op */ }
