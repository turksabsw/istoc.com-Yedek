/**
 * SupplierSetupForm Component
 * Registration form for supplier accounts with business-specific fields:
 * firstName/lastName, businessName, sellerType dropdown, taxId, country dropdown,
 * and password field with requirements display.
 * Used after email verification in the supplier registration flow.
 */

import { t } from '../../i18n';
import {
  type CountryOption,
  type PasswordRequirements,
  countryOptions,
  getCountryByCode,
  validatePassword,
  isPasswordValid,
} from './AccountSetupForm';

/* ── Types ──────────────────────────────────────────── */

export type SellerType = 'individual' | 'business' | 'enterprise';

export interface SupplierSetupFormOptions {
  /** Container element ID */
  containerId?: string;
  /** Pre-selected country code */
  defaultCountry?: string;
  /** Pre-selected seller type */
  defaultSellerType?: SellerType;
  /** Callback when form is submitted */
  onSubmit?: (data: SupplierSetupFormData) => void;
  /** Callback when country changes */
  onCountryChange?: (country: CountryOption) => void;
  /** Callback when seller type changes */
  onSellerTypeChange?: (sellerType: SellerType) => void;
}

export interface SupplierSetupFormData {
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** Business/Company name */
  businessName: string;
  /** Seller type */
  sellerType: SellerType | null;
  /** Tax identification number */
  taxId: string;
  /** Selected country */
  country: CountryOption | null;
  /** Password */
  password: string;
}

export interface SupplierSetupFormState {
  /** Current form data */
  data: SupplierSetupFormData;
  /** Password requirements validation state */
  passwordRequirements: PasswordRequirements;
  /** Whether form is valid */
  isValid: boolean;
}

/* ── Seller Type Options ─────────────────────────────── */

interface SellerTypeOption {
  value: SellerType;
  labelKey: string;
}

const sellerTypeOptions: SellerTypeOption[] = [
  { value: 'individual', labelKey: 'auth.supplierSetup.sellerTypeIndividual' },
  { value: 'business', labelKey: 'auth.supplierSetup.sellerTypeBusiness' },
  { value: 'enterprise', labelKey: 'auth.supplierSetup.sellerTypeEnterprise' },
];

/* ── Render Helpers ─────────────────────────────────── */

/**
 * Renders the country dropdown options for the supplier form
 */
function renderCountryOptions(selectedCode: string): string {
  return countryOptions.map(country => `
    <button
      type="button"
      class="flex items-center gap-2 w-full px-4 py-2.5 text-left text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${country.code === selectedCode ? 'bg-orange-50 dark:bg-orange-900/20' : ''}"
      data-country-code="${country.code}"
      data-country-name="${country.name}"
      data-country-flag="${country.flag}"
      role="option"
      aria-selected="${country.code === selectedCode ? 'true' : 'false'}"
    >
      <span class="text-lg">${country.flag}</span>
      <span>${country.name}</span>
      ${country.code === selectedCode ? `
        <svg class="w-4 h-4 ml-auto text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
      ` : ''}
    </button>
  `).join('');
}

/**
 * Renders the seller type dropdown options
 */
function renderSellerTypeOptions(selectedValue: string): string {
  return sellerTypeOptions.map(option => `
    <button
      type="button"
      class="flex items-center gap-2 w-full px-4 py-2.5 text-left text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${option.value === selectedValue ? 'bg-orange-50 dark:bg-orange-900/20' : ''}"
      data-seller-type="${option.value}"
      role="option"
      aria-selected="${option.value === selectedValue ? 'true' : 'false'}"
    >
      <span>${t(option.labelKey)}</span>
      ${option.value === selectedValue ? `
        <svg class="w-4 h-4 ml-auto text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
        </svg>
      ` : ''}
    </button>
  `).join('');
}

/* ── Component HTML ─────────────────────────────────── */

