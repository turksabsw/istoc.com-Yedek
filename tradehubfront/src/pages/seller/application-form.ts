/**
 * Seller Application Form — Entry Point
 * Full seller application page with form fields matching Seller Application DocType.
 * Protected by auth guard. Submits to POST/PUT /api/resource/Seller Application.
 */

import '../../style.css'
import { initFlowbite } from 'flowbite'
import { t } from '../../i18n'
import { requireAuth } from '../../utils/auth-guard'
import { getSessionUser, type AuthUser } from '../../utils/auth'

/* ── Constants ──────────────────────────────────────── */

const FRAPPE_BASE = 'http://marketplace.local:8000'

const INPUT_CLS =
  'w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 transition-all'

const SELECT_CLS =
  'w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 transition-all'

const LABEL_CLS = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'

const FILE_CLS =
  'block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-600 dark:file:bg-orange-900/20 dark:file:text-orange-400 hover:file:bg-orange-100 dark:hover:file:bg-orange-900/30 cursor-pointer'

const CHECK_CLS =
  'w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-orange-500 focus:ring-orange-500/20 bg-white dark:bg-gray-800'

/* ── State ──────────────────────────────────────────── */

let existingApplicationName: string | null = null

/* ── Frappe API Helpers ─────────────────────────────── */

async function frappeCall(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${FRAPPE_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Frappe-CSRF-Token': 'fetch',
      ...(options.headers as Record<string, string> || {}),
    },
    ...options,
  })
}

async function uploadFile(
  file: File,
  doctype: string,
  docname: string,
  fieldname: string,
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('doctype', doctype)
  formData.append('docname', docname)
  formData.append('fieldname', fieldname)
  formData.append('is_private', '1')

  const res = await fetch(`${FRAPPE_BASE}/api/method/upload_file`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'X-Frappe-CSRF-Token': 'fetch',
    },
    body: formData,
  })

  if (!res.ok) {
    throw new Error(t('sellerApplication.fileUploadFailed'))
  }

  const data = await res.json()
  return data.message?.file_url || ''
}

/* ── Page Init ──────────────────────────────────────── */

requireAuth().then(async (isAuthed) => {
  if (!isAuthed) return

  const user = await getSessionUser()
  if (!user) return

  const appEl = document.querySelector<HTMLDivElement>('#app')!
  appEl.innerHTML = renderPage()

  initFlowbite()

  await loadDraftApplication(user)
  initFormBehavior(user)
})

/* ── Load Existing Draft ────────────────────────────── */

async function loadDraftApplication(user: AuthUser): Promise<void> {
  try {
    const filters = JSON.stringify([['applicant_user', '=', user.email]])
    const fields = JSON.stringify([
      'name', 'business_name', 'seller_type', 'tax_id', 'tax_id_type', 'tax_office',
      'identity_document', 'identity_document_number', 'identity_document_expiry',
      'bank_name', 'bank_branch', 'iban', 'account_holder_name',
      'business_description', 'status',
    ])

    const res = await frappeCall(
      `/api/resource/Seller Application?filters=${encodeURIComponent(filters)}&fields=${encodeURIComponent(fields)}&limit_page_length=1`
    )
    if (!res.ok) return

    const data = await res.json()
    const app = data.data?.[0]
    if (!app) return

    existingApplicationName = app.name

    // Map DocType fields to form element IDs
    const fieldMap: Record<string, string> = {
      'sa-business-name': app.business_name || '',
      'sa-seller-type': app.seller_type || '',
      'sa-tax-id': app.tax_id || '',
      'sa-tax-id-type': app.tax_id_type || '',
      'sa-tax-office': app.tax_office || '',
      'sa-identity-document': app.identity_document || '',
      'sa-identity-doc-number': app.identity_document_number || '',
      'sa-identity-doc-expiry': app.identity_document_expiry || '',
      'sa-bank-name': app.bank_name || '',
      'sa-bank-branch': app.bank_branch || '',
      'sa-iban': app.iban || '',
      'sa-account-holder': app.account_holder_name || '',
      'sa-business-description': app.business_description || '',
    }

    for (const [id, value] of Object.entries(fieldMap)) {
      const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null
      if (el && value) {
        el.value = value
      }
    }
  } catch {
    // Silently fail — user can fill form from scratch
  }
}

