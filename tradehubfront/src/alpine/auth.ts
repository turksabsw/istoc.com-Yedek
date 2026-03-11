import Alpine from 'alpinejs'
import { t } from '../i18n'
import { showToast } from '../utils/toast'
import { apiGet, apiPost } from '../utils/api'
import { setTokens, setUser } from '../utils/auth'
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
  escapeHtml,
  type RegisterStep,
} from '../components/auth/RegisterPage'
import {
  maskEmail,
  type ForgotPasswordStep,
} from '../components/auth/ForgotPasswordPage'
import { getBaseUrl } from '../components/auth/AuthLayout'

/* ── Register API response types ──────────────────────── */

interface CheckEmailResponse {
  success: boolean;
  exists: boolean;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  user: string;
  requires_verification: boolean;
}

interface VerifyEmailResponse {
  success: boolean;
  message: string;
  token: {
    api_key: string;
    api_secret: string;
    token_type: string;
  };
  user: {
    email: string;
    full_name: string;
    first_name: string;
    last_name: string;
    user_type: string;
    is_email_verified: number;
    has_completed_onboarding: number;
  };
}

Alpine.data('registerPage', () => ({
  currentStep: 'account-type' as RegisterStep,
  accountType: 'buyer' as AccountType | null,
  email: '',
  emailValid: false,
  emailError: false,
  emailExistsError: false,
  emailSubmitting: false,
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
      this.emailExistsError = false;
    }
  },

  /** Check email existence on blur for early feedback */
  async checkEmailBlur() {
    const input = (this.$refs as Record<string, HTMLInputElement>).emailInput;
    const value = input?.value.trim() || '';

    if (!this.emailValid || !value) return;

    try {
      const result = await apiGet<CheckEmailResponse>(
        'tr_tradehub.api.v1.auth.check_email_exists',
        { email: value },
      );
      if (result.exists) {
        this.emailExistsError = true;
      }
    } catch {
      // Silently fail on blur — will be caught on submit
    }
  },

  /** Submit email step: validate, check existence via API, proceed to setup */
  async submitEmail() {
    const input = (this.$refs as Record<string, HTMLInputElement>).emailInput;
    const value = input?.value.trim() || '';

    if (!this.emailValid) {
      this.emailError = true;
      return;
    }

    this.emailSubmitting = true;
    this.emailExistsError = false;

    try {
      const result = await apiGet<CheckEmailResponse>(
        'tr_tradehub.api.v1.auth.check_email_exists',
        { email: value },
      );

      if (result.exists) {
        this.emailExistsError = true;
        return;
      }

      this.email = value;
      // Proceed to setup step (collect name/password before registration)
      this.goToStep('setup');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      showToast({ message, type: 'error' });
    } finally {
      this.emailSubmitting = false;
    }
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
        case 'setup': {
          // Show setup form BEFORE OTP — collect name/password for registration
          const container = (this.$refs as Record<string, HTMLElement>).setupContainer;
          if (container) {
            container.innerHTML = AccountSetupForm('TR');
          }
          initAccountSetupForm({
            defaultCountry: 'TR',
            onSubmit: async (formData: AccountSetupFormData) => {
              if (!this.accountType) return;

              // Set loading state on setup submit button
              const submitBtn = document.getElementById('account-setup-submit-btn') as HTMLButtonElement | null;
              if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.dataset.originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = `
                  <svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                `;
              }

              try {
                // Call register API — creates user and sends verification OTP
                await apiPost<RegisterResponse>(
                  'tr_tradehub.api.v1.auth.register',
                  {
                    email: this.email,
                    password: formData.password,
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    user_type: this.accountType,
                  },
                );

                // Proceed to OTP verification step
                this.goToStep('otp');
              } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                showToast({ message, type: 'error' });

                // Restore submit button
                if (submitBtn) {
                  if (submitBtn.dataset.originalText) {
                    submitBtn.innerHTML = submitBtn.dataset.originalText;
                    delete submitBtn.dataset.originalText;
                  }
                  submitBtn.disabled = false;
                }
              }
            },
          });
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
            onComplete: async (otp: string) => {
              // Disable continue button during verification
              const continueBtn = document.getElementById('otp-continue-btn') as HTMLButtonElement | null;
              if (continueBtn) {
                continueBtn.disabled = true;
                continueBtn.dataset.originalText = continueBtn.innerHTML;
                continueBtn.innerHTML = `
                  <svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                `;
              }

              try {
                // Verify email with OTP — returns auth tokens
                const result = await apiPost<VerifyEmailResponse>(
                  'tr_tradehub.api.v1.auth.verify_email',
                  { email: this.email, otp },
                );

                // Store auth tokens (no expires_in from server, default 24h)
                setTokens({
                  api_key: result.token.api_key,
                  api_secret: result.token.api_secret,
                  expires_in: 86400,
                });

                // Store user profile
                setUser({
                  email: result.user.email,
                  full_name: result.user.full_name,
                  first_name: result.user.first_name,
                  last_name: result.user.last_name,
                  roles: [],
                  user_type: result.user.user_type || this.accountType || 'buyer',
                  is_verified: true,
                  has_completed_onboarding: Boolean(result.user.has_completed_onboarding),
                });

                // Dispatch completion event for entry point redirect
                this.$dispatch('register-complete', {
                  accountType: this.accountType,
                  email: this.email,
                  formData: {
                    firstName: result.user.first_name,
                    lastName: result.user.last_name,
                  },
                });
              } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                showToast({ message, type: 'error' });

                // Re-enable continue button
                if (continueBtn) {
                  if (continueBtn.dataset.originalText) {
                    continueBtn.innerHTML = continueBtn.dataset.originalText;
                    delete continueBtn.dataset.originalText;
                  }
                  continueBtn.disabled = false;
                }
              }
            },
            onResend: async () => {
              try {
                await apiPost(
                  'tr_tradehub.api.v1.auth.resend_verification_otp',
                  { email: this.email },
                );
              } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                showToast({ message, type: 'error' });
              }
            },
            onBack: () => {
              this.goToStep('setup');
            },
          });
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
