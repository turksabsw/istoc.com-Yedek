import Alpine from 'alpinejs'
import { t, getCurrentLang } from '../i18n'
import { couponStore } from '../components/orders/state/CouponStore'
import type { CouponData, CreditHistoryEntry } from '../data/mockCheckout'

Alpine.data('couponsPageComponent', () => ({
  activeTab: 'coupons-list' as string,
  activePill: 'available' as string,
  coupons: [] as CouponData[],
  creditBalance: 0,
  creditHistory: [] as CreditHistoryEntry[],

  init() {
    couponStore.load();
    this.coupons = couponStore.getCoupons();
    this.creditBalance = couponStore.getCreditBalance();
    this.creditHistory = couponStore.getCreditHistory();
    couponStore.subscribe(() => {
      this.coupons = couponStore.getCoupons();
      this.creditBalance = couponStore.getCreditBalance();
      this.creditHistory = couponStore.getCreditHistory();
    });
  },

  get filteredCoupons(): CouponData[] {
    const statusMap: Record<string, CouponData['status']> = {
      available: 'available',
      used: 'used',
      expired: 'expired',
    };
    const status = statusMap[this.activePill] ?? 'available';
    return this.coupons.filter((c: CouponData) => c.status === status);
  },

  switchTab(tab: string) {
    this.activeTab = tab;
  },

  setPill(pill: string) {
    this.activePill = pill;
  },

  formatDate(iso: string): string {
    if (!iso) return '-';
    const d = new Date(iso);
    const locale = getCurrentLang() === 'tr' ? 'tr-TR' : 'en-US';
    return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
  },

  couponTypeBadge(type: string): string {
    if (type === 'percent') return '%';
    if (type === 'fixed') return '$';
    return '🚚';
  },

  couponTypeLabel(type: string): string {
    if (type === 'percent') return t('coupons.percentDiscount');
    if (type === 'fixed') return t('coupons.fixedDiscount');
    return t('coupons.freeShipping');
  },

  couponBadgeClass(type: string): string {
    if (type === 'percent') return 'bg-(--color-info-50,#eff6ff) text-(--color-info-700,#1d4ed8)';
    if (type === 'fixed') return 'bg-(--color-success-50,#f0fdf4) text-(--color-success-700,#15803d)';
    return 'bg-(--color-warning-50,#fffbeb) text-(--color-warning-700,#b45309)';
  },

  creditTypeLabel(type: string): string {
    if (type === 'earned') return t('coupons.earned');
    if (type === 'spent') return t('coupons.spent');
    return t('coupons.refund');
  },

  creditBadgeClass(type: string): string {
    if (type === 'earned') return 'bg-(--color-success-50,#f0fdf4) text-(--color-success-700,#15803d)';
    if (type === 'spent') return 'bg-(--color-error-50,#fef2f2) text-(--color-error-700,#b91c1c)';
    return 'bg-(--color-info-50,#eff6ff) text-(--color-info-700,#1d4ed8)';
  },

  creditAmountClass(type: string): string {
    if (type === 'earned' || type === 'refund') return 'text-(--color-success-500,#22c55e)';
    return 'text-(--color-error-500,#ef4444)';
  },
}));
