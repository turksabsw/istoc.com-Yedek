/**
 * CouponStore — Merkezi Kupon & Kredi State Store
 * OrderStore singleton pattern'i ile localStorage persistence.
 */

import {
  mockCoupons,
  mockCreditHistory,
  mockCreditBalance,
  type CouponData,
  type CreditHistoryEntry,
} from '../../../data/mockCheckout';

const STORAGE_KEY = 'tradehub_coupons';
const CREDIT_STORAGE_KEY = 'tradehub_credits';
const SEED_FLAG = 'tradehub_coupons_seeded';

export class CouponStore {
  private coupons: CouponData[] = [];
  private creditBalance = 0;
  private creditHistory: CreditHistoryEntry[] = [];
  private listeners = new Set<() => void>();

  load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CouponData[];
        if (Array.isArray(parsed)) this.coupons = parsed;
      }
      const creditRaw = localStorage.getItem(CREDIT_STORAGE_KEY);
      if (creditRaw) {
        const parsed = JSON.parse(creditRaw);
        if (typeof parsed.balance === 'number') this.creditBalance = parsed.balance;
        if (Array.isArray(parsed.history)) this.creditHistory = parsed.history;
      }
    } catch { /* corrupted data — start fresh */ }

    // Seed on first-ever load
    if (!localStorage.getItem(SEED_FLAG)) {
      this.coupons = [...mockCoupons];
      this.creditBalance = mockCreditBalance;
      this.creditHistory = [...mockCreditHistory];
      localStorage.setItem(SEED_FLAG, '1');
      this.save();
    }

    this.notify();
  }

  getCoupons(): CouponData[] {
    return this.coupons;
  }

  getByStatus(status: CouponData['status']): CouponData[] {
    return this.coupons.filter((c) => c.status === status);
  }

  useCoupon(code: string): boolean {
    const coupon = this.coupons.find((c) => c.code === code && c.status === 'available');
    if (!coupon) return false;
    coupon.status = 'used';
    coupon.usedAt = new Date().toISOString();
    this.save();
    this.notify();
    return true;
  }

  getCreditBalance(): number {
    return this.creditBalance;
  }

  getCreditHistory(): CreditHistoryEntry[] {
    return this.creditHistory;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.coupons));
      localStorage.setItem(CREDIT_STORAGE_KEY, JSON.stringify({
        balance: this.creditBalance,
        history: this.creditHistory,
      }));
    } catch { /* quota exceeded */ }
  }
}

export const couponStore = new CouponStore();
