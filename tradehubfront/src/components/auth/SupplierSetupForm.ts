/**
 * SupplierSetupForm Component — Multi-Step (4 adım)
 * Adım 1: Temel Bilgiler  (ad, soyad, işletme, satıcı türü, ülke)
 * Adım 2: Vergi & İletişim (vergi türü, vergi no, vergi dairesi, tel, adres, şehir)
 * Adım 3: Banka Bilgileri  (banka adı, IBAN, hesap sahibi)
 * Adım 4: Kimlik & Şifre   (belge türü, belge no, son geçerlilik, dosya, şifre, şartlar)
 */

import { t } from '../../i18n';
import {
  type CountryOption,
  type PasswordRequirements,
  validatePassword,
  isPasswordValid,
} from './AccountSetupForm';

/* ── Types ──────────────────────────────────────────── */

export type SellerType = 'individual' | 'business' | 'enterprise';
export type TaxIdType = 'TCKN' | 'VKN';
export type IdentityDocumentType = 'national_id' | 'passport' | 'drivers_license';

export interface SupplierSetupFormOptions {
  containerId?: string;
  defaultCountry?: string;
  defaultSellerType?: SellerType;
  onSubmit?: (data: SupplierSetupFormData) => void;
  onCountryChange?: (country: CountryOption) => void;
  onSellerTypeChange?: (sellerType: SellerType) => void;
}

export interface SupplierSetupFormData {
  // Step 1: Temel Bilgiler
  firstName: string;
  lastName: string;
  businessName: string;
  sellerType: SellerType | null;
  country: CountryOption | null;
  // Step 2: Vergi & İletişim
  taxIdType: TaxIdType;
  taxId: string;
  taxOffice: string;
  contactPhone: string;
  addressLine1: string;
  city: string;
  // Step 3: Banka
  bankName: string;
  iban: string;
  accountHolderName: string;
  // Step 4: Kimlik & Şifre
  identityDocumentType: IdentityDocumentType | null;
  documentNumber: string;
  documentExpiryDate: string;
  identityDocumentAttachment: File | null;
  password: string;
}