/* ── Form Behavior ──────────────────────────────────── */

function initFormBehavior(user: AuthUser): void {
  const form = document.getElementById('seller-application-form') as HTMLFormElement | null
  if (!form) return

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    await handleSubmit(user)
  })

  // Toggle conditional fields based on seller type
  const sellerTypeSelect = document.getElementById('sa-seller-type') as HTMLSelectElement | null
  if (sellerTypeSelect) {
    sellerTypeSelect.addEventListener('change', () => {
      updateConditionalFields(sellerTypeSelect.value)
    })
    // Initialize visibility based on current value
    updateConditionalFields(sellerTypeSelect.value)
  }
}

function updateConditionalFields(sellerType: string): void {
  const businessDocsSection = document.getElementById('sa-business-docs-section')
  if (businessDocsSection) {
    // Business documents are required for Business and Enterprise types
    const showBusinessDocs = sellerType === 'Business' || sellerType === 'Enterprise'
    businessDocsSection.classList.toggle('hidden', !showBusinessDocs)
  }

  const signatureField = document.getElementById('sa-signature-field')
  if (signatureField) {
    // Signature circular is only required for Enterprise type
    signatureField.classList.toggle('hidden', sellerType !== 'Enterprise')
  }
}

/* ── Form Submission ────────────────────────────────── */

async function handleSubmit(user: AuthUser): Promise<void> {
  const submitBtn = document.getElementById('sa-submit-btn') as HTMLButtonElement | null
  const submitText = document.getElementById('sa-submit-text')
  const errorBanner = document.getElementById('sa-error-banner')

  // Clear previous errors
  if (errorBanner) {
    errorBanner.classList.add('hidden')
    errorBanner.textContent = ''
  }

  // Show loading state
  const originalText = submitText?.textContent || ''
  if (submitBtn) submitBtn.disabled = true
  if (submitText) submitText.textContent = t('sellerApplication.submitting')

  try {
    // Validate required fields
    const validationError = validateForm()
    if (validationError) {
      throw new Error(validationError)
    }

    // Collect form data
    const formData = collectFormData(user)

    let applicationName: string

    if (existingApplicationName) {
      // Update existing draft
      const res = await frappeCall(`/api/resource/Seller Application/${existingApplicationName}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || errData._server_messages || t('sellerApplication.submitError'))
      }
      applicationName = existingApplicationName
    } else {
      // Create new application
      const res = await frappeCall('/api/resource/Seller Application', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || errData._server_messages || t('sellerApplication.submitError'))
      }
      const data = await res.json()
      applicationName = data.data?.name
    }

    // Upload files
    await uploadFormFiles(applicationName)

    // Set status to Submitted
    await frappeCall(`/api/resource/Seller Application/${applicationName}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'Submitted' }),
    })

    // Redirect to pending page
    window.location.href = '/pages/seller/application-pending.html'
  } catch (err) {
    const message = err instanceof Error ? err.message : t('sellerApplication.submitError')
    if (errorBanner) {
      errorBanner.textContent = message
      errorBanner.classList.remove('hidden')
      errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    // Restore button
    if (submitBtn) submitBtn.disabled = false
    if (submitText) submitText.textContent = originalText
  }
}

