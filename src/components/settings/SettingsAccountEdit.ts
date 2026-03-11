/**
 * SettingsAccountEdit Component
 * Account information view/edit form with localStorage CRUD.
 */

import { t } from '../../i18n';

const STORAGE_KEY = 'tradehub_account_data';

const ICONS = {
  verified: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="#22c55e"/><path d="M4.5 7l2 2 3.5-3.5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

// ── Data Model ───────────────────────────────────────────────────

export interface AccountData {
  accountId: string;
  firstName: string;
  lastName: string;
  gender: string;
  email: string;
  emailVerified: boolean;
  altEmail: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  phoneCountry: string;
  phoneArea: string;
  phoneNumber: string;
  faxCountry: string;
  faxArea: string;
  faxNumber: string;
  mobile: string;
  department: string;
  occupation: string;
}

const defaultData: AccountData = {
  accountId: 'tr29243492599miuy',
  firstName: 'Metin',
  lastName: 'K.',
  gender: '',
  email: 'met***@gmail.com',
  emailVerified: true,
  altEmail: '',
  address: '',
  city: '',
  country: 'Turkey',
  postalCode: '',
  phoneCountry: '',
  phoneArea: '',
  phoneNumber: '',
  faxCountry: '',
  faxArea: '',
  faxNumber: '',
  mobile: '',
  department: '',
  occupation: '',
};

// ── CRUD Methods ─────────────────────────────────────────────────

function readAccountData(): AccountData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...defaultData, ...JSON.parse(raw) };
    }
  } catch { /* ignore parse errors */ }
  return { ...defaultData };
}

