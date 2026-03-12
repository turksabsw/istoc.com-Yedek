import Alpine from 'alpinejs'
import { t } from '../i18n'
import { showToast } from '../utils/toast'
import {
  initAccountTypeSelector,
  getSelectedAccountType,
  type AccountType,
} from '../components/auth/AccountTypeSelector'
import {
  EmailVerification,
  initEmailVerification,
  cleanupEmailVerification,
  type EmailVerificationState,
} from '../components/auth/EmailVerification'
import {
  AccountSetupForm,
  initAccountSetupForm,
  type AccountSetupFormData,
} from '../components/auth/AccountSetupForm'
import {
  SupplierSetupForm,
  initSupplierSetupForm,
  type SupplierSetupFormData,
} from '../components/auth/SupplierSetupForm'
import {
  escapeHtml,
  type RegisterStep,
} from '../components/auth/RegisterPage'
import {
  maskEmail,
  type ForgotPasswordStep,
} from '../components/auth/ForgotPasswordPage'
import { getBaseUrl } from '../components/auth/AuthLayout'
import { register, login, getSessionUser, getRedirectUrl, FRAPPE_BASE } from '../utils/auth'

Alpine.data('registerPage', () => ({
  currentStep: 'account-type' as RegisterStep,
  accountType: 'buyer' as AccountType | null,
  email: '',
  emailValid: false,
  emailError: false,
  otpState: null as EmailVerificationState | null,

  init() {
    // Read initial step from data attribute if provided
    const initialStep = (this.$el as HTMLElement).dataset.initialStep as RegisterStep | undefined;
    if (initialStep && initialStep !== 'account-type') {
      this.currentStep = initialStep;
    }

    // Initialize account type selector (child component delegation)
    initAccountTypeSelector({
      defaultType: 'buyer',
      onTypeSelect: (type: AccountType) => {
        this.accountType = type;
      }
    });
    this.accountType = getSelectedAccountType() || 'buyer';

    // Listen for programmatic navigation via navigateToStep()
    (this.$el as HTMLElement).addEventListener('register-navigate', ((e: CustomEvent) => {
      this.goToStep(e.detail.step as RegisterStep);
    }) as EventListener);
  },

  validateEmail() {
    const input = (this.$refs as Record<string, HTMLInputElement>).emailInput;
    const value = input?.value.trim() || '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.emailValid = emailRegex.test(value);
    if (this.emailValid) {
      this.emailError = false;
    }
  },

  submitEmail() {
    const input = (this.$refs as Record<string, HTMLInputElement>).emailInput;
    const value = input?.value.trim() || '';

    if (!this.emailValid) {
      this.emailError = true;
      return;
    }

    this.email = value;
    this.goToStep('otp');
  },

  goToStep(step: RegisterStep) {
    // Cleanup OTP state when leaving OTP step
    if (this.currentStep === 'otp' && this.otpState) {
      cleanupEmailVerification(this.otpState);
      this.otpState = null;
    }

    this.currentStep = step;

    // Notify external listeners via custom event
    this.$dispatch('register-step-change', { step });

    this.$nextTick(() => {
      switch (step) {
        case 'email': {
          const input = (this.$refs as Record<string, HTMLInputElement>).emailInput;
          input?.focus();
          break;
        }
        case 'otp': {
          // Dynamically render OTP content (child component needs fresh DOM each time)
          const container = (this.$refs as Record<string, HTMLElement>).otpContainer;
          if (container) {
            container.innerHTML = EmailVerification(escapeHtml(this.email));
          }
          this.otpState = initEmailVerification({
            email: this.email,
            onComplete: () => {
              this.goToStep('setup');
            },
            onResend: () => {
              // In production, resend OTP via backend
            },
            onBack: () => {
              this.goToStep('email');
            }
          });
          break;
        }
        case 'setup': {
          // Dynamically render setup form (child component needs fresh DOM each time)
          const container = (this.$refs as Record<string, HTMLElement>).setupContainer;

          if (this.accountType === 'supplier') {
            // Supplier: render SupplierSetupForm — multi-step form
            if (container) {
              container.innerHTML = SupplierSetupForm('TR');
            }
            initSupplierSetupForm({
              defaultCountry: 'TR',
              onSubmit: async (formData: SupplierSetupFormData) => {
                if (!this.accountType) return;

                const submitBtn = document.getElementById('supplier-setup-submit-btn') as HTMLButtonElement | null;
                const submitSpan = submitBtn?.querySelector('span');
                const originalText = submitSpan?.textContent || '';
                if (submitBtn) submitBtn.disabled = true;
                if (submitSpan) submitSpan.textContent = t('common.loading');

                try {
                  // 1. Kullanıcı hesabını oluştur (supplier için Draft Seller Application da oluşturulur)
                  const regResult = await register(
                    this.email,
                    formData.password,
                    formData.firstName,
                    formData.lastName,
                    this.accountType,
                    formData.contactPhone,
                    formData.country?.code || 'TR',
                    true,
                    true,
                  );

                  // 2. Oturum aç
                  await login(this.email, formData.password);

                  // 3. register() tarafından oluşturulan Draft başvurusunu güncelle
                  const sellerTypeMap: Record<string, string> = {
                    individual: 'Individual',
                    business: 'Business',
                    enterprise: 'Enterprise',
                  };
                  const identityDocMap: Record<string, string> = {
                    national_id: 'National ID Card',
                    passport: 'Passport',
                    drivers_license: 'Driver License',
                  };

                  // register() mevcut Draft başvuruyu döndürür
                  const existingApplicationName = (regResult as Record<string, unknown>).seller_application as string | undefined;
                  let applicationName: string | undefined = existingApplicationName;

                  if (existingApplicationName) {
                    // complete_registration_application: tek endpoint, doğrudan DB yazımı (izin sorunu yok)
                    const completeRes = await fetch(`${FRAPPE_BASE}/api/method/tr_tradehub.api.v1.seller.complete_registration_application`, {
                      method: 'POST',
                      credentials: 'include',
                      headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-Frappe-CSRF-Token': 'fetch',
                      },
                      body: JSON.stringify({
                        application_name: existingApplicationName,
                        business_name: formData.businessName,
                        seller_type: sellerTypeMap[formData.sellerType || ''] || formData.sellerType,
                        tax_id_type: formData.taxIdType,
                        tax_id: formData.taxId,
                        tax_office: formData.taxOffice,
                        contact_phone: formData.contactPhone,
                        address_line_1: formData.addressLine1,
                        city: formData.city,
                        country: formData.country?.code || 'TR',
                        bank_name: formData.bankName,
                        iban: formData.iban,
                        account_holder_name: formData.accountHolderName,
                        identity_document: identityDocMap[formData.identityDocumentType || ''] || formData.identityDocumentType,
                        identity_document_number: formData.documentNumber,
                        identity_document_expiry: formData.documentExpiryDate,
                        terms_accepted: 1,
                        privacy_accepted: 1,
                        kvkk_accepted: 1,
                        commission_accepted: 1,
                        return_policy_accepted: 1,
                      }),
                    });

                    if (!completeRes.ok) {
                      const errData = await completeRes.json().catch(() => ({})) as Record<string, unknown>;
                      let errMsg = 'Başvuru kaydedilemedi';
                      if (errData._server_messages) {
                        try {
                          const msgs = JSON.parse(errData._server_messages as string) as string[];
                          const first = JSON.parse(msgs[0]) as { message?: string };
                          if (first.message) errMsg = first.message;
                        } catch { /* ignore */ }
                      } else if (typeof errData.message === 'string') {
                        errMsg = errData.message;
                      }
                      throw new Error(errMsg);
                    }
                  }

                  // 4. Kimlik belgesi dosyasını yükle
                  if (formData.identityDocumentAttachment && applicationName) {
                    const fileForm = new FormData();
                    fileForm.append('file', formData.identityDocumentAttachment);
                    fileForm.append('doctype', 'Seller Application');
                    fileForm.append('docname', applicationName);
                    fileForm.append('fieldname', 'identity_document_attachment');
                    fileForm.append('is_private', '1');

                    await fetch(`${FRAPPE_BASE}/api/method/upload_file`, {
                      method: 'POST',
                      credentials: 'include',
                      headers: { 'X-Frappe-CSRF-Token': 'fetch' },
                      body: fileForm,
                    });
                  }

                  // 5. Onay bekleme sayfasına yönlendir
                  window.location.href = '/pages/seller/application-pending.html';

                } catch (err) {
                  const message = err instanceof Error ? err.message : t('auth.register.error');
                  showToast({ message, type: 'error' });
                  if (submitBtn) submitBtn.disabled = false;
                  if (submitSpan) submitSpan.textContent = originalText;
                }
              }
            });
          } else {
            // Buyer: render standard AccountSetupForm
            if (container) {
              container.innerHTML = AccountSetupForm('TR');
            }
            initAccountSetupForm({
              defaultCountry: 'TR',
              onSubmit: async (formData: AccountSetupFormData) => {
                if (!this.accountType) return;
                try {
                  await register(
                    this.email,
                    formData.password,
                    formData.firstName,
                    formData.lastName,
                    this.accountType,
                    '',
                    formData.country?.code || 'TR',
                    true,
                    true,
                  );
                  await login(this.email, formData.password);
                  const user = await getSessionUser();
                  if (user) {
                    window.location.href = getRedirectUrl(user);
                  } else {
                    window.location.href = '/';
                  }
                } catch (err) {
                  const message = err instanceof Error ? err.message : t('auth.register.error');
                  showToast({ message, type: 'error' });
                }
              }
            });
          }
          break;
        }
      }
    });
  },
}));

