/**
 * SettingsChangePassword Component
 * Multi-step password change flow.
 * Uses Alpine.js x-data="settingsChangePassword" for step navigation and form state.
 */

import { t } from '../../i18n';

const STORAGE_KEY = 'tradehub_account_data';
const ICONS = {
  info: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#2563eb" stroke-width="1.2"/><path d="M8 7v4M8 5h0" stroke="#2563eb" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  check: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" fill="#e5e7eb"/><path d="M6 10l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  checkActive: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" fill="#22c55e"/><path d="M6 10l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

function readEmail(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return data.email || 'met***@gmail.com';
    }
  } catch { /* ignore */ }
  return 'met***@gmail.com';
}

function renderStepper(activeStep: number): string {
  const steps = [
    { num: 1, label: t('settings.stepVerify') },
    { num: 2, label: t('settings.stepChangePassword') },
    { num: 3, label: t('settings.stepDone'), isLast: true },
  ];

  return `
    <div class="flex items-center justify-center mb-8 max-sm:mb-5 px-2">
      ${steps.map((s, i) => {
        const isActive = s.num === activeStep;
        const isDone = s.num < activeStep;
        const icon = isDone ? ICONS.checkActive : s.isLast ? ICONS.check : `<span class="flex items-center justify-center w-7 h-7 max-sm:w-6 max-sm:h-6 rounded-full text-[13px] max-sm:text-xs font-semibold ${isActive ? 'text-white' : ''}" style="background:${isActive ? 'var(--stepper-active-bg, #cc9900)' : '#e5e7eb'}; color:${isActive ? '#fff' : 'var(--color-text-muted, #666666)'}">${s.num}</span>`;
        const line = i < steps.length - 1 ? `<div class="flex-1 max-w-[100px] h-0.5 mx-2 mb-6 max-sm:mx-1" style="background:${isDone ? '#22c55e' : '#e5e7eb'}"></div>` : '';
        return `
          <div class="flex flex-col items-center gap-1.5 min-w-0 w-[90px] max-sm:w-[70px]">
            ${icon}
            <span class="text-[11px] max-sm:text-[9px] text-center leading-tight" style="color:${isDone ? '#22c55e' : isActive ? 'var(--color-primary-500, #cc9900)' : 'var(--color-text-placeholder, #999999)'}; font-weight:${isActive || isDone ? '600' : '400'}">${s.label}</span>
          </div>
          ${line}
        `;
      }).join('')}
    </div>
  `;
}

