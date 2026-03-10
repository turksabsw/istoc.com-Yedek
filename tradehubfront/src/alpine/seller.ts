import Alpine from 'alpinejs'
import { t } from '../i18n'
import { getBaseUrl } from '../components/auth/AuthLayout'

// ─── Sell Page (registration form) ────────────────────────────────────
Alpine.data('sellPage', () => ({
  currentStep: 1,
  formData: {
    companyName: '',
    businessType: '',
    taxNumber: '',
    contactName: '',
    email: '',
    phone: '',
    mainCategories: [] as string[],
    productCount: '',
    termsAccepted: false,
  },
  formErrors: {} as Record<string, string>,
  submitted: false,

  get businessTypes() { return t('sellerForm.businessTypes', { returnObjects: true }) as unknown as string[]; },
  get categoryOptions() { return t('sellerForm.categoryOptions', { returnObjects: true }) as unknown as string[]; },

  validateStep(step: number): boolean {
    this.formErrors = {};
    if (step === 1) {
      if (!this.formData.companyName.trim()) this.formErrors.companyName = t('sellerForm.companyNameRequired');
      if (!this.formData.businessType) this.formErrors.businessType = t('sellerForm.businessTypeRequired');
      if (!this.formData.taxNumber.trim()) this.formErrors.taxNumber = t('sellerForm.taxNumberRequired');
    } else if (step === 2) {
      if (!this.formData.contactName.trim()) this.formErrors.contactName = t('sellerForm.contactNameRequired');
      if (!this.formData.email.trim()) this.formErrors.email = t('sellerForm.emailRequired');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email)) this.formErrors.email = t('sellerForm.emailInvalid');
      if (!this.formData.phone.trim()) this.formErrors.phone = t('sellerForm.phoneRequired');
    } else if (step === 3) {
      if (this.formData.mainCategories.length === 0) this.formErrors.mainCategories = t('sellerForm.categoryMinOne');
    } else if (step === 4) {
      if (!this.formData.termsAccepted) this.formErrors.termsAccepted = t('sellerForm.termsRequired');
    }
    return Object.keys(this.formErrors).length === 0;
  },

  nextStep() {
    if (this.validateStep(this.currentStep)) this.currentStep++;
  },

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  },

  toggleCategory(cat: string) {
    const idx = this.formData.mainCategories.indexOf(cat);
    if (idx === -1) this.formData.mainCategories.push(cat);
    else this.formData.mainCategories.splice(idx, 1);
  },

  submitForm() {
    if (!this.validateStep(4)) return;
    this.submitted = true;
  },
}));

// ─── Sell Pricing ──────────────────────────────────────────────────────
Alpine.data('sellPricing', () => ({
  billingPeriod: 'monthly' as 'monthly' | 'yearly',
  faqOpen: [false, false, false, false, false] as boolean[],
  get faqItems() {
    return [
      { question: t('pricingFaq.q1'), answer: t('pricingFaq.a1'), open: this.faqOpen[0] },
      { question: t('pricingFaq.q2'), answer: t('pricingFaq.a2'), open: this.faqOpen[1] },
      { question: t('pricingFaq.q3'), answer: t('pricingFaq.a3'), open: this.faqOpen[2] },
      { question: t('pricingFaq.q4'), answer: t('pricingFaq.a4'), open: this.faqOpen[3] },
      { question: t('pricingFaq.q5'), answer: t('pricingFaq.a5'), open: this.faqOpen[4] },
    ];
  },
  selectedPlan: '',

  toggleFaq(index: number) {
    this.faqOpen[index] = !this.faqOpen[index];
  },

  selectPlan(name: string) {
    this.selectedPlan = name;
    window.location.href = `${getBaseUrl()}pages/seller/sell.html`;
  },
}));

Alpine.data('sellerStorefront', () => ({
  activeTab: 'overview' as string,
  mobileMenuOpen: false,

  setTab(tab: string) {
    this.activeTab = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  },
}));