/**
 * SupplierSetupForm Component
 * Renders the supplier setup form with name, business, seller type, tax ID,
 * country, and password fields
 *
 * @param defaultCountry - Default selected country code (e.g., 'TR')
 * @returns HTML string for the supplier setup form
 */
export function SupplierSetupForm(defaultCountry: string = 'TR'): string {
  const selectedCountry = countryOptions.find(c => c.code === defaultCountry) || countryOptions[0];

  return `
    <div id="supplier-setup-form" class="w-full">
      <!-- Header -->
      <div class="mb-6 text-center lg:text-left">
        <h1 class="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          ${t('auth.supplierSetup.title')}
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          ${t('auth.supplierSetup.subtitle')}
        </p>
      </div>

      <form id="supplier-setup-form-element" class="space-y-5" novalidate>
        <!-- Name Fields (stacked on small screens, side by side on sm+) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- First Name -->
          <div class="auth-form-field relative">
            <label for="supplier-first-name-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5" data-i18n="auth.setup.firstName">
              ${t('auth.setup.firstName')}
            </label>
            <input
              type="text"
              id="supplier-first-name-input"
              name="firstName"
              placeholder="${t('auth.setup.firstNamePlaceholder')}" data-i18n-placeholder="auth.setup.firstNamePlaceholder"
              autocomplete="given-name"
              class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 transition-all"
              required
            />
          </div>

          <!-- Last Name -->
          <div class="auth-form-field relative">
            <label for="supplier-last-name-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5" data-i18n="auth.setup.lastName">
              ${t('auth.setup.lastName')}
            </label>
            <input
              type="text"
              id="supplier-last-name-input"
              name="lastName"
              placeholder="${t('auth.setup.lastNamePlaceholder')}" data-i18n-placeholder="auth.setup.lastNamePlaceholder"
              autocomplete="family-name"
              class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 transition-all"
              required
            />
          </div>
        </div>

        <!-- Business Name -->
        <div class="auth-form-field relative">
          <label for="supplier-business-name-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5" data-i18n="auth.supplierSetup.businessName">
            ${t('auth.supplierSetup.businessName')}
          </label>
          <input
            type="text"
            id="supplier-business-name-input"
            name="businessName"
            placeholder="${t('auth.supplierSetup.businessNamePlaceholder')}" data-i18n-placeholder="auth.supplierSetup.businessNamePlaceholder"
            autocomplete="organization"
            class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 transition-all"
            required
          />
        </div>

        <!-- Seller Type Dropdown -->
        <div class="auth-form-field relative">
          <label for="supplier-seller-type-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5" data-i18n="auth.supplierSetup.sellerType">
            ${t('auth.supplierSetup.sellerType')}
          </label>
          <div class="relative">
            <button
              type="button"
              id="seller-type-select-btn"
              class="flex items-center justify-between w-full px-4 py-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 transition-all"
              aria-haspopup="listbox"
              aria-expanded="false"
              aria-controls="seller-type-dropdown"
            >
              <span id="seller-type-selected-display" class="text-gray-400 dark:text-gray-500">
                ${t('auth.supplierSetup.selectSellerType')}
              </span>
              <svg class="w-5 h-5 text-gray-400 transition-transform" id="seller-type-dropdown-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <input type="hidden" id="seller-type-input" name="sellerType" value="" />

            <!-- Dropdown Panel -->
            <div
              id="seller-type-dropdown"
              class="absolute z-50 hidden w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
              role="listbox"
              aria-label="${t('auth.supplierSetup.selectSellerType')}" data-i18n-aria-label="auth.supplierSetup.selectSellerType"
            >
              ${renderSellerTypeOptions('')}
            </div>
          </div>
        </div>

        <!-- Tax ID -->
        <div class="auth-form-field relative">
          <label for="supplier-tax-id-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5" data-i18n="auth.supplierSetup.taxId">
            ${t('auth.supplierSetup.taxId')}
          </label>
          <input
            type="text"
            id="supplier-tax-id-input"
            name="taxId"
            placeholder="${t('auth.supplierSetup.taxIdPlaceholder')}" data-i18n-placeholder="auth.supplierSetup.taxIdPlaceholder"
            class="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 transition-all"
            required
          />
        </div>

        <!-- Country/Region Dropdown -->
        <div class="auth-form-field relative">
          <label for="supplier-country-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5" data-i18n="auth.setup.countryRegion">
            ${t('auth.setup.countryRegion')}
          </label>
          <div class="relative">
            <button
              type="button"
              id="supplier-country-select-btn"
              class="flex items-center justify-between w-full px-4 py-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 transition-all"
              aria-haspopup="listbox"
              aria-expanded="false"
              aria-controls="supplier-country-dropdown"
            >
              <span id="supplier-country-selected-display" class="flex items-center gap-2">
                <span class="text-lg">${selectedCountry.flag}</span>
                <span>${selectedCountry.name}</span>
              </span>
              <svg class="w-5 h-5 text-gray-400 transition-transform" id="supplier-country-dropdown-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            <input type="hidden" id="supplier-country-input" name="country" value="${selectedCountry.code}" />

            <!-- Dropdown Panel -->
            <div
              id="supplier-country-dropdown"
              class="absolute z-50 hidden w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
              role="listbox"
              aria-label="${t('auth.setup.selectCountry')}" data-i18n-aria-label="auth.setup.selectCountry"
            >
              ${renderCountryOptions(selectedCountry.code)}
            </div>
          </div>
        </div>

        <!-- Password Field -->
        <div class="auth-form-field relative">
          <label for="supplier-password-input" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5" data-i18n="auth.setup.password">
            ${t('auth.setup.password')}
          </label>
          <div class="relative">
            <input
              type="password"
              id="supplier-password-input"
              name="password"
              placeholder="${t('auth.setup.passwordPlaceholder')}" data-i18n-placeholder="auth.setup.passwordPlaceholder"
              autocomplete="new-password"
              class="w-full px-4 py-3 pr-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 transition-all"
              required
            />
            <button
              type="button"
              id="supplier-password-toggle-btn"
              class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="${t('auth.forgot.showHidePassword')}" data-i18n-aria-label="auth.forgot.showHidePassword"
            >
              <!-- Eye icon (show) -->
              <svg id="supplier-password-eye-show" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              <!-- Eye-off icon (hide) - hidden by default -->
              <svg id="supplier-password-eye-hide" class="w-5 h-5 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
              </svg>
            </button>
          </div>

          <!-- Password Requirements -->
          <div id="supplier-password-requirements" class="auth-password-requirements flex flex-col gap-1.5 mt-3">
            <div class="auth-password-req-item flex items-center gap-2 text-[13px] transition-colors" data-requirement="minLength">
              <svg class="auth-password-req-icon shrink-0 w-2 h-2 transition-all" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="3"/>
              </svg>
              <span data-i18n="auth.setup.minChars">${t('auth.setup.minChars')}</span>
            </div>
            <div class="auth-password-req-item flex items-center gap-2 text-[13px] transition-colors" data-requirement="hasUppercase">
              <svg class="auth-password-req-icon shrink-0 w-2 h-2 transition-all" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="3"/>
              </svg>
              <span data-i18n="auth.setup.uppercase">${t('auth.setup.uppercase')}</span>
            </div>
            <div class="auth-password-req-item flex items-center gap-2 text-[13px] transition-colors" data-requirement="hasLowercase">
              <svg class="auth-password-req-icon shrink-0 w-2 h-2 transition-all" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="3"/>
              </svg>
              <span data-i18n="auth.setup.lowercase">${t('auth.setup.lowercase')}</span>
            </div>
            <div class="auth-password-req-item flex items-center gap-2 text-[13px] transition-colors" data-requirement="hasNumber">
              <svg class="auth-password-req-icon shrink-0 w-2 h-2 transition-all" viewBox="0 0 16 16" fill="currentColor">
                <circle cx="8" cy="8" r="3"/>
              </svg>
              <span data-i18n="auth.setup.number">${t('auth.setup.number')}</span>
            </div>
          </div>
        </div>

        <!-- Terms Agreement -->
        <div class="flex items-start gap-3 pt-2">
          <input
            type="checkbox"
            id="supplier-terms-checkbox"
            name="terms"
            class="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-orange-500 focus:ring-orange-500/20 bg-white dark:bg-gray-800"
            required
          />
          <label for="supplier-terms-checkbox" class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            <a href="/pages/legal/terms.html" class="text-orange-600 dark:text-orange-400 hover:underline" data-i18n="auth.setup.termsOfUse">${t('auth.setup.termsOfUse')}</a> ${t('auth.and')}
            <a href="/pages/legal/privacy.html" class="text-orange-600 dark:text-orange-400 hover:underline" data-i18n="auth.setup.privacyPolicy">${t('auth.setup.privacyPolicy')}</a><span data-i18n="auth.setup.agreeTerms">${t('auth.setup.agreeTerms')}</span>
          </label>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          id="supplier-setup-submit-btn"
          class="th-btn th-btn-pill w-full py-3 text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          disabled
        >
          <span data-i18n="auth.supplierSetup.createSupplierAccount">${t('auth.supplierSetup.createSupplierAccount')}</span>
        </button>
      </form>

      <!-- Login Link -->
      <div class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <span data-i18n="auth.register.alreadyHave">${t('auth.register.alreadyHave')}</span>
        <a href="/pages/auth/login.html" class="ml-1 font-medium text-orange-600 dark:text-orange-400 hover:underline">
          <span data-i18n="auth.register.signIn">${t('auth.register.signIn')}</span>
        </a>
      </div>
    </div>
  `;
}

