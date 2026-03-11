import Alpine from 'alpinejs'
import { t } from '../i18n'

Alpine.data('settingsLayout', () => ({
  currentSection: '',

  init() {
    this.currentSection = window.location.hash || '';
  },

  copyMemberId() {
    navigator.clipboard.writeText('tr29243492599miuy').then(() => {
      const btn = (this.$refs as Record<string, HTMLElement>).copyBtn;
      if (btn) {
        btn.title = t('orders.copied');
        setTimeout(() => { btn.title = t('orders.copy'); }, 2000);
      }
    });
  },
}));

Alpine.data('settingsChangeEmail', () => ({
  step: 1,
  countdown: 59,
  error: '',
  _timerInterval: null as ReturnType<typeof setInterval> | null,

  init() {
    this.startTimer();
  },

  startTimer() {
    this.countdown = 59;
    if (this._timerInterval) clearInterval(this._timerInterval);
    this._timerInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0 && this._timerInterval) {
        clearInterval(this._timerInterval);
        this._timerInterval = null;
      }
    }, 1000);
  },

  resendCode() {
    if (this.countdown > 0) return;
    this.startTimer();
  },

  handleCodeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.classList.contains('email-change__code-box')) return;
    const idx = parseInt(input.dataset.idx || '0', 10);
    const boxes = (this.$refs as Record<string, HTMLElement>).codeBoxes;
    if (!boxes) return;
    const inputs = boxes.querySelectorAll<HTMLInputElement>('.email-change__code-box');

    if (input.value.length === 1 && idx < inputs.length - 1) {
      inputs[idx + 1].focus();
    }

    const code = Array.from(inputs).map(b => b.value).join('');
    if (code.length === 6) {
      if (this._timerInterval) {
        clearInterval(this._timerInterval);
        this._timerInterval = null;
      }
      this.step = 2;
    }
  },

  handleCodeKeydown(event: KeyboardEvent) {
    const input = event.target as HTMLInputElement;
    if (!input.classList.contains('email-change__code-box')) return;
    const idx = parseInt(input.dataset.idx || '0', 10);
    if (event.key === 'Backspace' && !input.value && idx > 0) {
      const boxes = (this.$refs as Record<string, HTMLElement>).codeBoxes;
      if (!boxes) return;
      const inputs = boxes.querySelectorAll<HTMLInputElement>('.email-change__code-box');
      inputs[idx - 1].focus();
    }
  },

  submitEmail() {
    const input = (this.$refs as Record<string, HTMLInputElement>).ecNewEmail;
    const val = input?.value.trim() || '';

    if (!val || !val.includes('@')) {
      this.error = t('auth.register.emailError');
      return;
    }

    try {
      const raw = localStorage.getItem('tradehub_account_data');
      const data = raw ? JSON.parse(raw) : {};
      data.email = val;
      data.emailVerified = false;
      localStorage.setItem('tradehub_account_data', JSON.stringify(data));
    } catch { /* ignore */ }

    this.error = '';
    this.step = 3;
  },

  destroy() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  },
}));

Alpine.data('settingsChangePassword', () => ({
  step: 1,
  countdown: 0,
  codeError: false,
  error: '',
  _timerInterval: null as ReturnType<typeof setInterval> | null,

  init() {
    this.startTimer();
  },

  startTimer() {
    this.countdown = 60;
    if (this._timerInterval) clearInterval(this._timerInterval);
    this._timerInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0 && this._timerInterval) {
        clearInterval(this._timerInterval);
        this._timerInterval = null;
      }
    }, 1000);
  },

  resendCode() {
    this.startTimer();
  },

  verifySubmit() {
    const codeInput = (this.$refs as Record<string, HTMLInputElement>).pwVerifyCode;
    if (!codeInput.value.trim()) {
      this.codeError = true;
      return;
    }
    this.codeError = false;
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
    this.step = 2;
  },

  savePassword() {
    const newPw = (this.$refs as Record<string, HTMLInputElement>).pwNew.value;
    const confirmPw = (this.$refs as Record<string, HTMLInputElement>).pwConfirm.value;

    if (newPw.length < 8) {
      this.error = t('settings.passwordMinLength');
      return;
    }
    if (newPw !== confirmPw) {
      this.error = t('settings.passwordsMismatch');
      return;
    }

    this.error = '';
    this.step = 3;
  },

  destroy() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  },
}));

Alpine.data('settingsChangePhone', () => ({
  step: 1,
  countryCode: '+90',
  phoneNumber: '',
  phoneError: '',
  verifyError: '',
  countdown: 0,
  _timerInterval: null as ReturnType<typeof setInterval> | null,

  sendCode() {
    const num = this.phoneNumber.trim();
    if (!num || num.length < 7) {
      this.phoneError = t('settings.invalidPhone');
      return;
    }
    this.phoneError = '';
    this.step = 2;
    this.startTimer();
  },

  startTimer() {
    this.countdown = 60;
    if (this._timerInterval) clearInterval(this._timerInterval);
    this._timerInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0 && this._timerInterval) {
        clearInterval(this._timerInterval);
        this._timerInterval = null;
      }
    }, 1000);
  },

  verify() {
    const codeInput = (this.$refs as Record<string, HTMLInputElement>).phoneVerifyCode;
    const code = codeInput?.value.trim() || '';
    if (!code || code.length < 6) {
      this.verifyError = t('settings.invalidVerifyCode');
      return;
    }
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
    this.verifyError = '';

    try {
      const raw = localStorage.getItem('tradehub_account_data');
      const data = raw ? JSON.parse(raw) : {};
      data.phoneCountry = this.countryCode.trim();
      data.phoneArea = '';
      data.phoneNumber = this.phoneNumber.trim();
      localStorage.setItem('tradehub_account_data', JSON.stringify(data));
    } catch { /* ignore */ }

    this.step = 3;
  },

  destroy() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  },
}));

Alpine.data('settingsDeleteAccount', () => ({
  step: 1,
  reason: '',
  confirmed: false,
  countdown: 0,
  error1: '',
  error2: '',
  error3: '',
  _timerInterval: null as ReturnType<typeof setInterval> | null,

  continueToVerify() {
    if (!this.reason) {
      this.error1 = t('settings.selectReason');
      return;
    }
    this.error1 = '';
    this.step = 2;
    this.startTimer();
  },

  startTimer() {
    this.countdown = 60;
    if (this._timerInterval) clearInterval(this._timerInterval);
    this._timerInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0 && this._timerInterval) {
        clearInterval(this._timerInterval);
        this._timerInterval = null;
      }
    }, 1000);
  },

  verifyCode() {
    const codeInput = (this.$refs as Record<string, HTMLInputElement>).delVerifyCode;
    const code = codeInput?.value.trim() || '';
    if (!code || code.length < 6) {
      this.error2 = t('settings.invalidVerifyCode');
      return;
    }
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
    this.error2 = '';
    this.step = 3;
  },

  deleteFinal() {
    localStorage.removeItem('tradehub_account_data');
    this.step = 4;
  },

  destroy() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  },
}));