Alpine.data('forgotPasswordPage', () => ({
  step: 'find-account' as ForgotPasswordStep,
  email: '',
  otp: ['', '', '', '', '', ''] as string[],
  countdown: 0,
  otpError: false,
  showPassword: false,
  passwordValid: false,
  reqLength: null as boolean | null,
  reqChars: null as boolean | null,
  reqEmoji: null as boolean | null,
  _timerInterval: null as ReturnType<typeof setInterval> | null,

  get maskedEmail(): string {
    return maskEmail(this.email);
  },

  submitFindAccount() {
    const trimmed = this.email.trim();
    if (!trimmed) return;

    this.step = 'verify-code';
    this.startCountdown();

    this.$nextTick(() => {
      const container = (this.$refs as Record<string, HTMLElement>).otpContainer;
      if (container) {
        const first = container.querySelector('[data-fp-otp-index="0"]') as HTMLInputElement;
        first?.focus();
      }
    });
  },

  handleOtpInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const idx = parseInt(input.dataset.fpOtpIndex || '', 10);
    if (isNaN(idx)) return;

    const value = input.value.replace(/\D/g, '');
    if (value.length === 1) {
      this.otp[idx] = value;
      input.value = value;
      // Auto-focus next
      if (idx < 5) {
        const container = (this.$refs as Record<string, HTMLElement>).otpContainer;
        const next = container?.querySelector(`[data-fp-otp-index="${idx + 1}"]`) as HTMLInputElement;
        next?.focus();
      }
    } else {
      this.otp[idx] = '';
      input.value = '';
    }

    this.otpError = false;

    // Auto-proceed when all 6 digits entered
    if (this.otp.every((d: string) => d !== '')) {
      setTimeout(() => {
        this.step = 'reset-password';
        this.stopCountdown();
        this.$nextTick(() => {
          const pwInput = (this.$refs as Record<string, HTMLInputElement>).newPassword;
          pwInput?.focus();
        });
      }, 300);
    }
  },

  handleOtpPaste(event: ClipboardEvent) {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    const digits = pasted.replace(/\D/g, '').slice(0, 6);
    const container = (this.$refs as Record<string, HTMLElement>).otpContainer;
    if (!container) return;

    for (let i = 0; i < 6; i++) {
      this.otp[i] = digits[i] || '';
      const el = container.querySelector(`[data-fp-otp-index="${i}"]`) as HTMLInputElement;
      if (el) el.value = digits[i] || '';
    }

    if (digits.length > 0) {
      const focusIdx = Math.min(digits.length - 1, 5);
      const focusEl = container.querySelector(`[data-fp-otp-index="${focusIdx}"]`) as HTMLInputElement;
      focusEl?.focus();
    }

    if (this.otp.every((d: string) => d !== '')) {
      setTimeout(() => {
        this.step = 'reset-password';
        this.stopCountdown();
      }, 300);
    }
  },

  handleOtpKeydown(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    const idx = parseInt(input.dataset.fpOtpIndex || '', 10);
    if (isNaN(idx)) return;

    const container = (this.$refs as Record<string, HTMLElement>).otpContainer;
    if (!container) return;

    if (event.key === 'Backspace' && !input.value && idx > 0) {
      const prev = container.querySelector(`[data-fp-otp-index="${idx - 1}"]`) as HTMLInputElement;
      prev?.focus();
    }
    if (event.key === 'ArrowLeft' && idx > 0) {
      event.preventDefault();
      const prev = container.querySelector(`[data-fp-otp-index="${idx - 1}"]`) as HTMLInputElement;
      prev?.focus();
    }
    if (event.key === 'ArrowRight' && idx < 5) {
      event.preventDefault();
      const next = container.querySelector(`[data-fp-otp-index="${idx + 1}"]`) as HTMLInputElement;
      next?.focus();
    }
  },

  resendCode() {
    if (this.countdown > 0) return;

    // Reset OTP
    this.otp = ['', '', '', '', '', ''];
    const container = (this.$refs as Record<string, HTMLElement>).otpContainer;
    if (container) {
      container.querySelectorAll<HTMLInputElement>('[data-fp-otp-index]').forEach(i => { i.value = ''; });
    }
    this.otpError = false;
    this.startCountdown();

    if (container) {
      const first = container.querySelector('[data-fp-otp-index="0"]') as HTMLInputElement;
      first?.focus();
    }
  },

  startCountdown() {
    this.stopCountdown();
    this.countdown = 60;
    this._timerInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.stopCountdown();
      }
    }, 1000);
  },

  stopCountdown() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  },

  validatePassword() {
    const pw = (this.$refs as Record<string, HTMLInputElement>).newPassword?.value || '';
    const touched = pw.length > 0;

    // Rule 1: 6-20 characters
    const lengthOk = pw.length >= 6 && pw.length <= 20;
    this.reqLength = touched ? lengthOk : null;

    // Rule 2: At least 2 of: letters, digits, special chars
    const hasLetters = /[a-zA-Z]/.test(pw);
    const hasDigits = /[0-9]/.test(pw);
    const hasSpecial = /[^a-zA-Z0-9\s]/.test(pw);
    const typesCount = [hasLetters, hasDigits, hasSpecial].filter(Boolean).length;
    const charsOk = typesCount >= 2;
    this.reqChars = touched ? charsOk : null;

    // Rule 3: No emoji
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    const noEmoji = !emojiRegex.test(pw);
    this.reqEmoji = touched ? noEmoji : null;

    // Enable/disable submit
    this.passwordValid = lengthOk && charsOk && noEmoji;
  },

  reqStyle(valid: boolean | null): string {
    if (valid === null) return '';
    return valid ? 'color: #16a34a' : 'color: #dc2626';
  },

  submitReset() {
    if (!this.passwordValid) return;
    const baseUrl = getBaseUrl();
    showToast({ message: t('auth.forgot.passwordUpdated'), type: 'success' });
    setTimeout(() => {
      window.location.href = `${baseUrl}pages/auth/login.html`;
    }, 1500);
  },

  destroy() {
    this.stopCountdown();
  },
}));