function validateForm(): string | null {
  const required: Array<{ id: string; label: string }> = [
    { id: 'sa-business-name', label: t('sellerApplication.businessName') },
    { id: 'sa-seller-type', label: t('sellerApplication.sellerType') },
    { id: 'sa-tax-id', label: t('sellerApplication.taxId') },
    { id: 'sa-tax-id-type', label: t('sellerApplication.taxIdType') },
    { id: 'sa-tax-office', label: t('sellerApplication.taxOffice') },
    { id: 'sa-identity-document', label: t('sellerApplication.identityDocumentType') },
    { id: 'sa-identity-doc-number', label: t('sellerApplication.identityDocNumber') },
    { id: 'sa-identity-doc-expiry', label: t('sellerApplication.identityDocExpiry') },
    { id: 'sa-bank-name', label: t('sellerApplication.bankName') },
    { id: 'sa-iban', label: t('sellerApplication.iban') },
    { id: 'sa-account-holder', label: t('sellerApplication.accountHolderName') },
  ]

  for (const { id, label } of required) {
    const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null
    if (!el || !el.value.trim()) {
      return `${label}: ${t('sellerApplication.requiredField')}`
    }
  }

  // Check terms checkboxes
  const termsIds = [
    'sa-terms-accepted',
    'sa-privacy-accepted',
    'sa-kvkk-accepted',
    'sa-commission-accepted',
    'sa-return-policy-accepted',
  ]
  for (const id of termsIds) {
    const checkbox = document.getElementById(id) as HTMLInputElement | null
    if (!checkbox?.checked) {
      return t('sellerApplication.termsRequired')
    }
  }

  return null
}

function collectFormData(user: AuthUser): Record<string, unknown> {
  const getValue = (id: string): string => {
    const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null
    return el?.value?.trim() || ''
  }

  return {
    applicant_user: user.email,
    business_name: getValue('sa-business-name'),
    seller_type: getValue('sa-seller-type'),
    tax_id: getValue('sa-tax-id'),
    tax_id_type: getValue('sa-tax-id-type'),
    tax_office: getValue('sa-tax-office'),
    identity_document: getValue('sa-identity-document'),
    identity_document_number: getValue('sa-identity-doc-number'),
    identity_document_expiry: getValue('sa-identity-doc-expiry'),
    bank_name: getValue('sa-bank-name'),
    bank_branch: getValue('sa-bank-branch'),
    iban: getValue('sa-iban'),
    account_holder_name: getValue('sa-account-holder'),
    business_description: getValue('sa-business-description'),
    terms_accepted: 1,
    privacy_accepted: 1,
    kvkk_accepted: 1,
    commission_accepted: 1,
    return_policy_accepted: 1,
  }
}

async function uploadFormFiles(applicationName: string): Promise<void> {
  const fileFields: Array<{ inputId: string; fieldname: string }> = [
    { inputId: 'sa-identity-doc-attachment', fieldname: 'identity_document_attachment' },
    { inputId: 'sa-trade-registry-attachment', fieldname: 'trade_registry_attachment' },
    { inputId: 'sa-tax-certificate-attachment', fieldname: 'tax_certificate_attachment' },
    { inputId: 'sa-signature-circular-attachment', fieldname: 'signature_circular_attachment' },
  ]

  for (const { inputId, fieldname } of fileFields) {
    const input = document.getElementById(inputId) as HTMLInputElement | null
    const file = input?.files?.[0]
    if (file) {
      await uploadFile(file, 'Seller Application', applicationName, fieldname)
    }
  }
}

/* ── Page Render ────────────────────────────────────── */

function renderPage(): string {
  return `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <a href="/" class="flex items-center gap-2" aria-label="iSTOC">
            <img src="/images/istoc-logo.png" alt="iSTOC" class="h-8" />
          </a>
          <span class="text-sm text-gray-500 dark:text-gray-400">
            ${t('sellerApplication.pageTitle')}
          </span>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <!-- Page Header -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            ${t('sellerApplication.pageTitle')}
          </h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            ${t('sellerApplication.pageSubtitle')}
          </p>
        </div>

        <!-- Error Banner -->
        <div id="sa-error-banner" class="hidden mb-6 p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800"></div>

        <!-- Form -->
        <form id="seller-application-form" class="space-y-8" novalidate>
          ${renderBusinessSection()}
          ${renderTaxSection()}
          ${renderIdentitySection()}
          ${renderDocumentsSection()}
          ${renderBankingSection()}
          ${renderPreferencesSection()}
          ${renderTermsSection()}

          <!-- Submit Button -->
          <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="submit"
              id="sa-submit-btn"
              class="th-btn th-btn-pill w-full sm:w-auto px-8 py-3 text-base font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span id="sa-submit-text">${t('sellerApplication.submitApplication')}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  `
}

