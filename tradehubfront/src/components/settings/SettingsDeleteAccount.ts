/**
 * SettingsDeleteAccount Component
 * Multi-step account deletion flow.
 * Uses Alpine.js x-data="settingsDeleteAccount" for step navigation and form state.
 */

import { t } from '../../i18n';

const STORAGE_KEY = 'tradehub_account_data';

function readEmail(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw).email || 'met***@gmail.com';
  } catch { /* ignore */ }
  return 'met***@gmail.com';
}

const ICONS = {
  warning: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" fill="#fef2f2" stroke="#ef4444" stroke-width="2"/><path d="M24 14v12M24 30v2" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/></svg>`,
  trash: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M8 5V3h4v2M5 5v12a2 2 0 002 2h6a2 2 0 002-2V5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 9v6M12 9v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  check: `<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="22" fill="#f3f4f6"/><path d="M14 24l7 7 13-13" stroke="#6b7280" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

function getDeleteReasons(): string[] {
  return [
    t('settings.reasonNotUsing'),
    t('settings.reasonOtherPlatform'),
    t('settings.reasonPrivacy'),
    t('settings.reasonTooManyEmails'),
    t('settings.reasonAccountIssue'),
    t('settings.reasonOther'),
  ];
}

export function SettingsDeleteAccount(): string {
  const email = readEmail();
  const DELETE_REASONS = getDeleteReasons();
  return `
    <div class="max-w-[600px]" x-data="settingsDeleteAccount">
      <h2 class="text-lg max-sm:text-base font-bold mb-6 max-sm:mb-4 flex items-center gap-2" style="color:var(--color-text-heading, #111827)">${ICONS.trash} ${t('settings.deleteAccount')}</h2>

      <div class="del-acc__step mb-4" x-show="step === 1">
        <div class="bg-white border border-border-default rounded-xl p-8 max-md:p-6 max-sm:px-4 max-sm:py-5">
          <div class="text-center mb-4 max-sm:mb-3">${ICONS.warning}</div>
          <h2 class="text-lg max-sm:text-base font-bold mb-2 text-center" style="color:var(--color-text-heading, #111827)">${t('settings.deleteConfirmTitle')}</h2>
          <p class="text-sm max-sm:text-[13px] leading-normal mb-4 max-sm:mb-3 text-center" style="color:var(--color-text-muted, #666666)">${t('settings.deleteConfirmDesc')}</p>
          <ul class="list-none p-0 m-0 mb-5 max-sm:mb-4 flex flex-col gap-2.5 max-sm:gap-2">
            <li class="text-sm max-sm:text-[13px] leading-normal pl-6 relative" style="color:var(--color-text-body, #333333)"><span class="absolute left-1 top-[7px] w-2 h-2 bg-red-500 rounded-full"></span>${t('settings.deleteItemProfile')}</li>
            <li class="text-sm max-sm:text-[13px] leading-normal pl-6 relative" style="color:var(--color-text-body, #333333)"><span class="absolute left-1 top-[7px] w-2 h-2 bg-red-500 rounded-full"></span>${t('settings.deleteItemOrders')}</li>
            <li class="text-sm max-sm:text-[13px] leading-normal pl-6 relative" style="color:var(--color-text-body, #333333)"><span class="absolute left-1 top-[7px] w-2 h-2 bg-red-500 rounded-full"></span>${t('settings.deleteItemFavorites')}</li>
            <li class="text-sm max-sm:text-[13px] leading-normal pl-6 relative" style="color:var(--color-text-body, #333333)"><span class="absolute left-1 top-[7px] w-2 h-2 bg-red-500 rounded-full"></span>${t('settings.deleteItemMessages')}</li>
            <li class="text-sm max-sm:text-[13px] leading-normal pl-6 relative" style="color:var(--color-text-body, #333333)"><span class="absolute left-1 top-[7px] w-2 h-2 bg-red-500 rounded-full"></span>${t('settings.deleteItemLinked')}</li>
          </ul>
          <div class="bg-red-50 border border-red-200 rounded-lg py-3.5 px-4 max-sm:px-3 text-[13px] max-sm:text-xs text-red-900 leading-normal mb-6 max-sm:mb-4">
            <strong>${t('settings.deleteIrreversible')}</strong> ${t('settings.deleteIrreversibleDesc')}
          </div>
          <div class="mb-5 max-sm:mb-4">
            <label class="block text-[13px] max-sm:text-xs font-semibold mb-2" style="color:var(--color-text-body, #333333)">${t('settings.selectReasonLabel')}</label>
            <select class="w-full py-2.5 px-3 border border-gray-300 rounded-lg text-sm max-sm:text-[13px] bg-white cursor-pointer focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10" style="color:var(--color-text-heading, #111827)" x-model="reason">
              <option value="">${t('settings.selectReasonPlaceholder')}</option>
              ${DELETE_REASONS.map(r => `<option value="${r}">${r}</option>`).join('')}
            </select>
            <textarea class="w-full mt-2.5 py-2.5 px-3 border border-gray-300 rounded-lg text-sm max-sm:text-[13px] resize-y font-[inherit] focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10" style="color:var(--color-text-heading, #111827)" x-show="reason === '${t('settings.reasonOther')}'" x-cloak placeholder="${t('settings.explainReason')}" rows="3"></textarea>
          </div>
          <p class="text-[13px] text-red-600 mb-3" x-show="error1" x-text="error1" x-cloak></p>
          <div class="flex flex-col gap-3 max-sm:gap-2.5 items-center">
            <button class="inline-flex items-center justify-center py-3 max-sm:py-2.5 px-6 rounded-lg text-sm max-sm:text-[13px] font-semibold cursor-pointer border-none transition-all w-full max-w-[280px] max-sm:max-w-full text-center text-white bg-red-600 hover:bg-red-700" type="button" @click="continueToVerify()">${t('settings.wantToDelete')}</button>
            <a href="#" class="inline-flex items-center justify-center py-3 max-sm:py-2.5 px-6 rounded-lg text-sm max-sm:text-[13px] font-semibold cursor-pointer border border-gray-300 transition-all w-full max-w-[280px] max-sm:max-w-full text-center no-underline bg-transparent hover:bg-surface-muted" style="color:var(--color-text-muted, #666666)">${t('settings.cancelAction')}</a>
          </div>
        </div>
      </div>

      <div class="del-acc__step mb-4" x-show="step === 2" x-cloak>
        <div class="bg-white border border-border-default rounded-xl p-8 max-md:p-6 max-sm:px-4 max-sm:py-5">
          <h2 class="text-lg max-sm:text-base font-bold mb-2 text-center" style="color:var(--color-text-heading, #111827)">${t('settings.verifyIdentityForDelete')}</h2>
          <p class="text-sm max-sm:text-[13px] leading-normal mb-4 max-sm:mb-3 text-center" style="color:var(--color-text-muted, #666666)">${t('settings.verifyDeleteDesc', { email })}</p>
          <div class="flex items-center gap-3 max-sm:gap-2 mb-4 max-sm:mb-3 max-w-[320px] max-sm:max-w-full mx-auto">
            <input type="text" class="flex-1 py-2.5 px-3 border border-gray-300 rounded-lg text-base max-sm:text-sm text-center tracking-widest focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10" x-ref="delVerifyCode" maxlength="6" placeholder="${t('settings.sixDigitCode')}" />
            <span class="py-1.5 px-2.5 bg-red-50 rounded text-[13px] max-sm:text-xs font-semibold text-red-600 whitespace-nowrap flex-shrink-0" x-text="countdown > 0 ? countdown + ' s' : ''"></span>
          </div>
          <p class="text-[13px] text-red-600 mb-3" x-show="error2" x-text="error2" x-cloak></p>
          <div class="flex flex-col gap-3 max-sm:gap-2.5 items-center">
            <button class="inline-flex items-center justify-center py-3 max-sm:py-2.5 px-6 rounded-lg text-sm max-sm:text-[13px] font-semibold cursor-pointer border-none transition-all w-full max-w-[280px] max-sm:max-w-full text-center text-white bg-red-600 hover:bg-red-700" type="button" @click="verifyCode()">${t('settings.verifyAndContinue')}</button>
            <a href="#" class="inline-flex items-center justify-center py-3 max-sm:py-2.5 px-6 rounded-lg text-sm max-sm:text-[13px] font-semibold cursor-pointer border border-gray-300 transition-all w-full max-w-[280px] max-sm:max-w-full text-center no-underline bg-transparent hover:bg-surface-muted" style="color:var(--color-text-muted, #666666)">${t('settings.cancelAction')}</a>
          </div>
        </div>
      </div>

      <div class="del-acc__step mb-4" x-show="step === 3" x-cloak>
        <div class="bg-white border border-border-default rounded-xl p-8 max-md:p-6 max-sm:px-4 max-sm:py-5">
          <h2 class="text-lg max-sm:text-base font-bold mb-2 text-center text-red-600">${t('settings.finalConfirmation')}</h2>
          <p class="text-sm max-sm:text-[13px] leading-normal mb-4 max-sm:mb-3 text-center" style="color:var(--color-text-muted, #666666)">${t('settings.finalConfirmDesc')}</p>
          <label class="del-acc__confirm-check flex items-start gap-2.5 p-4 max-sm:p-3 bg-red-50 border border-red-200 rounded-lg mb-5 max-sm:mb-4 cursor-pointer text-sm max-sm:text-[13px] leading-normal" style="color:var(--color-text-body, #333333)">
            <input type="checkbox" class="w-[18px] h-[18px] mt-0.5 flex-shrink-0 cursor-pointer" style="accent-color:#dc2626" x-model="confirmed" />
            <span>${t('settings.confirmDeleteCheck')}</span>
          </label>
          <p class="text-[13px] text-red-600 mb-3" x-show="error3" x-text="error3" x-cloak></p>
          <div class="flex flex-col gap-3 max-sm:gap-2.5 items-center">
            <button class="inline-flex items-center justify-center py-3 max-sm:py-2.5 px-6 rounded-lg text-sm max-sm:text-[13px] font-semibold cursor-pointer border-none transition-all w-full max-w-[280px] max-sm:max-w-full text-center text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed" type="button" :disabled="!confirmed" @click="deleteFinal()">${t('settings.deleteMyAccount')}</button>
            <a href="#" class="inline-flex items-center justify-center py-3 max-sm:py-2.5 px-6 rounded-lg text-sm max-sm:text-[13px] font-semibold cursor-pointer border border-gray-300 transition-all w-full max-w-[280px] max-sm:max-w-full text-center no-underline bg-transparent hover:bg-surface-muted" style="color:var(--color-text-muted, #666666)">${t('settings.cancelAction')}</a>
          </div>
        </div>
      </div>

      <div class="del-acc__step mb-4" x-show="step === 4" x-cloak>
        <div class="bg-white border border-border-default rounded-xl p-8 text-center flex flex-col items-center max-md:p-6 max-sm:px-4 max-sm:py-5">
          ${ICONS.check}
          <h2 class="text-lg max-sm:text-base font-bold mb-2 mt-4" style="color:var(--color-text-heading, #111827)">${t('settings.accountDeleted')}</h2>
          <p class="text-sm max-sm:text-[13px] leading-normal mb-4 max-sm:mb-3" style="color:var(--color-text-muted, #666666)">${t('settings.accountDeletedDesc')}</p>
          <div class="flex flex-col gap-3 items-center w-full">
            <a href="/pages/auth/login.html" class="th-btn inline-flex items-center justify-center w-full max-w-[280px] max-sm:max-w-full text-center no-underline">${t('settings.goToLogin')}</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

/** @deprecated No-op — Alpine handles all interactivity */
export function initSettingsDeleteAccount(): void { /* no-op */ }