export interface SupplierSetupFormState {
  data: SupplierSetupFormData;
  passwordRequirements: PasswordRequirements;
  currentStep: 1 | 2 | 3 | 4;
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

/* ── Step Progress Indicator ─────────────────────────── */

function renderStepIndicator(activeStep: number): string {
  const steps = [
    t('auth.supplierSetup.step1Label'),
    t('auth.supplierSetup.step2Label'),
    t('auth.supplierSetup.step3Label'),
    t('auth.supplierSetup.step4Label'),
  ];

  return `
    <div class="flex items-center w-full mb-8">
      ${steps.map((label, idx) => {
        const step = idx + 1;
        const isActive = step === activeStep;
        const isDone = step < activeStep;
        const circleClass = isDone
          ? 'bg-orange-500 text-white'
          : isActive
            ? 'bg-orange-500 text-white ring-4 ring-orange-100 dark:ring-orange-900/30'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400';
        const lineClass = isDone
          ? 'bg-orange-500'
          : 'bg-gray-200 dark:bg-gray-700';

        return `
          <div class="flex flex-col items-center ${idx < steps.length - 1 ? 'flex-1' : ''}">
            <div class="flex items-center w-full">
              <div class="flex flex-col items-center">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${circleClass}">
                  ${isDone ? `
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  ` : step}
                </div>
              </div>
              ${idx < steps.length - 1 ? `<div class="flex-1 h-0.5 mx-2 transition-all ${lineClass}"></div>` : ''}
            </div>
            <span class="mt-1.5 text-[10px] font-medium ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-500'} hidden sm:block">${label}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/* ── Input / Label CSS Classes ─────────────────────── */

const INPUT_CLS = 'w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 transition-all';
const LABEL_CLS = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';
const SELECT_CLS = 'w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 transition-all';

/* ── Component HTML ─────────────────────────────────── */

export function SupplierSetupForm(_defaultCountry: string = 'TR'): string {
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

      <!-- Step Indicator -->
      <div id="supplier-step-indicator">
        ${renderStepIndicator(1)}
      </div>

      <!-- Error Message -->
      <div id="supplier-step-error" class="hidden mb-4 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800"></div>

      <form id="supplier-setup-form-element" novalidate>

        <!-- ═══ STEP 1: Temel Bilgiler ═══ -->
        <div id="supplier-step-1" class="supplier-form-step space-y-4">
          <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold mb-4">
            ${t('auth.supplierSetup.step1Label')}
          </p>

          <!-- Ad / Soyad -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="auth-form-field">
              <label for="s-first-name" class="${LABEL_CLS}">${t('auth.setup.firstName')} <span class="text-red-500">*</span></label>
              <input type="text" id="s-first-name" name="firstName" autocomplete="given-name"
                placeholder="${t('auth.setup.firstNamePlaceholder')}"
                class="${INPUT_CLS}" required />
            </div>
            <div class="auth-form-field">
              <label for="s-last-name" class="${LABEL_CLS}">${t('auth.setup.lastName')} <span class="text-red-500">*</span></label>
              <input type="text" id="s-last-name" name="lastName" autocomplete="family-name"
                placeholder="${t('auth.setup.lastNamePlaceholder')}"
                class="${INPUT_CLS}" required />
            </div>
          </div>

          <!-- İşletme Adı -->
          <div class="auth-form-field">
            <label for="s-business-name" class="${LABEL_CLS}">${t('auth.supplierSetup.businessName')} <span class="text-red-500">*</span></label>
            <input type="text" id="s-business-name" name="businessName" autocomplete="organization"
              placeholder="${t('auth.supplierSetup.businessNamePlaceholder')}"
              class="${INPUT_CLS}" required />
          </div>

          <!-- Satıcı Türü -->
          <div class="auth-form-field">
            <label class="${LABEL_CLS}">${t('auth.supplierSetup.sellerType')} <span class="text-red-500">*</span></label>
            <div class="relative">
              <button type="button" id="s-seller-type-btn"
                class="flex items-center justify-between w-full px-4 py-3 text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 transition-all"
                aria-haspopup="listbox" aria-expanded="false" aria-controls="s-seller-type-dropdown">
                <span id="s-seller-type-display" class="text-gray-400 dark:text-gray-500">${t('auth.supplierSetup.selectSellerType')}</span>
                <svg class="w-5 h-5 text-gray-400 transition-transform" id="s-seller-type-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>
              <input type="hidden" id="s-seller-type-input" name="sellerType" value="" />
              <div id="s-seller-type-dropdown"
                class="absolute z-50 hidden w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
                role="listbox">
                ${renderSellerTypeOptions('')}
              </div>
            </div>
          </div>

          <!-- Ülke / Bölge -->
          <div class="auth-form-field">
            <label for="s-country-select" class="${LABEL_CLS}">${t('auth.setup.countryRegion')} <span class="text-red-500">*</span></label>
            <select id="s-country-select" name="country" class="${SELECT_CLS}" required>
              <option value="" disabled selected>Yükleniyor...</option>
            </select>
          </div>

          <!-- Next Button -->
          <div class="flex justify-end pt-4">
            <button type="button" id="s-next-1"
              class="th-btn th-btn-pill px-8 py-3 text-base font-semibold transition-all">
              ${t('auth.supplierSetup.next')} →
            </button>
          </div>
        </div>

        <!-- ═══ STEP 2: Vergi & İletişim ═══ -->
        <div id="supplier-step-2" class="supplier-form-step hidden space-y-4">
          <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold mb-4">
            ${t('auth.supplierSetup.step2Label')}
          </p>

          <!-- Vergi Kimlik Türü + Vergi No -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="auth-form-field">
              <label for="s-tax-id-type" class="${LABEL_CLS}">${t('auth.supplierSetup.taxIdType')} <span class="text-red-500">*</span></label>
              <select id="s-tax-id-type" name="taxIdType" class="${SELECT_CLS}" required>
                <option value="TCKN">TCKN (T.C. Kimlik No)</option>
                <option value="VKN">VKN (Vergi Kimlik No)</option>
              </select>
            </div>
            <div class="auth-form-field">
              <label for="s-tax-id" class="${LABEL_CLS}">${t('auth.supplierSetup.taxId')} <span class="text-red-500">*</span></label>
              <input type="text" id="s-tax-id" name="taxId"
                placeholder="${t('auth.supplierSetup.taxIdPlaceholder')}"
                class="${INPUT_CLS}" required />
            </div>
          </div>

          <!-- Vergi Dairesi -->
          <div class="auth-form-field">
            <label for="s-tax-office" class="${LABEL_CLS}">${t('auth.supplierSetup.taxOffice')} <span class="text-red-500">*</span></label>
            <input type="text" id="s-tax-office" name="taxOffice"
              placeholder="${t('auth.supplierSetup.taxOfficePlaceholder')}"
              class="${INPUT_CLS}" required />
          </div>

          <!-- İletişim Telefonu -->
          <div class="auth-form-field">
            <label for="s-contact-phone" class="${LABEL_CLS}">${t('auth.supplierSetup.contactPhone')} <span class="text-red-500">*</span></label>
            <input type="tel" id="s-contact-phone" name="contactPhone" autocomplete="tel"
              placeholder="${t('auth.supplierSetup.contactPhonePlaceholder')}"
              class="${INPUT_CLS}" required />
          </div>

          <!-- Adres -->
          <div class="auth-form-field">
            <label for="s-address-line1" class="${LABEL_CLS}">${t('auth.supplierSetup.addressLine1')} <span class="text-red-500">*</span></label>
            <input type="text" id="s-address-line1" name="addressLine1" autocomplete="address-line1"
              placeholder="${t('auth.supplierSetup.addressLine1Placeholder')}"
              class="${INPUT_CLS}" required />
          </div>

          <!-- Şehir -->
          <div class="auth-form-field">
            <label for="s-city" class="${LABEL_CLS}">${t('auth.supplierSetup.city')} <span class="text-red-500">*</span></label>
            <input type="text" id="s-city" name="city" autocomplete="address-level2"
              placeholder="${t('auth.supplierSetup.cityPlaceholder')}"
              class="${INPUT_CLS}" required />
          </div>

          <!-- Navigation -->
          <div class="flex justify-between pt-4">
            <button type="button" id="s-back-2"
              class="px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              ← ${t('auth.supplierSetup.back')}
            </button>
            <button type="button" id="s-next-2"
              class="th-btn th-btn-pill px-8 py-3 text-base font-semibold transition-all">
              ${t('auth.supplierSetup.next')} →
            </button>
          </div>
        </div>

        <!-- ═══ STEP 3: Banka Bilgileri ═══ -->
        <div id="supplier-step-3" class="supplier-form-step hidden space-y-4">
          <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold mb-4">
            ${t('auth.supplierSetup.step3Label')}
          </p>

          <!-- Banka Adı -->
          <div class="auth-form-field">
            <label for="s-bank-name" class="${LABEL_CLS}">${t('auth.supplierSetup.bankName')} <span class="text-red-500">*</span></label>
            <input type="text" id="s-bank-name" name="bankName"
              placeholder="${t('auth.supplierSetup.bankNamePlaceholder')}"
              class="${INPUT_CLS}" required />
          </div>

          <!-- IBAN -->
          <div class="auth-form-field">
            <label for="s-iban" class="${LABEL_CLS}">${t('auth.supplierSetup.iban')} <span class="text-red-500">*</span></label>
            <input type="text" id="s-iban" name="iban"
              placeholder="${t('auth.supplierSetup.ibanPlaceholder')}"
              class="${INPUT_CLS} font-mono" required />
          </div>

          <!-- Hesap Sahibi -->
          <div class="auth-form-field">
            <label for="s-account-holder" class="${LABEL_CLS}">${t('auth.supplierSetup.accountHolderName')} <span class="text-red-500">*</span></label>
            <input type="text" id="s-account-holder" name="accountHolderName"
              placeholder="${t('auth.supplierSetup.accountHolderNamePlaceholder')}"
              class="${INPUT_CLS}" required />
          </div>

          <!-- Navigation -->
          <div class="flex justify-between pt-4">
            <button type="button" id="s-back-3"
              class="px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              ← ${t('auth.supplierSetup.back')}
            </button>
            <button type="button" id="s-next-3"
              class="th-btn th-btn-pill px-8 py-3 text-base font-semibold transition-all">
              ${t('auth.supplierSetup.next')} →
            </button>
          </div>
        </div>

        <!-- ═══ STEP 4: Kimlik & Şifre ═══ -->
        <div id="supplier-step-4" class="supplier-form-step hidden space-y-4">
          <p class="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold mb-4">
            ${t('auth.supplierSetup.step4Label')}
          </p>

          <!-- Kimlik Belgesi Türü -->
          <div class="auth-form-field">
            <label for="s-identity-doc-type" class="${LABEL_CLS}">${t('auth.supplierSetup.identityDocumentType')} <span class="text-red-500">*</span></label>
            <select id="s-identity-doc-type" name="identityDocumentType" class="${SELECT_CLS}" required>
              <option value="">${t('auth.supplierSetup.selectIdentityDocumentType')}</option>
              <option value="national_id">${t('auth.supplierSetup.identityDocTypeNationalId')}</option>
              <option value="passport">${t('auth.supplierSetup.identityDocTypePassport')}</option>
              <option value="drivers_license">${t('auth.supplierSetup.identityDocTypeDriversLicense')}</option>
            </select>
          </div>

          <!-- Belge No + Son Geçerlilik -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="auth-form-field">
              <label for="s-doc-number" class="${LABEL_CLS}">${t('auth.supplierSetup.documentNumber')} <span class="text-red-500">*</span></label>
              <input type="text" id="s-doc-number" name="documentNumber"
                placeholder="${t('auth.supplierSetup.documentNumberPlaceholder')}"
                class="${INPUT_CLS}" required />
            </div>
            <div class="auth-form-field">
              <label for="s-doc-expiry" class="${LABEL_CLS}">${t('auth.supplierSetup.documentExpiryDate')} <span class="text-red-500">*</span></label>
              <input type="date" id="s-doc-expiry" name="documentExpiryDate"
                class="${INPUT_CLS}" required />
            </div>
          </div>

          <!-- Kimlik Belgesi Yükleme -->
          <div class="auth-form-field">
            <label class="${LABEL_CLS}">${t('auth.supplierSetup.identityDocumentAttachment')} <span class="text-red-500">*</span></label>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">${t('auth.supplierSetup.identityDocumentAttachmentDesc')}</p>
            <label for="s-identity-doc-file"
              class="flex items-center gap-3 w-full px-4 py-3 bg-white dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-md cursor-pointer hover:border-orange-500 dark:hover:border-orange-400 transition-all">
              <svg class="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/>
              </svg>
              <span id="s-identity-doc-display" class="text-sm text-gray-400 dark:text-gray-500">
                ${t('auth.supplierSetup.identityDocumentAttachmentBtn')}
              </span>
            </label>
            <input type="file" id="s-identity-doc-file" name="identityDocumentAttachment"
              accept="image/*,.pdf" class="sr-only" required />
          </div>

          <!-- Şifre -->
          <div class="auth-form-field">
            <label for="s-password" class="${LABEL_CLS}">${t('auth.setup.password')} <span class="text-red-500">*</span></label>
            <div class="relative">
              <input type="password" id="s-password" name="password" autocomplete="new-password"
                placeholder="${t('auth.setup.passwordPlaceholder')}"
                class="${INPUT_CLS} pr-12" required />
              <button type="button" id="s-password-toggle"
                class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <svg id="s-pw-eye-show" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                <svg id="s-pw-eye-hide" class="w-5 h-5 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
              </button>
            </div>
            <div id="s-pw-requirements" class="auth-password-requirements flex flex-col gap-1.5 mt-3">
              <div class="auth-password-req-item flex items-center gap-2 text-[13px] transition-colors" data-requirement="minLength">
                <svg class="auth-password-req-icon shrink-0 w-2 h-2" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="3"/></svg>
                <span>${t('auth.setup.minChars')}</span>
              </div>
              <div class="auth-password-req-item flex items-center gap-2 text-[13px] transition-colors" data-requirement="hasUppercase">
                <svg class="auth-password-req-icon shrink-0 w-2 h-2" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="3"/></svg>
                <span>${t('auth.setup.uppercase')}</span>
              </div>
              <div class="auth-password-req-item flex items-center gap-2 text-[13px] transition-colors" data-requirement="hasLowercase">
                <svg class="auth-password-req-icon shrink-0 w-2 h-2" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="3"/></svg>
                <span>${t('auth.setup.lowercase')}</span>
              </div>
              <div class="auth-password-req-item flex items-center gap-2 text-[13px] transition-colors" data-requirement="hasNumber">
                <svg class="auth-password-req-icon shrink-0 w-2 h-2" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="3"/></svg>
                <span>${t('auth.setup.number')}</span>
              </div>
            </div>
          </div>

          <!-- Şartlar -->
          <div class="flex items-start gap-3 pt-2">
            <input type="checkbox" id="s-terms" name="terms"
              class="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-orange-500 focus:ring-orange-500/20 bg-white dark:bg-gray-800" required />
            <label for="s-terms" class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              <a href="/pages/legal/terms.html" class="text-orange-600 dark:text-orange-400 hover:underline">${t('auth.setup.termsOfUse')}</a>
              ${t('auth.and')}
              <a href="/pages/legal/privacy.html" class="text-orange-600 dark:text-orange-400 hover:underline">${t('auth.setup.privacyPolicy')}</a><span>${t('auth.setup.agreeTerms')}</span>
            </label>
          </div>

          <!-- Navigation -->
          <div class="flex justify-between pt-4">
            <button type="button" id="s-back-4"
              class="px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              ← ${t('auth.supplierSetup.back')}
            </button>
            <button type="submit" id="supplier-setup-submit-btn"
              class="th-btn th-btn-pill px-8 py-3 text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled>
              <span>${t('auth.supplierSetup.createSupplierAccount')}</span>
            </button>
          </div>
        </div>

      </form>

      <!-- Login Link -->
      <div class="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <span>${t('auth.register.alreadyHave')}</span>
        <a href="/pages/auth/login.html" class="ml-1 font-medium text-orange-600 dark:text-orange-400 hover:underline">
          <span>${t('auth.register.signIn')}</span>
        </a>
      </div>
    </div>
  `;
}

/* ── Helper Functions ────────────────────────────────── */

function getSellerTypeLabel(value: SellerType): string {
  const option = sellerTypeOptions.find(o => o.value === value);
  return option ? t(option.labelKey) : '';
}

/* ── Step Validation ─────────────────────────────────── */

function validateStep1(state: SupplierSetupFormState): string | null {
  if (!state.data.firstName) return t('auth.supplierSetup.step1Label') + ': ' + t('auth.setup.firstName') + ' ' + t('auth.supplierSetup.required');
  if (!state.data.lastName) return t('auth.supplierSetup.step1Label') + ': ' + t('auth.setup.lastName') + ' ' + t('auth.supplierSetup.required');
  if (!state.data.businessName) return t('auth.supplierSetup.businessName') + ' ' + t('auth.supplierSetup.required');
  if (!state.data.sellerType) return t('auth.supplierSetup.sellerType') + ' ' + t('auth.supplierSetup.required');
  if (!state.data.country) return t('auth.setup.countryRegion') + ' ' + t('auth.supplierSetup.required');
  return null;
}

function validateStep2(state: SupplierSetupFormState): string | null {
  if (!state.data.taxId) return t('auth.supplierSetup.taxId') + ' ' + t('auth.supplierSetup.required');
  if (!state.data.taxOffice) return t('auth.supplierSetup.taxOffice') + ' ' + t('auth.supplierSetup.required');
  if (!state.data.contactPhone) return t('auth.supplierSetup.contactPhone') + ' ' + t('auth.supplierSetup.required');
  if (!state.data.addressLine1) return t('auth.supplierSetup.addressLine1') + ' ' + t('auth.supplierSetup.required');
  if (!state.data.city) return t('auth.supplierSetup.city') + ' ' + t('auth.supplierSetup.required');
  return null;
}

function validateStep3(state: SupplierSetupFormState): string | null {
  if (!state.data.bankName) return t('auth.supplierSetup.bankName') + ' ' + t('auth.supplierSetup.required');
  if (!state.data.iban) return t('auth.supplierSetup.iban') + ' ' + t('auth.supplierSetup.required');
  if (!state.data.accountHolderName) return t('auth.supplierSetup.accountHolderName') + ' ' + t('auth.supplierSetup.required');
  return null;
}

function validateStep4(state: SupplierSetupFormState, termsChecked: boolean): string | null {
  if (!state.data.identityDocumentType) return t('auth.supplierSetup.identityDocumentType') + ' ' + t('auth.supplierSetup.required');
  if (!state.data.documentNumber) return t('auth.supplierSetup.documentNumber') + ' ' + t('auth.supplierSetup.required');
  if (!state.data.documentExpiryDate) return t('auth.supplierSetup.documentExpiryDate') + ' ' + t('auth.supplierSetup.required');
  if (!state.data.identityDocumentAttachment) return t('auth.supplierSetup.identityDocumentAttachment') + ' ' + t('auth.supplierSetup.required');
  if (!isPasswordValid(state.passwordRequirements)) return t('auth.setup.password') + ' ' + t('auth.supplierSetup.required');
  if (!termsChecked) return t('auth.supplierSetup.termsRequired');
  return null;
}

/* ── Init Logic ──────────────────────────────────────── */

export function initSupplierSetupForm(options: SupplierSetupFormOptions = {}): SupplierSetupFormState {
  const { defaultCountry = 'TR', defaultSellerType, onSubmit } = options;

  const state: SupplierSetupFormState = {
    data: {
      firstName: '', lastName: '', businessName: '',
      sellerType: defaultSellerType || null,
      country: { code: defaultCountry, name: 'Turkey', flag: '' },
      taxIdType: 'TCKN', taxId: '', taxOffice: '',
      contactPhone: '', addressLine1: '', city: '',
      bankName: '', iban: '', accountHolderName: '',
      identityDocumentType: null, documentNumber: '',
      documentExpiryDate: '', identityDocumentAttachment: null,
      password: '',
    },
    passwordRequirements: { minLength: false, hasUppercase: false, hasLowercase: false, hasNumber: false },
    currentStep: 1,
    isValid: false,
  };

  const container = document.getElementById('supplier-setup-form');
  if (!container) return state;

  // ── Step Elements ──
  const steps = [1, 2, 3, 4].map(n => document.getElementById(`supplier-step-${n}`));
  const errorEl = document.getElementById('supplier-step-error');
  const indicatorEl = document.getElementById('supplier-step-indicator');

  function showStep(n: 1 | 2 | 3 | 4): void {
    state.currentStep = n;
    steps.forEach((el, idx) => {
      el?.classList.toggle('hidden', idx + 1 !== n);
    });
    if (indicatorEl) {
      indicatorEl.innerHTML = renderStepIndicator(n);
    }
    clearError();
    // Scroll to top of form
    container?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showError(msg: string): void {
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.remove('hidden');
      errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function clearError(): void {
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
  }

  // ── Seller Type Dropdown ──

  const sellerTypeBtn = document.getElementById('s-seller-type-btn');
  const sellerTypeDropdown = document.getElementById('s-seller-type-dropdown');
  const sellerTypeInput = document.getElementById('s-seller-type-input') as HTMLInputElement | null;
  const sellerTypeDisplay = document.getElementById('s-seller-type-display');
  const sellerTypeIcon = document.getElementById('s-seller-type-icon');

  if (sellerTypeBtn && sellerTypeDropdown) {
    sellerTypeBtn.addEventListener('click', () => toggleSellerTypeDropdown(sellerTypeDropdown.classList.contains('hidden')));

    sellerTypeDropdown.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('[data-seller-type]') as HTMLElement | null;
      if (!btn) return;
      const value = btn.getAttribute('data-seller-type') as SellerType;
      state.data.sellerType = value;
      if (sellerTypeDisplay) {
        sellerTypeDisplay.textContent = getSellerTypeLabel(value);
        sellerTypeDisplay.classList.remove('text-gray-400', 'dark:text-gray-500');
        sellerTypeDisplay.classList.add('text-gray-900', 'dark:text-white');
      }
      if (sellerTypeInput) sellerTypeInput.value = value;
      sellerTypeDropdown.innerHTML = renderSellerTypeOptions(value);
      toggleSellerTypeDropdown(false);
    });

    document.addEventListener('click', (e) => {
      if (!sellerTypeBtn.contains(e.target as Node) && !sellerTypeDropdown.contains(e.target as Node)) {
        toggleSellerTypeDropdown(false);
      }
    });
  }

  function toggleSellerTypeDropdown(open: boolean): void {
    if (!sellerTypeDropdown || !sellerTypeBtn || !sellerTypeIcon) return;
    sellerTypeDropdown.classList.toggle('hidden', !open);
    sellerTypeBtn.setAttribute('aria-expanded', String(open));
    sellerTypeIcon.classList.toggle('rotate-180', open);
  }

  // ── Country Select (Frappe API) ──
  const countrySelect = document.getElementById('s-country-select') as HTMLSelectElement | null;
  if (countrySelect) {
    // Frappe Country DocType'dan ülke listesini çek
    fetch('/api/resource/Country?fields=["name","code"]&order_by=name&limit_page_length=300', {
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
    })
      .then(r => r.json())
      .then((data: { data?: { name: string; code: string }[] }) => {
        const countries = data.data || [];
        countrySelect.innerHTML = countries.map(c =>
          `<option value="${c.code}"${c.code === defaultCountry ? ' selected' : ''}>${c.name}</option>`
        ).join('');
        // State'i API'den gelen Turkey adıyla güncelle
        const selected = countries.find(c => c.code === defaultCountry) || countries[0];
        if (selected) {
          state.data.country = { code: selected.code, name: selected.name, flag: '' };
        }
      })
      .catch(() => {
        countrySelect.innerHTML = '<option value="TR" selected>Turkey</option>';
        state.data.country = { code: 'TR', name: 'Turkey', flag: '' };
      });

    countrySelect.addEventListener('change', () => {
      const selected = countrySelect.options[countrySelect.selectedIndex];
      state.data.country = { code: countrySelect.value, name: selected.text, flag: '' };
      if (options.onCountryChange) options.onCountryChange(state.data.country);
    });
  }

  // ── Step 1 Inputs ──
  bindInput('s-first-name', v => { state.data.firstName = v; });
  bindInput('s-last-name', v => { state.data.lastName = v; });
  bindInput('s-business-name', v => { state.data.businessName = v; });

  // ── Step 2 Inputs ──
  bindInput('s-tax-id-type', v => { state.data.taxIdType = v as TaxIdType; }, 'change');
  bindInput('s-tax-id', v => { state.data.taxId = v; });
  bindInput('s-tax-office', v => { state.data.taxOffice = v; });
  bindInput('s-contact-phone', v => { state.data.contactPhone = v; });
  bindInput('s-address-line1', v => { state.data.addressLine1 = v; });
  bindInput('s-city', v => { state.data.city = v; });

  // ── Step 3 Inputs ──
  bindInput('s-bank-name', v => { state.data.bankName = v; });
  bindInput('s-iban', v => { state.data.iban = v; });
  bindInput('s-account-holder', v => { state.data.accountHolderName = v; });

  // ── Step 4 Inputs ──
  bindInput('s-identity-doc-type', v => { state.data.identityDocumentType = v ? v as IdentityDocumentType : null; }, 'change');
  bindInput('s-doc-number', v => { state.data.documentNumber = v; });
  bindInput('s-doc-expiry', v => { state.data.documentExpiryDate = v; }, 'change');

  // File upload
  const fileInput = document.getElementById('s-identity-doc-file') as HTMLInputElement | null;
  const fileDisplay = document.getElementById('s-identity-doc-display');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0] || null;
      state.data.identityDocumentAttachment = file;
      if (fileDisplay) {
        fileDisplay.textContent = file ? file.name : t('auth.supplierSetup.identityDocumentAttachmentBtn');
        fileDisplay.classList.toggle('text-gray-900', !!file);
        fileDisplay.classList.toggle('dark:text-white', !!file);
        fileDisplay.classList.toggle('text-gray-400', !file);
        fileDisplay.classList.toggle('dark:text-gray-500', !file);
      }
      updateStep4Validity();
    });
  }

  // Password
  const passwordInput = document.getElementById('s-password') as HTMLInputElement | null;
  const pwToggle = document.getElementById('s-password-toggle');
  const pwEyeShow = document.getElementById('s-pw-eye-show');
  const pwEyeHide = document.getElementById('s-pw-eye-hide');
  const pwRequirements = document.getElementById('s-pw-requirements');

  if (passwordInput) {
    passwordInput.addEventListener('input', () => {
      state.data.password = passwordInput.value;
      state.passwordRequirements = validatePassword(passwordInput.value);
      updatePasswordUI();
      updateStep4Validity();
    });
  }

  if (pwToggle && passwordInput && pwEyeShow && pwEyeHide) {
    pwToggle.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      pwEyeShow.classList.toggle('hidden', !isPassword);
      pwEyeHide.classList.toggle('hidden', isPassword);
    });
  }

  // Terms
  const termsCheckbox = document.getElementById('s-terms') as HTMLInputElement | null;
  if (termsCheckbox) {
    termsCheckbox.addEventListener('change', () => updateStep4Validity());
  }

  // Submit button ref
  const submitBtn = document.getElementById('supplier-setup-submit-btn') as HTMLButtonElement | null;

  function updatePasswordUI(): void {
    if (!pwRequirements) return;
    Object.entries(state.passwordRequirements).forEach(([key, isValid]) => {
      const item = pwRequirements.querySelector(`[data-requirement="${key}"]`);
      if (item) {
        item.classList.remove('valid', 'invalid');
        if (state.data.password.length > 0) {
          item.classList.add(isValid ? 'valid' : 'invalid');
        }
      }
    });
  }

  function updateStep4Validity(): void {
    const termsChecked = termsCheckbox?.checked ?? false;
    const error = validateStep4(state, termsChecked);
    state.isValid = !error;
    if (submitBtn) submitBtn.disabled = !state.isValid;
  }

  // ── Step Navigation ──

  // Next: Step 1 → 2
  document.getElementById('s-next-1')?.addEventListener('click', () => {
    const err = validateStep1(state);
    if (err) { showError(err); return; }
    showStep(2);
  });

  // Back: Step 2 → 1
  document.getElementById('s-back-2')?.addEventListener('click', () => showStep(1));

  // Next: Step 2 → 3
  document.getElementById('s-next-2')?.addEventListener('click', () => {
    const err = validateStep2(state);
    if (err) { showError(err); return; }
    showStep(3);
  });

  // Back: Step 3 → 2
  document.getElementById('s-back-3')?.addEventListener('click', () => showStep(2));

  // Next: Step 3 → 4
  document.getElementById('s-next-3')?.addEventListener('click', () => {
    const err = validateStep3(state);
    if (err) { showError(err); return; }
    showStep(4);
  });

  // Back: Step 4 → 3
  document.getElementById('s-back-4')?.addEventListener('click', () => showStep(3));

  // ── Form Submit ──
  const form = document.getElementById('supplier-setup-form-element') as HTMLFormElement | null;
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const termsChecked = termsCheckbox?.checked ?? false;
      const err = validateStep4(state, termsChecked);
      if (err) { showError(err); return; }
      if (onSubmit) onSubmit(state.data);
    });
  }

  return state;
}

/* ── Utility ─────────────────────────────────────────── */

function bindInput(
  id: string,
  setter: (val: string) => void,
  event: string = 'input',
): void {
  const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
  if (!el) return;
  el.addEventListener(event, () => setter(el.value.trim()));
}

/* ── Get / Reset ─────────────────────────────────────── */

export function getSupplierSetupFormData(): SupplierSetupFormData | null {
  const container = document.getElementById('supplier-setup-form');
  if (!container) return null;

  const g = (id: string): string => {
    const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
    return el?.value?.trim() || '';
  };

  const countrySelect = document.getElementById('s-country-select') as HTMLSelectElement | null;
  const countryCode = countrySelect?.value || 'TR';
  const countryName = countrySelect?.options[countrySelect.selectedIndex]?.text || 'Turkey';
  const country: CountryOption = { code: countryCode, name: countryName, flag: '' };
  const sellerTypeVal = g('s-seller-type-input') as SellerType | '';
  const identityDocTypeVal = g('s-identity-doc-type') as IdentityDocumentType | '';
  const fileInput = document.getElementById('s-identity-doc-file') as HTMLInputElement | null;

  return {
    firstName: g('s-first-name'),
    lastName: g('s-last-name'),
    businessName: g('s-business-name'),
    sellerType: sellerTypeVal || null,
    country,
    taxIdType: (g('s-tax-id-type') as TaxIdType) || 'TCKN',
    taxId: g('s-tax-id'),
    taxOffice: g('s-tax-office'),
    contactPhone: g('s-contact-phone'),
    addressLine1: g('s-address-line1'),
    city: g('s-city'),
    bankName: g('s-bank-name'),
    iban: g('s-iban'),
    accountHolderName: g('s-account-holder'),
    identityDocumentType: identityDocTypeVal || null,
    documentNumber: g('s-doc-number'),
    documentExpiryDate: g('s-doc-expiry'),
    identityDocumentAttachment: fileInput?.files?.[0] || null,
    password: (document.getElementById('s-password') as HTMLInputElement | null)?.value || '',
  };
}

export function resetSupplierSetupForm(): void {
  const form = document.getElementById('supplier-setup-form-element') as HTMLFormElement | null;
  if (form) form.reset();

  const sellerTypeDisplay = document.getElementById('s-seller-type-display');
  if (sellerTypeDisplay) {
    sellerTypeDisplay.textContent = t('auth.supplierSetup.selectSellerType');
    sellerTypeDisplay.classList.add('text-gray-400', 'dark:text-gray-500');
    sellerTypeDisplay.classList.remove('text-gray-900', 'dark:text-white');
  }

  const fileDisplay = document.getElementById('s-identity-doc-display');
  if (fileDisplay) {
    fileDisplay.textContent = t('auth.supplierSetup.identityDocumentAttachmentBtn');
    fileDisplay.classList.add('text-gray-400', 'dark:text-gray-500');
    fileDisplay.classList.remove('text-gray-900', 'dark:text-white');
  }

  const pwRequirements = document.getElementById('s-pw-requirements');
  if (pwRequirements) {
    pwRequirements.querySelectorAll('.auth-password-req-item').forEach(item => {
      item.classList.remove('valid', 'invalid');
    });
  }

  const submitBtn = document.getElementById('supplier-setup-submit-btn') as HTMLButtonElement | null;
  if (submitBtn) submitBtn.disabled = true;

  const indicatorEl = document.getElementById('supplier-step-indicator');
  if (indicatorEl) indicatorEl.innerHTML = renderStepIndicator(1);

  // Show step 1, hide others
  [1, 2, 3, 4].forEach(n => {
    const el = document.getElementById(`supplier-step-${n}`);
    el?.classList.toggle('hidden', n !== 1);
  });
}