/* ── Section Renderers ──────────────────────────────── */

function renderSectionHeader(title: string, description?: string): string {
  return `
    <div class="mb-4">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">${title}</h2>
      ${description ? `<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${description}</p>` : ''}
    </div>
  `
}

function renderBusinessSection(): string {
  return `
    <section class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      ${renderSectionHeader(
        t('sellerApplication.businessInfoTitle'),
        t('sellerApplication.businessInfoDesc'),
      )}

      <div class="space-y-4">
        <!-- Business Name -->
        <div>
          <label for="sa-business-name" class="${LABEL_CLS}">
            ${t('sellerApplication.businessName')} *
          </label>
          <input
            type="text"
            id="sa-business-name"
            name="business_name"
            placeholder="${t('sellerApplication.businessNamePlaceholder')}"
            class="${INPUT_CLS}"
            required
          />
        </div>

        <!-- Seller Type -->
        <div>
          <label for="sa-seller-type" class="${LABEL_CLS}">
            ${t('sellerApplication.sellerType')} *
          </label>
          <select id="sa-seller-type" name="seller_type" class="${SELECT_CLS}" required>
            <option value="">${t('sellerApplication.selectSellerType')}</option>
            <option value="Individual">${t('sellerApplication.sellerTypeIndividual')}</option>
            <option value="Business">${t('sellerApplication.sellerTypeBusiness')}</option>
            <option value="Enterprise">${t('sellerApplication.sellerTypeEnterprise')}</option>
          </select>
        </div>
      </div>
    </section>
  `
}

function renderTaxSection(): string {
  return `
    <section class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      ${renderSectionHeader(
        t('sellerApplication.taxInfoTitle'),
        t('sellerApplication.taxInfoDesc'),
      )}

      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Tax ID Type -->
          <div>
            <label for="sa-tax-id-type" class="${LABEL_CLS}">
              ${t('sellerApplication.taxIdType')} *
            </label>
            <select id="sa-tax-id-type" name="tax_id_type" class="${SELECT_CLS}" required>
              <option value="TCKN">${t('sellerApplication.taxIdTypeTCKN')}</option>
              <option value="VKN">${t('sellerApplication.taxIdTypeVKN')}</option>
            </select>
          </div>

          <!-- Tax ID -->
          <div>
            <label for="sa-tax-id" class="${LABEL_CLS}">
              ${t('sellerApplication.taxId')} *
            </label>
            <input
              type="text"
              id="sa-tax-id"
              name="tax_id"
              placeholder="${t('sellerApplication.taxIdPlaceholder')}"
              class="${INPUT_CLS}"
              required
            />
          </div>
        </div>

        <!-- Tax Office -->
        <div>
          <label for="sa-tax-office" class="${LABEL_CLS}">
            ${t('sellerApplication.taxOffice')} *
          </label>
          <input
            type="text"
            id="sa-tax-office"
            name="tax_office"
            placeholder="${t('sellerApplication.taxOfficePlaceholder')}"
            class="${INPUT_CLS}"
            required
          />
        </div>
      </div>
    </section>
  `
}