/* ── Helper Functions ────────────────────────────────── */

/**
 * Get the label for a seller type value
 */
function getSellerTypeLabel(value: SellerType): string {
  const option = sellerTypeOptions.find(o => o.value === value);
  return option ? t(option.labelKey) : '';
}

/* ── Init Logic ──────────────────────────────────────── */

/**
 * Initialize SupplierSetupForm interactivity
 * Sets up form validation, password requirements, country dropdown,
 * seller type dropdown, and all input handlers
 */
export function initSupplierSetupForm(options: SupplierSetupFormOptions = {}): SupplierSetupFormState {
  const { defaultCountry = 'TR', defaultSellerType, onSubmit, onCountryChange, onSellerTypeChange } = options;

  // Initialize state
  const state: SupplierSetupFormState = {
    data: {
      firstName: '',
      lastName: '',
      businessName: '',
      sellerType: defaultSellerType || null,
      taxId: '',
      country: getCountryByCode(defaultCountry) || countryOptions[0],
      password: '',
    },
    passwordRequirements: {
      minLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasNumber: false,
    },
    isValid: false,
  };

  const container = document.getElementById('supplier-setup-form');
  if (!container) return state;

  // Get form elements
  const form = document.getElementById('supplier-setup-form-element') as HTMLFormElement | null;
  const firstNameInput = document.getElementById('supplier-first-name-input') as HTMLInputElement | null;
  const lastNameInput = document.getElementById('supplier-last-name-input') as HTMLInputElement | null;
  const businessNameInput = document.getElementById('supplier-business-name-input') as HTMLInputElement | null;
  const taxIdInput = document.getElementById('supplier-tax-id-input') as HTMLInputElement | null;
  const countryBtn = document.getElementById('supplier-country-select-btn');
  const countryDropdown = document.getElementById('supplier-country-dropdown');
  const countryInput = document.getElementById('supplier-country-input') as HTMLInputElement | null;
  const countryDisplay = document.getElementById('supplier-country-selected-display');
  const countryDropdownIcon = document.getElementById('supplier-country-dropdown-icon');
  const sellerTypeBtn = document.getElementById('seller-type-select-btn');
  const sellerTypeDropdown = document.getElementById('seller-type-dropdown');
  const sellerTypeInput = document.getElementById('seller-type-input') as HTMLInputElement | null;
  const sellerTypeDisplay = document.getElementById('seller-type-selected-display');
  const sellerTypeDropdownIcon = document.getElementById('seller-type-dropdown-icon');
  const passwordInput = document.getElementById('supplier-password-input') as HTMLInputElement | null;
  const passwordToggleBtn = document.getElementById('supplier-password-toggle-btn');
  const passwordEyeShow = document.getElementById('supplier-password-eye-show');
  const passwordEyeHide = document.getElementById('supplier-password-eye-hide');
  const termsCheckbox = document.getElementById('supplier-terms-checkbox') as HTMLInputElement | null;
  const submitBtn = document.getElementById('supplier-setup-submit-btn') as HTMLButtonElement | null;
  const requirementsContainer = document.getElementById('supplier-password-requirements');

  // ── Country Dropdown Handlers ──

  if (countryBtn && countryDropdown) {
    // Toggle dropdown
    countryBtn.addEventListener('click', () => {
      const isOpen = !countryDropdown.classList.contains('hidden');
      toggleCountryDropdown(!isOpen);
    });

    // Handle country selection
    countryDropdown.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const button = target.closest('[data-country-code]') as HTMLElement | null;

      if (button) {
        const code = button.getAttribute('data-country-code') || '';
        const name = button.getAttribute('data-country-name') || '';
        const flag = button.getAttribute('data-country-flag') || '';

        state.data.country = { code, name, flag };

        // Update display
        if (countryDisplay) {
          countryDisplay.innerHTML = `
            <span class="text-lg">${flag}</span>
            <span>${name}</span>
          `;
        }

        // Update hidden input
        if (countryInput) {
          countryInput.value = code;
        }

        // Update dropdown options (highlight selected)
        countryDropdown.innerHTML = renderCountryOptions(code);

        // Close dropdown
        toggleCountryDropdown(false);

        // Callback
        if (onCountryChange) {
          onCountryChange(state.data.country);
        }

        // Re-validate form
        updateFormValidity();
      }
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!countryBtn.contains(target) && !countryDropdown.contains(target)) {
        toggleCountryDropdown(false);
      }
    });

    // Close dropdown on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !countryDropdown.classList.contains('hidden')) {
        toggleCountryDropdown(false);
        countryBtn.focus();
      }
    });
  }

  function toggleCountryDropdown(open: boolean): void {
    if (!countryDropdown || !countryBtn || !countryDropdownIcon) return;

    if (open) {
      countryDropdown.classList.remove('hidden');
      countryBtn.setAttribute('aria-expanded', 'true');
      countryDropdownIcon.classList.add('rotate-180');
      // Close seller type dropdown if open
      toggleSellerTypeDropdown(false);
    } else {
      countryDropdown.classList.add('hidden');
      countryBtn.setAttribute('aria-expanded', 'false');
      countryDropdownIcon.classList.remove('rotate-180');
    }
  }

  // ── Seller Type Dropdown Handlers ──

  if (sellerTypeBtn && sellerTypeDropdown) {
    // Toggle dropdown
    sellerTypeBtn.addEventListener('click', () => {
      const isOpen = !sellerTypeDropdown.classList.contains('hidden');
      toggleSellerTypeDropdown(!isOpen);
    });

    // Handle seller type selection
    sellerTypeDropdown.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const button = target.closest('[data-seller-type]') as HTMLElement | null;

      if (button) {
        const value = button.getAttribute('data-seller-type') as SellerType;

        state.data.sellerType = value;

        // Update display
        if (sellerTypeDisplay) {
          sellerTypeDisplay.textContent = getSellerTypeLabel(value);
          sellerTypeDisplay.classList.remove('text-gray-400', 'dark:text-gray-500');
          sellerTypeDisplay.classList.add('text-gray-900', 'dark:text-white');
        }

        // Update hidden input
        if (sellerTypeInput) {
          sellerTypeInput.value = value;
        }

        // Update dropdown options (highlight selected)
        sellerTypeDropdown.innerHTML = renderSellerTypeOptions(value);

        // Close dropdown
        toggleSellerTypeDropdown(false);

        // Callback
        if (onSellerTypeChange) {
          onSellerTypeChange(value);
        }

        // Re-validate form
        updateFormValidity();
      }
    });

    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (!sellerTypeBtn.contains(target) && !sellerTypeDropdown.contains(target)) {
        toggleSellerTypeDropdown(false);
      }
    });

    // Close dropdown on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !sellerTypeDropdown.classList.contains('hidden')) {
        toggleSellerTypeDropdown(false);
        sellerTypeBtn.focus();
      }
    });
  }

  // Set initial seller type if provided
  if (defaultSellerType && sellerTypeDisplay && sellerTypeInput) {
    sellerTypeDisplay.textContent = getSellerTypeLabel(defaultSellerType);
    sellerTypeDisplay.classList.remove('text-gray-400', 'dark:text-gray-500');
    sellerTypeDisplay.classList.add('text-gray-900', 'dark:text-white');
    sellerTypeInput.value = defaultSellerType;
    if (sellerTypeDropdown) {
      sellerTypeDropdown.innerHTML = renderSellerTypeOptions(defaultSellerType);
    }
  }

  function toggleSellerTypeDropdown(open: boolean): void {
    if (!sellerTypeDropdown || !sellerTypeBtn || !sellerTypeDropdownIcon) return;

    if (open) {
      sellerTypeDropdown.classList.remove('hidden');
      sellerTypeBtn.setAttribute('aria-expanded', 'true');
      sellerTypeDropdownIcon.classList.add('rotate-180');
      // Close country dropdown if open
      toggleCountryDropdown(false);
    } else {
      sellerTypeDropdown.classList.add('hidden');
      sellerTypeBtn.setAttribute('aria-expanded', 'false');
      sellerTypeDropdownIcon.classList.remove('rotate-180');
    }
  }

  // ── Name Input Handlers ──

  if (firstNameInput) {
    firstNameInput.addEventListener('input', () => {
      state.data.firstName = firstNameInput.value.trim();
      updateFormValidity();
    });
  }

  if (lastNameInput) {
    lastNameInput.addEventListener('input', () => {
      state.data.lastName = lastNameInput.value.trim();
      updateFormValidity();
    });
  }

  // ── Business Name Input Handler ──

  if (businessNameInput) {
    businessNameInput.addEventListener('input', () => {
      state.data.businessName = businessNameInput.value.trim();
      updateFormValidity();
    });
  }

  // ── Tax ID Input Handler ──

  if (taxIdInput) {
    taxIdInput.addEventListener('input', () => {
      state.data.taxId = taxIdInput.value.trim();
      updateFormValidity();
    });
  }

  // ── Password Input Handler ──

  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      state.data.password = passwordInput.value;
      state.passwordRequirements = validatePassword(passwordInput.value);
      updatePasswordRequirementsUI();
      updateFormValidity();
    });
  }

  // ── Password Toggle Visibility ──

  if (passwordToggleBtn && passwordInput && passwordEyeShow && passwordEyeHide) {
    passwordToggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      passwordEyeShow.classList.toggle('hidden', !isPassword);
      passwordEyeHide.classList.toggle('hidden', isPassword);
    });
  }

  // ── Terms Checkbox Handler ──

  if (termsCheckbox) {
    termsCheckbox.addEventListener('change', () => {
      updateFormValidity();
    });
  }

  // ── Form Submission ──

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (state.isValid && onSubmit) {
        onSubmit(state.data);
      }
    });
  }

  // ── UI Update Functions ──

  function updatePasswordRequirementsUI(): void {
    if (!requirementsContainer) return;

    const requirements = state.passwordRequirements;

    Object.entries(requirements).forEach(([key, isValid]) => {
      const item = requirementsContainer.querySelector(`[data-requirement="${key}"]`);
      if (item) {
        item.classList.remove('valid', 'invalid');
        if (state.data.password.length > 0) {
          item.classList.add(isValid ? 'valid' : 'invalid');
        }
      }
    });
  }

  function updateFormValidity(): void {
    const hasValidPassword = isPasswordValid(state.passwordRequirements);
    const hasFirstName = state.data.firstName.length > 0;
    const hasLastName = state.data.lastName.length > 0;
    const hasBusinessName = state.data.businessName.length > 0;
    const hasSellerType = state.data.sellerType !== null;
    const hasTaxId = state.data.taxId.length > 0;
    const hasCountry = state.data.country !== null;
    const hasAcceptedTerms = termsCheckbox?.checked ?? false;

    state.isValid = hasValidPassword && hasFirstName && hasLastName &&
      hasBusinessName && hasSellerType && hasTaxId && hasCountry && hasAcceptedTerms;

    if (submitBtn) {
      submitBtn.disabled = !state.isValid;
    }
  }

  return state;
}