export function SettingsChangePassword(): string {
  const email = readEmail();
  return `
    <div class="bg-white rounded-lg p-8 max-md:p-5 max-sm:px-4 max-sm:py-4" x-data="settingsChangePassword">
      <h2 class="text-xl max-sm:text-base font-bold mb-7 max-sm:mb-4 m-0" style="color:var(--color-text-heading, #111827)">${t('settings.identityVerification')}</h2>

      <!-- Step 1: Verify -->
      <div x-show="step === 1">
        ${renderStepper(1)}
        <div class="max-w-[640px] mx-auto">
          <div class="flex items-start gap-2.5 py-3 px-4 max-sm:px-3 bg-blue-50 rounded-lg text-[13px] max-sm:text-xs text-blue-800 mb-5 max-sm:mb-4">
            <span class="flex-shrink-0 mt-0.5">${ICONS.info}</span>
            <span>${t('settings.protectAccountMsg')}</span>
          </div>

          <div class="mb-4 max-sm:mb-3">
            <label class="block text-[13px] max-sm:text-xs font-medium mb-1" style="color:var(--color-text-muted, #666666)">${t('settings.emailAddressLabel')}</label>
            <span class="text-sm max-sm:text-[13px] font-medium" style="color:var(--color-text-heading, #111827)">${email}</span>
          </div>

          <div class="mb-4 max-sm:mb-3">
            <label class="block text-[13px] max-sm:text-xs font-medium mb-1.5" style="color:var(--color-text-muted, #666666)">${t('settings.verificationCodeLabel')}</label>
            <div class="flex items-center gap-2.5">
              <input type="text" class="flex-1 max-w-[180px] py-2.5 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10" :class="{'!border-red-500': codeError}" x-ref="pwVerifyCode" maxlength="6" placeholder="${t('settings.sixDigitCode')}" />
              <span class="py-1.5 px-2.5 border border-primary-500 rounded-lg text-[13px] max-sm:text-xs font-semibold whitespace-nowrap flex-shrink-0" style="color:var(--color-primary-500, #cc9900)" x-text="countdown > 0 ? countdown + ' s' : ''"></span>
            </div>
          </div>

          <p class="text-xs text-green-600 mb-2 m-0">${t('settings.codeSentMsg')}</p>
          <p class="text-[13px] max-sm:text-xs mb-5 max-sm:mb-4 m-0" style="color:var(--color-text-body, #333333)">${t('settings.codeNotReceived')} <a href="#" class="text-blue-600 no-underline hover:underline font-medium" @click.prevent="resendCode()">${t('settings.clickHere')}</a></p>

          <div class="flex items-center gap-4 max-sm:flex-col">
            <button class="th-btn max-sm:w-full" type="button" @click="verifySubmit()">${t('settings.submit')}</button>
            <a href="#" class="text-[13px] max-sm:text-xs text-green-600 no-underline font-medium hover:underline max-sm:text-center">${t('settings.tryDifferentMethod')}</a>
          </div>
        </div>
      </div>

      <!-- Step 2: New Password -->
      <div x-show="step === 2" x-cloak>
        ${renderStepper(2)}
        <div class="max-w-[640px] mx-auto">
          <h3 class="text-base max-sm:text-[15px] font-bold mb-5 max-sm:mb-4 m-0" style="color:var(--color-text-heading, #111827)">${t('settings.setNewPassword')}</h3>
          <div class="mb-4 max-sm:mb-3">
            <label class="block text-[13px] max-sm:text-xs font-medium mb-1.5" style="color:var(--color-text-muted, #666666)">${t('settings.newPassword')}</label>
            <input type="password" class="w-full max-w-[360px] max-sm:max-w-full py-2.5 px-3.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10" x-ref="pwNew" placeholder="${t('settings.passwordMinChars')}" />
          </div>
          <div class="mb-4 max-sm:mb-3">
            <label class="block text-[13px] max-sm:text-xs font-medium mb-1.5" style="color:var(--color-text-muted, #666666)">${t('settings.newPasswordConfirm')}</label>
            <input type="password" class="w-full max-w-[360px] max-sm:max-w-full py-2.5 px-3.5 border border-gray-300 rounded-lg text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10" x-ref="pwConfirm" placeholder="${t('settings.reenterPassword')}" />
          </div>
          <p class="text-[13px] text-red-500 mb-3" x-show="error" x-text="error" x-cloak></p>
          <button class="th-btn max-sm:w-full" type="button" @click="savePassword()">${t('settings.privacySave')}</button>
        </div>
      </div>

      <!-- Step 3: Done -->
      <div x-show="step === 3" x-cloak>
        ${renderStepper(3)}
        <div class="max-w-[640px] mx-auto text-center py-4 max-sm:py-2">
          <div class="mb-4">${ICONS.checkActive}</div>
          <h3 class="text-lg max-sm:text-base font-bold mb-2 m-0" style="color:var(--color-text-heading, #111827)">${t('settings.passwordChangedSuccess')}</h3>
          <p class="text-sm max-sm:text-[13px] mb-6 max-sm:mb-4 m-0" style="color:var(--color-text-muted, #666666)">${t('settings.loginWithNewPassword')}</p>
          <a href="#" class="th-btn no-underline inline-flex max-sm:w-full max-sm:justify-center">${t('settings.backToSettings')}</a>
        </div>
      </div>
    </div>
  `;
}

/** @deprecated No-op — Alpine handles all interactivity */
export function initSettingsChangePassword(): void { /* no-op */ }