function renderIdentitySection(): string {
  return `
    <section class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      ${renderSectionHeader(
        t('sellerApplication.identityTitle'),
        t('sellerApplication.identityDesc'),
      )}

      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Identity Document Type -->
          <div>
            <label for="sa-identity-document" class="${LABEL_CLS}">
              ${t('sellerApplication.identityDocumentType')} *
            </label>
            <select id="sa-identity-document" name="identity_document" class="${SELECT_CLS}" required>
              <option value="">${t('sellerApplication.selectDocumentType')}</option>
              <option value="National ID Card">${t('sellerApplication.identityDocNationalId')}</option>
              <option value="Passport">${t('sellerApplication.identityDocPassport')}</option>
              <option value="Driver License">${t('sellerApplication.identityDocDriverLicense')}</option>
            </select>
          </div>

          <!-- Document Number -->
          <div>
            <label for="sa-identity-doc-number" class="${LABEL_CLS}">
              ${t('sellerApplication.identityDocNumber')} *
            </label>
            <input
              type="text"
              id="sa-identity-doc-number"
              name="identity_document_number"
              placeholder="${t('sellerApplication.identityDocNumberPlaceholder')}"
              class="${INPUT_CLS}"
              required
            />
          </div>
        </div>

        <!-- Document Expiry -->
        <div>
          <label for="sa-identity-doc-expiry" class="${LABEL_CLS}">
            ${t('sellerApplication.identityDocExpiry')} *
          </label>
          <input
            type="date"
            id="sa-identity-doc-expiry"
            name="identity_document_expiry"
            class="${INPUT_CLS}"
            required
          />
        </div>

        <!-- Document Attachment -->
        <div>
          <label for="sa-identity-doc-attachment" class="${LABEL_CLS}">
            ${t('sellerApplication.identityDocAttachment')} *
          </label>
          <input
            type="file"
            id="sa-identity-doc-attachment"
            name="identity_document_attachment"
            accept=".pdf,.jpg,.jpeg,.png"
            class="${FILE_CLS}"
          />
          <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
            ${t('sellerApplication.uploadHint')}
          </p>
        </div>
      </div>
    </section>
  `
}

function renderDocumentsSection(): string {
  return `
    <section id="sa-business-docs-section" class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hidden">
      ${renderSectionHeader(
        t('sellerApplication.businessDocsTitle'),
        t('sellerApplication.businessDocsDesc'),
      )}

      <div class="space-y-4">
        <!-- Trade Registry -->
        <div>
          <label for="sa-trade-registry-attachment" class="${LABEL_CLS}">
            ${t('sellerApplication.tradeRegistryAttachment')}
          </label>
          <input
            type="file"
            id="sa-trade-registry-attachment"
            name="trade_registry_attachment"
            accept=".pdf,.jpg,.jpeg,.png"
            class="${FILE_CLS}"
          />
          <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
            ${t('sellerApplication.uploadHint')}
          </p>
        </div>

        <!-- Tax Certificate -->
        <div>
          <label for="sa-tax-certificate-attachment" class="${LABEL_CLS}">
            ${t('sellerApplication.taxCertificateAttachment')}
          </label>
          <input
            type="file"
            id="sa-tax-certificate-attachment"
            name="tax_certificate_attachment"
            accept=".pdf,.jpg,.jpeg,.png"
            class="${FILE_CLS}"
          />
          <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
            ${t('sellerApplication.uploadHint')}
          </p>
        </div>

        <!-- Signature Circular (Enterprise only) -->
        <div id="sa-signature-field" class="hidden">
          <label for="sa-signature-circular-attachment" class="${LABEL_CLS}">
            ${t('sellerApplication.signatureCircularAttachment')}
          </label>
          <input
            type="file"
            id="sa-signature-circular-attachment"
            name="signature_circular_attachment"
            accept=".pdf,.jpg,.jpeg,.png"
            class="${FILE_CLS}"
          />
          <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
            ${t('sellerApplication.uploadHint')}
          </p>
        </div>
      </div>
    </section>
  `
}