function saveAccountData(data: AccountData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ── Render: View Mode ────────────────────────────────────────────

function viewRow(label: string, value: string, extra?: string): string {
  const display = value || `<span style="color:var(--color-text-placeholder, #999999)">--</span>`;
  return `
    <div class="flex py-3.5 max-sm:py-3 border-b border-gray-100 last:border-b-0 max-md:flex-col max-md:gap-0.5">
      <div class="w-[200px] flex-shrink-0 text-[13px] font-medium text-right pr-4 max-md:w-auto max-md:text-left max-md:pr-0" style="color:var(--color-text-muted, #666666)">${label}</div>
      <div class="flex-1 min-w-0 text-sm max-sm:text-[13px] flex items-center gap-2 flex-wrap" style="color:var(--color-text-heading, #111827)">${display}${extra || ''}</div>
    </div>
  `;
}

function renderViewMode(data: AccountData): string {
  const phone = [data.phoneCountry, data.phoneArea, data.phoneNumber].filter(Boolean).join(' ');
  const fax = [data.faxCountry, data.faxArea, data.faxNumber].filter(Boolean).join(' ');
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  const address = [data.address, data.city, data.country].filter(Boolean).join(', ');

  const verifiedBadge = data.emailVerified
    ? `<span class="inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap" style="color:#22c55e">${ICONS.verified} ${t('settings.emailVerifiedText')}</span>`
    : '';

  return `
    <div class="bg-white rounded-lg p-8 max-md:p-5 max-sm:px-4 max-sm:py-4" id="acc-edit-view">
      <div class="flex items-start justify-between gap-3 max-sm:flex-col max-sm:gap-2">
        <h2 class="text-lg max-sm:text-base font-semibold m-0" style="color:var(--color-text-heading, #111827)">${t('settings.editAccountTitle')}</h2>
        <a href="#" class="text-[13px] text-blue-600 no-underline font-medium hover:underline whitespace-nowrap flex-shrink-0">${t('settings.closeAccountLink')}</a>
      </div>
      <div class="h-px bg-gray-200 mt-4 mb-1 max-sm:mt-3"></div>
      <div class="text-xs text-red-500 text-right mb-2">${t('settings.requiredField')}</div>

      <div class="flex flex-col">
        ${viewRow(t('settings.accountNumber'), data.accountId)}
        ${viewRow(t('settings.fullName'), fullName)}
        ${viewRow(t('settings.genderLabel'), data.gender)}
        ${viewRow(t('settings.emailAddressField'), data.email, verifiedBadge)}
        ${viewRow(t('settings.altEmailAddress'), data.altEmail)}
        ${viewRow(t('settings.contactAddressLabel'), address)}
        ${viewRow(t('settings.postalCodeLabel'), data.postalCode)}
        ${viewRow(t('settings.telLabel'), phone)}
        ${viewRow(t('settings.faxLabel'), fax)}
        ${viewRow(t('settings.mobileLabel'), data.mobile)}
        ${viewRow(t('settings.departmentLabel'), data.department)}
        ${viewRow(t('settings.occupationLabel'), data.occupation)}
      </div>

      <div class="mt-6 max-sm:mt-4">
        <button class="th-btn-outline w-full max-w-[280px] mx-auto block max-sm:max-w-full" type="button" id="acc-edit-toggle">${t('settings.editBtn')}</button>
      </div>
    </div>
  `;
}

// ── Render: Edit Mode ────────────────────────────────────────────

function getDepartments(): { value: string; label: string }[] {
  return [
    { value: '', label: t('settings.deptSelectPlaceholder') },
    { value: t('settings.deptSales'), label: t('settings.deptSales') },
    { value: t('settings.deptMarketing'), label: t('settings.deptMarketing') },
    { value: t('settings.deptEngineering'), label: t('settings.deptEngineering') },
    { value: t('settings.deptManagement'), label: t('settings.deptManagement') },
    { value: t('settings.deptOther'), label: t('settings.deptOther') },
  ];
}

function renderEditMode(data: AccountData): string {
  const DEPARTMENTS = getDepartments();
  const deptOptions = DEPARTMENTS.map(d =>
    `<option value="${d.value}" ${d.value === data.department ? 'selected' : ''}>${d.label}</option>`
  ).join('');

  const inputCls = "w-full py-2.5 px-3 border border-gray-300 rounded-lg text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";
  const labelCls = "block text-[13px] font-medium mb-1.5";
  const reqDot = `<span class="text-red-500">*</span> `;
  const sectionTitle = (text: string) => `<h3 class="text-[13px] font-semibold uppercase tracking-wide mb-4 max-sm:mb-3" style="color:var(--color-text-muted, #666666)">${text}</h3>`;

  return `
    <div class="bg-white rounded-lg p-8 max-md:p-5 max-sm:px-4 max-sm:py-4" id="acc-edit-form" style="display:none">
      <!-- Header -->
      <div class="flex items-start justify-between gap-3 max-sm:flex-col max-sm:gap-2">
        <h2 class="text-lg max-sm:text-base font-semibold m-0" style="color:var(--color-text-heading, #111827)">${t('settings.editAccountTitle')}</h2>
        <a href="#" class="text-[13px] text-blue-600 no-underline font-medium hover:underline whitespace-nowrap flex-shrink-0">${t('settings.closeAccountLink')}</a>
      </div>
      <div class="h-px bg-gray-200 mt-4 mb-6 max-sm:mt-3 max-sm:mb-4"></div>

      <!-- Personal Information -->
      ${sectionTitle(t('settings.fullName'))}
      <div class="grid grid-cols-2 max-sm:grid-cols-1 gap-4 mb-6 max-sm:mb-5">
        <div>
          <label class="${labelCls}" style="color:var(--color-text-muted, #666666)">${reqDot}${t('settings.firstName')}</label>
          <input type="text" class="${inputCls}" data-field="firstName" value="${data.firstName}" placeholder="${t('settings.firstName')}" />
        </div>
        <div>
          <label class="${labelCls}" style="color:var(--color-text-muted, #666666)">${reqDot}${t('settings.lastName')}</label>
          <input type="text" class="${inputCls}" data-field="lastName" value="${data.lastName}" placeholder="${t('settings.lastName')}" />
        </div>
      </div>

      <div class="mb-6 max-sm:mb-5">
        <label class="${labelCls}" style="color:var(--color-text-muted, #666666)">${reqDot}${t('settings.genderLabel')}</label>
        <div class="flex items-center gap-6 mt-1">
          <label class="inline-flex items-center gap-2 text-sm cursor-pointer" style="color:var(--color-text-body, #333333)"><input type="radio" name="gender" value="${t('settings.genderMale')}" class="w-4 h-4 m-0" style="accent-color:var(--color-primary-500)" ${data.gender === t('settings.genderMale') ? 'checked' : ''} /> ${t('settings.genderMale')}</label>
          <label class="inline-flex items-center gap-2 text-sm cursor-pointer" style="color:var(--color-text-body, #333333)"><input type="radio" name="gender" value="${t('settings.genderFemale')}" class="w-4 h-4 m-0" style="accent-color:var(--color-primary-500)" ${data.gender === t('settings.genderFemale') ? 'checked' : ''} /> ${t('settings.genderFemale')}</label>
        </div>
      </div>

      <!-- Email -->
      <div class="h-px bg-gray-100 mb-6 max-sm:mb-4"></div>
      ${sectionTitle(t('settings.emailAddressField'))}

      <div class="flex items-center gap-2 flex-wrap mb-4 text-sm" style="color:var(--color-text-heading, #111827)">
        <span class="font-medium">${data.email}</span>
        ${data.emailVerified ? `<span class="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style="color:#22c55e; background:#f0fdf4">${ICONS.verified} ${t('settings.emailVerifiedText')}</span>` : ''}
        <a href="#" class="text-[13px] text-blue-600 no-underline hover:underline ml-1">${t('settings.changeEmailLink')}</a>
      </div>

      <div class="mb-6 max-sm:mb-5">
        <label class="${labelCls}" style="color:var(--color-text-muted, #666666)">${t('settings.altEmailAddress')}</label>
        <input type="email" class="${inputCls} max-w-[400px]" data-field="altEmail" value="${data.altEmail}" />
        <p class="text-xs mt-1.5 m-0" style="color:var(--color-text-placeholder, #999999)">${t('settings.altEmailHint')}</p>
      </div>

      <!-- Address -->
      <div class="h-px bg-gray-100 mb-6 max-sm:mb-4"></div>
      ${sectionTitle(t('settings.contactAddressLabel'))}

      <div class="flex flex-col gap-4 mb-6 max-sm:mb-5">
        <div>
          <label class="${labelCls}" style="color:var(--color-text-muted, #666666)">${reqDot}${t('settings.streetAddress')}</label>
          <input type="text" class="${inputCls}" data-field="address" value="${data.address}" />
        </div>
        <div class="grid grid-cols-2 max-sm:grid-cols-1 gap-4">
          <div>
            <label class="${labelCls}" style="color:var(--color-text-muted, #666666)">${reqDot}${t('settings.cityLabel')}</label>
            <input type="text" class="${inputCls}" data-field="city" value="${data.city}" />
          </div>
          <div>
            <label class="${labelCls}" style="color:var(--color-text-muted, #666666)">${reqDot}${t('settings.countryRegion')}</label>
            <select class="${inputCls} bg-white cursor-pointer" data-field="country">
              <option value="Turkey" ${data.country === 'Turkey' ? 'selected' : ''}>Turkey</option>
            </select>
          </div>
        </div>
        <div class="max-w-[200px] max-sm:max-w-full">
          <label class="${labelCls}" style="color:var(--color-text-muted, #666666)">${t('settings.postalCodeLabel')}</label>
          <input type="text" class="${inputCls}" data-field="postalCode" value="${data.postalCode}" />
        </div>
      </div>

      <!-- Phone & Fax -->
      <div class="h-px bg-gray-100 mb-6 max-sm:mb-4"></div>
      ${sectionTitle(t('settings.telLabel'))}

      <div class="grid grid-cols-3 max-sm:grid-cols-1 gap-4 mb-6 max-sm:mb-5">
        <div>
          <label class="${labelCls}" style="color:var(--color-text-muted, #666666)">${reqDot}${t('settings.countryCodeLabel')}</label>
          <input type="text" class="${inputCls}" data-field="phoneCountry" value="${data.phoneCountry}" placeholder="+90" />
        </div>
        <div>
          <label class="${labelCls}" style="color:var(--color-text-muted, #666666)">${t('settings.areaCodeLabel')}</label>
          <input type="text" class="${inputCls}" data-field="phoneArea" value="${data.phoneArea}" placeholder="5XX" />
        </div>
        <div>
          <label class="${labelCls}" style="color:var(--color-text-muted, #666666)">${t('settings.numberLabel')}</label>
          <input type="text" class="${inputCls}" data-field="phoneNumber" value="${data.phoneNumber}" placeholder="XXX XX XX" />
        </div>
      </div>

      <div class="mb-6 max-sm:mb-5">
        <label class="${labelCls}" style="color:var(--color-text-muted, #666666)">${t('settings.faxLabel')}</label>
        <div class="grid grid-cols-3 max-sm:grid-cols-1 gap-4">
          <div>
            <label class="block text-xs mb-1" style="color:var(--color-text-placeholder, #999999)">${t('settings.countryCodeLabel')}</label>
            <input type="text" class="${inputCls}" data-field="faxCountry" value="${data.faxCountry}" />
          </div>
          <div>
            <label class="block text-xs mb-1" style="color:var(--color-text-placeholder, #999999)">${t('settings.areaCodeLabel')}</label>
            <input type="text" class="${inputCls}" data-field="faxArea" value="${data.faxArea}" />
          </div>
          <div>
            <label class="block text-xs mb-1" style="color:var(--color-text-placeholder, #999999)">${t('settings.numberLabel')}</label>
            <input type="text" class="${inputCls}" data-field="faxNumber" value="${data.faxNumber}" />
          </div>
        </div>
      </div>

      <div class="max-w-[280px] max-sm:max-w-full mb-6 max-sm:mb-5">
        <label class="${labelCls}" style="color:var(--color-text-muted, #666666)">${t('settings.mobileLabel')}</label>
        <input type="text" class="${inputCls}" data-field="mobile" value="${data.mobile}" />
      </div>

      <!-- Work -->
      <div class="h-px bg-gray-100 mb-6 max-sm:mb-4"></div>
      <div class="grid grid-cols-2 max-sm:grid-cols-1 gap-4 mb-6 max-sm:mb-5">
        <div>
          <label class="${labelCls}" style="color:var(--color-text-muted, #666666)">${t('settings.departmentLabel')}</label>
          <select class="${inputCls} bg-white cursor-pointer" data-field="department">
            ${deptOptions}
          </select>
        </div>
        <div>
          <label class="${labelCls}" style="color:var(--color-text-muted, #666666)">${t('settings.occupationLabel')}</label>
          <input type="text" class="${inputCls}" data-field="occupation" value="${data.occupation}" />
        </div>
      </div>

      <!-- Submit -->
      <div class="pt-4 border-t border-gray-100 flex items-center gap-3 max-sm:flex-col">
        <button class="th-btn px-8 max-sm:w-full" type="button" id="acc-edit-submit">${t('settings.submitBtn')}</button>
        <a href="#" class="text-[13px] font-medium no-underline hover:underline max-sm:text-center" style="color:var(--color-text-muted, #666666)">${t('settings.cancelAction')}</a>
      </div>
    </div>
  `;
}

// ── Component Export ─────────────────────────────────────────────

export function SettingsAccountEdit(): string {
  const data = readAccountData();
  return `<div id="acc-edit-root">${renderViewMode(data)}${renderEditMode(data)}</div>`;
}

// ── Init with CRUD ───────────────────────────────────────────────

export function initSettingsAccountEdit(): void {
  const root = document.getElementById('acc-edit-root');
  if (!root) return;

  function rerender() {
    const data = readAccountData();
    root!.innerHTML = renderViewMode(data) + renderEditMode(data);
    bindEvents();
  }

  function collectFormData(): AccountData {
    const current = readAccountData();
    const formEl = document.getElementById('acc-edit-form');
    if (!formEl) return current;

    formEl.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-field]').forEach(el => {
      const field = el.dataset.field as keyof AccountData;
      if (field && field in current) {
        (current as unknown as Record<string, unknown>)[field] = el.value;
      }
    });

    const genderRadio = formEl.querySelector<HTMLInputElement>('input[name="gender"]:checked');
    if (genderRadio) {
      current.gender = genderRadio.value;
    }

    return current;
  }

  function bindEvents() {
    const viewEl = document.getElementById('acc-edit-view');
    const formEl = document.getElementById('acc-edit-form');
    const editBtn = document.getElementById('acc-edit-toggle');
    const submitBtn = document.getElementById('acc-edit-submit');

    if (editBtn && viewEl && formEl) {
      editBtn.addEventListener('click', () => {
        viewEl.style.display = 'none';
        formEl.style.display = '';
      });
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const data = collectFormData();
        saveAccountData(data);
        rerender();
      });
    }
  }

  bindEvents();
}