/**
 * Get current supplier form data
 */
export function getSupplierSetupFormData(): SupplierSetupFormData | null {
  const container = document.getElementById('supplier-setup-form');
  if (!container) return null;

  const firstNameInput = document.getElementById('supplier-first-name-input') as HTMLInputElement | null;
  const lastNameInput = document.getElementById('supplier-last-name-input') as HTMLInputElement | null;
  const businessNameInput = document.getElementById('supplier-business-name-input') as HTMLInputElement | null;
  const sellerTypeInput = document.getElementById('seller-type-input') as HTMLInputElement | null;
  const taxIdInput = document.getElementById('supplier-tax-id-input') as HTMLInputElement | null;
  const countryInput = document.getElementById('supplier-country-input') as HTMLInputElement | null;
  const passwordInput = document.getElementById('supplier-password-input') as HTMLInputElement | null;

  const countryCode = countryInput?.value || 'TR';
  const country = getCountryByCode(countryCode) || countryOptions[0];
  const sellerTypeValue = sellerTypeInput?.value as SellerType | '' || '';

  return {
    firstName: firstNameInput?.value.trim() || '',
    lastName: lastNameInput?.value.trim() || '',
    businessName: businessNameInput?.value.trim() || '',
    sellerType: sellerTypeValue ? sellerTypeValue as SellerType : null,
    taxId: taxIdInput?.value.trim() || '',
    country,
    password: passwordInput?.value || '',
  };
}

/**
 * Reset the supplier form to initial state
 */
export function resetSupplierSetupForm(): void {
  const form = document.getElementById('supplier-setup-form-element') as HTMLFormElement | null;
  if (form) {
    form.reset();
  }

  // Reset seller type display
  const sellerTypeDisplay = document.getElementById('seller-type-selected-display');
  if (sellerTypeDisplay) {
    sellerTypeDisplay.textContent = t('auth.supplierSetup.selectSellerType');
    sellerTypeDisplay.classList.add('text-gray-400', 'dark:text-gray-500');
    sellerTypeDisplay.classList.remove('text-gray-900', 'dark:text-white');
  }

  // Reset password requirements UI
  const requirementsContainer = document.getElementById('supplier-password-requirements');
  if (requirementsContainer) {
    requirementsContainer.querySelectorAll('.auth-password-req-item').forEach(item => {
      item.classList.remove('valid', 'invalid');
    });
  }

  // Reset submit button
  const submitBtn = document.getElementById('supplier-setup-submit-btn') as HTMLButtonElement | null;
  if (submitBtn) {
    submitBtn.disabled = true;
  }
}