function renderBankingSection(): string {
  return `
    <section class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      ${renderSectionHeader(
        t('sellerApplication.bankingTitle'),
        t('sellerApplication.bankingDesc'),
      )}

      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Bank Name -->
          <div>
            <label for="sa-bank-name" class="${LABEL_CLS}">
              ${t('sellerApplication.bankName')} *
            </label>
            <input
              type="text"
              id="sa-bank-name"
              name="bank_name"
              placeholder="${t('sellerApplication.bankNamePlaceholder')}"
              class="${INPUT_CLS}"
              required
            />
          </div>

          <!-- Bank Branch -->
          <div>
            <label for="sa-bank-branch" class="${LABEL_CLS}">
              ${t('sellerApplication.bankBranch')}
            </label>
            <input
              type="text"
              id="sa-bank-branch"
              name="bank_branch"
              placeholder="${t('sellerApplication.bankBranchPlaceholder')}"
              class="${INPUT_CLS}"
            />
          </div>
        </div>

        <!-- IBAN -->
        <div>
          <label for="sa-iban" class="${LABEL_CLS}">
            ${t('sellerApplication.iban')} *
          </label>
          <input
            type="text"
            id="sa-iban"
            name="iban"
            placeholder="${t('sellerApplication.ibanPlaceholder')}"
            class="${INPUT_CLS}"
            required
          />
        </div>

        <!-- Account Holder Name -->
        <div>
          <label for="sa-account-holder" class="${LABEL_CLS}">
            ${t('sellerApplication.accountHolderName')} *
          </label>
          <input
            type="text"
            id="sa-account-holder"
            name="account_holder_name"
            placeholder="${t('sellerApplication.accountHolderNamePlaceholder')}"
            class="${INPUT_CLS}"
            required
          />
        </div>
      </div>
    </section>
  `
}

function renderPreferencesSection(): string {
  const categories = [
    'sellerApplication.catTextile',
    'sellerApplication.catElectronics',
    'sellerApplication.catFoodBeverage',
    'sellerApplication.catAutomotive',
    'sellerApplication.catMachinery',
    'sellerApplication.catConstruction',
    'sellerApplication.catCosmetics',
    'sellerApplication.catFurniture',
    'sellerApplication.catAgriculture',
    'sellerApplication.catOther',
  ]

  return `
    <section class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      ${renderSectionHeader(
        t('sellerApplication.preferencesTitle'),
        t('sellerApplication.preferencesDesc'),
      )}

      <div class="space-y-4">
        <!-- Preferred Categories -->
        <div>
          <label class="${LABEL_CLS}">
            ${t('sellerApplication.preferredCategories')}
          </label>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            ${categories.map((catKey, i) => `
              <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" name="preferred_category" value="${t(catKey)}" class="${CHECK_CLS}" data-category-index="${i}" />
                <span>${t(catKey)}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Business Description -->
        <div>
          <label for="sa-business-description" class="${LABEL_CLS}">
            ${t('sellerApplication.businessDescription')}
          </label>
          <textarea
            id="sa-business-description"
            name="business_description"
            rows="4"
            placeholder="${t('sellerApplication.businessDescriptionPlaceholder')}"
            class="${INPUT_CLS} resize-y"
          ></textarea>
        </div>
      </div>
    </section>
  `
}

function renderTermsSection(): string {
  const terms = [
    { id: 'sa-terms-accepted', labelKey: 'sellerApplication.termsAccepted' },
    { id: 'sa-privacy-accepted', labelKey: 'sellerApplication.privacyAccepted' },
    { id: 'sa-kvkk-accepted', labelKey: 'sellerApplication.kvkkAccepted' },
    { id: 'sa-commission-accepted', labelKey: 'sellerApplication.commissionAccepted' },
    { id: 'sa-return-policy-accepted', labelKey: 'sellerApplication.returnPolicyAccepted' },
  ]

  return `
    <section class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      ${renderSectionHeader(
        t('sellerApplication.termsTitle'),
        t('sellerApplication.termsDesc'),
      )}

      <div class="space-y-3">
        ${terms.map(({ id, labelKey }) => `
          <label class="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="${id}"
              name="${id.replace('sa-', '')}"
              class="${CHECK_CLS} mt-0.5"
              required
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">${t(labelKey)} *</span>
          </label>
        `).join('')}
      </div>
    </section>
  `
}
