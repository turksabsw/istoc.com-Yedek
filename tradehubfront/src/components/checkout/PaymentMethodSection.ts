/**
 * PaymentMethodSection Component (C3)
 * Collapsed accordion section for payment method selection.
 *
 * Interactivity handled by Alpine.js x-data="checkoutAccordion" (see alpine.ts).
 * Accordion expand/collapse uses scrollHeight-based height animation.
 */

import type { CartSupplier } from '../../types/cart';
import { t } from '../../i18n';
import '../payment/state/PaymentCardStore';

export interface PaymentMethodSectionProps {
  initialExpanded?: boolean;
  suppliers: CartSupplier[];
  isSupplierCheckout?: boolean;
}

export function PaymentMethodSection({ initialExpanded = false, suppliers, isSupplierCheckout = false }: PaymentMethodSectionProps): string {
  const chevronRotate = initialExpanded ? 'rotate-180' : '';
  const contentStyle = initialExpanded ? '' : 'height: 0; overflow: hidden;';

  const renderPaymentMethods = () => {
    if (!suppliers || suppliers.length === 0) {
      return `<p class="text-[#6b7280] text-base p-4 sm:p-6" data-i18n="checkout.paymentMethodsAfterAddress">${t('checkout.paymentMethodsAfterAddress')}</p>`;
    }

    if (suppliers.length > 1) {
      const supplierNames = isSupplierCheckout ? suppliers.map(s => s.name).join(', ') : 'iSTOC';
      return `
        <div class="p-4 sm:p-6 bg-[#fafafa]" x-data="{ selectedMethod: 'kredi_karti' }">
          <h3 class="text-sm font-semibold text-[#111827] mb-4" data-i18n="checkout.paymentMethodFor" data-i18n-options='{"name":"${supplierNames}"}'>${t('checkout.paymentMethodFor', { name: supplierNames })}</h3>
          <div class="flex flex-col gap-3">
            <!-- Option 1: Kredi veya Banka Kartı -->
            <div class="border rounded-lg transition-colors"
                 :style="selectedMethod === 'kredi_karti' ? 'border-color: var(--btn-bg, #ff6600); background-color: var(--color-primary-50, #fff9f5);' : 'border-color: var(--color-border-default, #e5e5e5); background-color: var(--color-surface, #ffffff);'">
              <label class="flex items-start gap-3 p-4 cursor-pointer relative">
                <input type="radio" name="payment_method" value="kredi_karti" x-model="selectedMethod" class="mt-1" style="accent-color: var(--btn-bg, #ff6600);">
                <div class="w-full">
                  <span class="block text-sm font-bold text-[#111827]" data-i18n="checkout.creditDebitCard">${t('checkout.creditDebitCard')}</span>
                  <span class="block text-xs text-[#6b7280] mt-1" data-i18n="checkout.creditCardDesc">${t('checkout.creditCardDesc')}</span>
                </div>
                <span class="absolute top-3 right-3 sm:top-4 sm:right-4 text-xs font-bold px-2 py-1 rounded" style="color: var(--btn-bg, #ff6600); background-color: var(--color-primary-100, #ffeedd);" data-i18n="common.recommended">${t('common.recommended')}</span>
              </label>

              <div x-show="selectedMethod === 'kredi_karti'" x-cloak style="display: none;" class="px-3 pb-3 sm:px-4 sm:pb-4">
                <div class="pt-4 border-t" style="border-color: var(--color-border-default, #e5e5e5);">
                  <div class="space-y-3 max-w-md"
                       x-data="{
                         ccNum: '', ccExpiry: '', ccName: '', saveCard: false,
                         cardSaved: false, selectedCard: {},
                         savedCards: [],
                         showForm: false,
                         init() {
                           this.savedCards = (window.getSavedCards ? window.getSavedCards() : []);
                           this.showForm = this.savedCards.length === 0;
                         },
                         selectCard(c) {
                           this.selectedCard = { brand: c.brand, masked: c.cardNumber, name: c.cardholderName };
                           this.cardSaved = true;
                           this.showForm = false;
                           expanded = false;
                         }
                       }">

                    <!-- Seçili kart mini özeti -->
                    <div x-show="cardSaved" x-cloak class="flex items-center gap-3 p-3 rounded-lg border" style="border-color: var(--btn-bg, #ff6600); background: var(--color-primary-50, #fff9f5);">
                      <div class="w-10 h-7 rounded flex items-center justify-center text-[10px] font-bold bg-white border" style="border-color: var(--color-border-default, #e5e5e5); color: #222;" x-text="selectedCard.brand || 'CARD'"></div>
                      <div class="flex-1">
                        <div class="text-sm font-semibold" style="color: var(--color-text-primary, #111827);" x-text="selectedCard.masked || ''"></div>
                        <div class="text-xs" style="color: var(--color-text-secondary, #6b7280);" x-text="selectedCard.name || ''"></div>
                      </div>
                      <button type="button" class="text-xs font-semibold underline bg-transparent border-none cursor-pointer" style="color: var(--btn-bg, #ff6600);"
                              @click="cardSaved = false; showForm = savedCards.length === 0;"><span data-i18n="common.change">${t('common.change')}</span></button>
                    </div>

                    <!-- Kayıtlı kartlar carousel -->
                    <div x-show="!cardSaved && savedCards.length > 0" x-cloak>
                      <p class="text-xs text-[#6b7280] mb-3" data-i18n="checkout.selectSavedCard">${t('checkout.selectSavedCard')}</p>
                      <div class="flex gap-3 overflow-x-auto pb-2" style="scrollbar-width: thin; scrollbar-color: #ccc transparent;">
                        <template x-for="c in savedCards" :key="c.id">
                          <div class="relative shrink-0 w-[175px] h-[105px] rounded-xl p-3 flex flex-col justify-between cursor-pointer group ring-0 transition-all hover:scale-[1.03]"
                               style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%); box-shadow: 0 4px 12px rgba(0,0,0,0.18);"
                               @click="selectCard(c)">
                            <div class="flex items-center justify-between">
                              <span class="text-[9px] font-bold tracking-widest uppercase" style="color: rgba(255,255,255,0.5);">TradeHub</span>
                              <span class="text-[10px] font-black px-1 py-0.5 rounded" style="background: rgba(255,255,255,0.15); color: white;" x-text="c.brand"></span>
                            </div>
                            <div>
                              <div class="text-xs font-mono font-bold text-white tracking-widest mb-1 truncate" x-text="c.cardNumber"></div>
                              <div class="flex items-center justify-between">
                                <div class="text-[10px] text-white font-medium truncate max-w-[90px]" x-text="c.cardholderName"></div>
                                <div class="text-[10px] text-white font-medium" x-text="c.expiry || '—'"></div>
                              </div>
                            </div>
                            <div class="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-white/40 transition-all pointer-events-none"></div>
                          </div>
                        </template>
                        <div class="shrink-0 w-[175px] h-[105px] rounded-xl flex flex-col items-center justify-center gap-1 border-2 border-dashed cursor-pointer transition-all hover:scale-[1.03]"
                             style="border-color: #ccc;"
                             onmouseenter="this.style.borderColor='var(--btn-bg,#ff6600)'; this.style.background='var(--color-primary-50,#fff9f5)';"
                             onmouseleave="this.style.borderColor='#ccc'; this.style.background='transparent';"
                             @click="showForm = true;">
                          <span style="font-size: 22px; color: #888;">+</span>
                          <span class="text-[11px] font-medium text-center px-2" style="color: #555;" data-i18n="checkout.payWithNewCard">${t('checkout.payWithNewCard')}</span>
                        </div>
                      </div>
                    </div>

                    <!-- Form -->
                    <div x-show="!cardSaved && showForm" x-cloak class="space-y-4 max-w-md mt-3">
                      <template x-if="savedCards.length > 0">
                        <button type="button" class="text-xs underline bg-transparent border-none cursor-pointer mb-1" style="color: var(--btn-bg, #ff6600);"
                                @click="showForm = false;"><span data-i18n="checkout.backToSavedCards">${t('checkout.backToSavedCards')}</span></button>
                      </template>
                      <div>
                        <label class="block text-xs font-medium text-[#374151] mb-1" data-i18n="checkout.cardNumber">${t('checkout.cardNumber')}</label>
                        <input type="text" x-model="ccNum" class="w-full px-3 py-2 border border-[#e5e5e5] rounded-md focus:outline-none focus:border-[#ff6600]" placeholder="${t('checkout.cardNumberPlaceholder')}" data-i18n-placeholder="checkout.cardNumberPlaceholder">
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div>
                          <label class="block text-xs font-medium text-[#374151] mb-1" data-i18n="checkout.expiryDate">${t('checkout.expiryDate')}</label>
                          <input type="text" x-model="ccExpiry" class="w-full px-3 py-2 border border-[#e5e5e5] rounded-md focus:outline-none focus:border-[#ff6600]" placeholder="${t('checkout.expiryPlaceholder')}" data-i18n-placeholder="checkout.expiryPlaceholder">
                        </div>
                        <div>
                          <label class="block text-xs font-medium text-[#374151] mb-1" data-i18n="checkout.cvv">${t('checkout.cvv')}</label>
                          <input type="text" class="w-full px-3 py-2 border border-[#e5e5e5] rounded-md focus:outline-none focus:border-[#ff6600]" placeholder="${t('checkout.cvvPlaceholder')}" data-i18n-placeholder="checkout.cvvPlaceholder">
                        </div>
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-[#374151] mb-1" data-i18n="checkout.cardholderName">${t('checkout.cardholderName')}</label>
                        <input type="text" x-model="ccName" class="w-full px-3 py-2 border border-[#e5e5e5] rounded-md focus:outline-none focus:border-[#ff6600]" placeholder="${t('checkout.namePlaceholder')}" data-i18n-placeholder="checkout.namePlaceholder">
                      </div>
                      <div class="flex items-center gap-3">
                         <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" class="h-6 object-contain" alt="Mastercard" />
                         <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" class="h-4 object-contain" alt="Visa" />
                      </div>
                      <div class="pt-4 border-t" style="border-color: var(--color-border-default, #e5e5e5);">
                        <label class="flex items-center gap-2 cursor-pointer mb-4">
                          <input type="checkbox" x-model="saveCard" class="w-4 h-4 rounded" style="accent-color: var(--btn-bg, #ff6600);">
                          <span class="text-sm font-medium" style="color: var(--color-text-primary, #111827);" data-i18n="checkout.saveCard">${t('checkout.saveCard')}</span>
                        </label>
                        <button type="button" class="w-full py-3 rounded-md font-bold text-center transition-colors hover:brightness-95"
                                style="background-color: var(--btn-bg, #ff6600); color: var(--btn-text, #ffffff);"
                                @click="
                                  if (!ccNum || !ccName) return;
                                  const firstDigit = ccNum[0];
                                  const brand = firstDigit === '4' ? 'VISA' : firstDigit === '5' ? 'MC' : firstDigit === '3' ? 'AMEX' : 'CARD';
                                  const masked = ccNum.replace(/.(?=.{4})/g, '*');
                                  selectedCard = { brand, masked, name: ccName };
                                  cardSaved = true;
                                  showForm = false;
                                  if(saveCard && window.addSavedCard) { window.addSavedCard({cardNumber: ccNum, expiry: ccExpiry, cardholderName: ccName, brand}); };
                                  expanded = false
                                ">
                          <span data-i18n="checkout.saveAndContinue">${t('checkout.saveAndContinue')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Option 2: Satıcı ile Anlaşmalı -->
            <label class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors"
                   :style="selectedMethod === 'anlasmali' ? 'border-color: var(--btn-bg, #ff6600); background-color: var(--color-primary-50, #fff9f5);' : 'border-color: var(--color-border-default, #e5e5e5); background-color: var(--color-surface, #ffffff);'">
              <input type="radio" name="payment_method" value="anlasmali" x-model="selectedMethod" class="mt-1" style="accent-color: var(--btn-bg, #ff6600);">
              <div>
                <span class="block text-sm font-semibold" :style="selectedMethod === 'anlasmali' ? 'color: var(--btn-bg, #ff6600);' : 'color: var(--color-text-primary, #111827);'" data-i18n="checkout.negotiatedWithSupplier">${t('checkout.negotiatedWithSupplier')}</span>
                <span class="block text-xs text-[#6b7280] mt-1" data-i18n="checkout.negotiatedDesc">${t('checkout.negotiatedDesc')}</span>
              </div>
            </label>

            <!-- Option 3: Çek / Senet -->
            <label class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors"
                   :style="selectedMethod === 'cek_senet' ? 'border-color: var(--btn-bg, #ff6600); background-color: var(--color-primary-50, #fff9f5);' : 'border-color: var(--color-border-default, #e5e5e5); background-color: var(--color-surface, #ffffff);'">
              <input type="radio" name="payment_method" value="cek_senet" x-model="selectedMethod" class="mt-1" style="accent-color: var(--btn-bg, #ff6600);">
              <div>
                <span class="block text-sm font-semibold" :style="selectedMethod === 'cek_senet' ? 'color: var(--btn-bg, #ff6600);' : 'color: var(--color-text-primary, #111827);'" data-i18n="checkout.checkDraft">${t('checkout.checkDraft')}</span>
                <span class="block text-xs text-[#6b7280] mt-1" data-i18n="checkout.checkDraftDesc">${t('checkout.checkDraftDesc')}</span>
              </div>
            </label>
          </div>
        </div>
      `;
    }

    // Single-seller checkout implies negotiated payment options
    const supplier = suppliers[0];
    const paymentName = isSupplierCheckout ? supplier.name : 'iSTOC';
    return `
      <div class="p-4 sm:p-6 bg-[#fafafa]" x-data="{ selectedMethod: 'elden' }">
        <h3 class="text-sm font-semibold text-[#111827] mb-4" data-i18n="checkout.paymentMethodFor" data-i18n-options='{"name":"${paymentName}"}'>${t('checkout.paymentMethodFor', { name: paymentName })}</h3>
        <div class="flex flex-col gap-3">
          <!-- Option 1: Elden Taksit -->
          <label class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors relative"
                 :style="selectedMethod === 'elden' ? 'border-color: var(--btn-bg, #ff6600); background-color: var(--color-primary-50, #fff9f5);' : 'border-color: var(--color-border-default, #e5e5e5); background-color: var(--color-surface, #ffffff);'">
            <input type="radio" name="payment_method" value="elden" x-model="selectedMethod" class="mt-1" :style="'color: var(--btn-bg, #ff6600); outline-color: var(--btn-bg, #ff6600)'" style="accent-color: var(--btn-bg, #ff6600);">
            <div>
              <span class="block text-sm font-bold text-[#111827]" data-i18n="checkout.handInstallment">${t('checkout.handInstallment')}</span>
              <span class="block text-xs text-[#6b7280] mt-1" data-i18n="checkout.handInstallmentDesc">${t('checkout.handInstallmentDesc')}</span>
            </div>
            <span class="absolute top-3 right-3 sm:top-4 sm:right-4 text-xs font-bold px-2 py-1 rounded" style="color: var(--btn-bg, #ff6600); background-color: var(--color-primary-100, #ffeedd);" data-i18n="common.recommended">${t('common.recommended')}</span>
          </label>

          <!-- Option 2: Satıcı ile Anlaşmalı -->
          <label class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors group"
                 :style="selectedMethod === 'anlasmali' ? 'border-color: var(--btn-bg, #ff6600); background-color: var(--color-primary-50, #fff9f5);' : 'border-color: var(--color-border-default, #e5e5e5); background-color: var(--color-surface, #ffffff);'">
            <input type="radio" name="payment_method" value="anlasmali" x-model="selectedMethod" class="mt-1" :style="'color: var(--btn-bg, #ff6600); outline-color: var(--btn-bg, #ff6600)'" style="accent-color: var(--btn-bg, #ff6600);">
            <div>
              <span class="block text-sm font-semibold" :style="selectedMethod === 'anlasmali' ? 'color: var(--btn-bg, #ff6600);' : 'color: var(--color-text-primary, #111827);'" data-i18n="checkout.negotiatedWithSupplier">${t('checkout.negotiatedWithSupplier')}</span>
              <span class="block text-xs text-[#6b7280] mt-1" data-i18n="checkout.negotiatedDesc">${t('checkout.negotiatedDesc')}</span>
            </div>
          </label>

          <!-- Option 3: Kredi veya Banka Kartı -->
          <div class="border rounded-lg transition-colors"
               :style="selectedMethod === 'kredi_karti' ? 'border-color: var(--btn-bg, #ff6600); background-color: var(--color-primary-50, #fff9f5);' : 'border-color: var(--color-border-default, #e5e5e5); background-color: var(--color-surface, #ffffff);'">
            <label class="flex items-start gap-3 p-4 cursor-pointer">
              <input type="radio" name="payment_method" value="kredi_karti" x-model="selectedMethod" class="mt-1" :style="'color: var(--btn-bg, #ff6600); outline-color: var(--btn-bg, #ff6600)'" style="accent-color: var(--btn-bg, #ff6600);">
              <div class="w-full">
                <span class="block text-sm font-semibold" :style="selectedMethod === 'kredi_karti' ? 'color: var(--btn-bg, #ff6600);' : 'color: var(--color-text-primary, #111827);'" data-i18n="checkout.creditDebitCard">${t('checkout.creditDebitCard')}</span>
                <span class="block text-xs text-[#6b7280] mt-1" data-i18n="checkout.creditCardDesc">${t('checkout.creditCardDesc')}</span>
              </div>
            </label>
            
            <div x-show="selectedMethod === 'kredi_karti'" x-cloak style="display: none;" class="px-3 pb-3 sm:px-4 sm:pb-4">
              <div class="pt-4 border-t" style="border-color: var(--color-border-default, #e5e5e5);">
                <div class="space-y-3 max-w-md"
                     x-data="{
                       ccNum: '', ccExpiry: '', ccName: '', saveCard: false,
                       cardSaved: false, selectedCard: {},
                       savedCards: [],
                       showForm: false,
                       init() {
                         this.savedCards = (window.getSavedCards ? window.getSavedCards() : []);
                         this.showForm = this.savedCards.length === 0;
                       },
                       selectCard(c) {
                         this.selectedCard = { brand: c.brand, masked: c.cardNumber, name: c.cardholderName };
                         this.cardSaved = true;
                         this.showForm = false;
                         expanded = false;
                       }
                     }">

                  <!-- Seçili kart mini özeti -->
                  <div x-show="cardSaved" x-cloak class="flex items-center gap-3 p-3 rounded-lg border" style="border-color: var(--btn-bg, #ff6600); background: var(--color-primary-50, #fff9f5);">
                    <div class="w-10 h-7 rounded flex items-center justify-center text-[10px] font-bold bg-white border" style="border-color: var(--color-border-default, #e5e5e5); color: #222;" x-text="selectedCard.brand || 'CARD'"></div>
                    <div class="flex-1">
                      <div class="text-sm font-semibold" style="color: var(--color-text-primary, #111827);" x-text="selectedCard.masked || ''"></div>
                      <div class="text-xs" style="color: var(--color-text-secondary, #6b7280);" x-text="selectedCard.name || ''"></div>
                    </div>
                    <button type="button" class="text-xs font-semibold underline bg-transparent border-none cursor-pointer" style="color: var(--btn-bg, #ff6600);"
                            @click="cardSaved = false; showForm = savedCards.length === 0;"><span data-i18n="common.change">${t('common.change')}</span></button>
                  </div>

                  <!-- Kayıtlı kartlar carousel -->
                  <div x-show="!cardSaved && savedCards.length > 0" x-cloak>
                    <p class="text-xs text-[#6b7280] mb-2" data-i18n="checkout.selectSavedCard">${t('checkout.selectSavedCard')}</p>
                    <div class="flex gap-3 overflow-x-auto pb-2" style="scrollbar-width: thin; scrollbar-color: #ccc transparent;">
                      <template x-for="c in savedCards" :key="c.id">
                        <div class="relative shrink-0 w-[160px] h-[96px] rounded-xl p-3 flex flex-col justify-between cursor-pointer group transition-all hover:scale-[1.03]"
                             style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%); box-shadow: 0 4px 12px rgba(0,0,0,0.18);"
                             @click="selectCard(c)">
                          <div class="flex items-center justify-between">
                            <span class="text-[9px] font-bold tracking-widest uppercase" style="color: rgba(255,255,255,0.5);">TradeHub</span>
                            <span class="text-[10px] font-black px-1 py-0.5 rounded" style="background: rgba(255,255,255,0.15); color: white;" x-text="c.brand"></span>
                          </div>
                          <div>
                            <div class="text-[11px] font-mono font-bold text-white tracking-widest mb-0.5 truncate" x-text="c.cardNumber"></div>
                            <div class="flex items-center justify-between">
                              <div class="text-[9px] text-white font-medium truncate max-w-[80px]" x-text="c.cardholderName"></div>
                              <div class="text-[9px] text-white font-medium" x-text="c.expiry || '—'"></div>
                            </div>
                          </div>
                          <div class="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-white/40 transition-all pointer-events-none"></div>
                        </div>
                      </template>
                      <!-- Yeni kart ekle tile -->
                      <div class="shrink-0 w-[160px] h-[96px] rounded-xl flex flex-col items-center justify-center gap-1 border-2 border-dashed cursor-pointer transition-all hover:scale-[1.03]"
                           style="border-color: #ccc;"
                           onmouseenter="this.style.borderColor='var(--btn-bg,#ff6600)'; this.style.background='var(--color-primary-50,#fff9f5)';"
                           onmouseleave="this.style.borderColor='#ccc'; this.style.background='transparent';"
                           @click="showForm = true;">
                        <span style="font-size: 20px; color: #888;">+</span>
                        <span class="text-[10px] font-medium text-center px-2" style="color: #555;" data-i18n="checkout.payWithNewCard">${t('checkout.payWithNewCard')}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Form (kart yoksa veya yeni kart istenince) -->
                  <div x-show="!cardSaved && showForm" x-cloak>
                    <template x-if="savedCards.length > 0">
                      <button type="button" class="text-xs underline bg-transparent border-none cursor-pointer mb-2" style="color: var(--btn-bg, #ff6600);"
                              @click="showForm = false;"><span data-i18n="checkout.backToSavedCards">${t('checkout.backToSavedCards')}</span></button>
                    </template>
                    <div class="mb-3">
                      <label class="block text-xs font-medium text-[#374151] mb-1" data-i18n="checkout.cardNumber">${t('checkout.cardNumber')}</label>
                      <input type="text" x-model="ccNum" class="w-full px-3 py-2 border rounded-md focus:outline-none" style="border-color: var(--color-border-default, #e5e5e5);" placeholder="${t('checkout.cardNumberPlaceholder')}" data-i18n-placeholder="checkout.cardNumberPlaceholder" x-on:focus="$el.style.borderColor='var(--btn-bg, #ff6600)'" x-on:blur="$el.style.borderColor='var(--color-border-default, #e5e5e5)'">
                    </div>
                    <div class="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label class="block text-xs font-medium text-[#374151] mb-1" data-i18n="checkout.expiryDateShort">${t('checkout.expiryDateShort')}</label>
                        <input type="text" x-model="ccExpiry" class="w-full px-3 py-2 border rounded-md focus:outline-none" style="border-color: var(--color-border-default, #e5e5e5);" placeholder="${t('checkout.expiryPlaceholder')}" data-i18n-placeholder="checkout.expiryPlaceholder" x-on:focus="$el.style.borderColor='var(--btn-bg, #ff6600)'" x-on:blur="$el.style.borderColor='var(--color-border-default, #e5e5e5)'">
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-[#374151] mb-1" data-i18n="checkout.cvv">${t('checkout.cvv')}</label>
                        <input type="text" class="w-full px-3 py-2 border rounded-md focus:outline-none" style="border-color: var(--color-border-default, #e5e5e5);" placeholder="${t('checkout.cvvPlaceholder')}" data-i18n-placeholder="checkout.cvvPlaceholder" x-on:focus="$el.style.borderColor='var(--btn-bg, #ff6600)'" x-on:blur="$el.style.borderColor='var(--color-border-default, #e5e5e5)'">
                      </div>
                    </div>
                    <div class="mb-3">
                      <label class="block text-xs font-medium text-[#374151] mb-1" data-i18n="checkout.cardholderName">${t('checkout.cardholderName')}</label>
                      <input type="text" x-model="ccName" class="w-full px-3 py-2 border rounded-md focus:outline-none" style="border-color: var(--color-border-default, #e5e5e5);" placeholder="${t('checkout.namePlaceholder')}" data-i18n-placeholder="checkout.namePlaceholder" x-on:focus="$el.style.borderColor='var(--btn-bg, #ff6600)'" x-on:blur="$el.style.borderColor='var(--color-border-default, #e5e5e5)'">
                    </div>
                    <div class="flex items-center gap-3 mb-3">
                       <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" class="h-5 object-contain" alt="Mastercard" />
                       <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" class="h-3.5 object-contain" alt="Visa" />
                    </div>
                    <div class="pt-3 border-t" style="border-color: var(--color-border-default, #e5e5e5);">
                      <label class="flex items-center gap-2 cursor-pointer mb-3">
                        <input type="checkbox" x-model="saveCard" class="w-4 h-4 rounded" style="accent-color: var(--btn-bg, #ff6600);">
                        <span class="text-xs font-medium" style="color: var(--color-text-primary, #111827);" data-i18n="checkout.saveCard">${t('checkout.saveCard')}</span>
                      </label>
                      <button type="button" class="w-full py-3 rounded-md font-bold text-center transition-colors hover:brightness-95"
                              style="background-color: var(--btn-bg, #ff6600); color: var(--btn-text, #ffffff);"
                              @click="
                                if (!ccNum || !ccName) return;
                                const firstDigit = ccNum[0];
                                const brand = firstDigit === '4' ? 'VISA' : firstDigit === '5' ? 'MC' : firstDigit === '3' ? 'AMEX' : 'CARD';
                                const masked = ccNum.replace(/.(?=.{4})/g, '*');
                                selectedCard = { brand, masked, name: ccName };
                                cardSaved = true;
                                showForm = false;
                                if(saveCard && window.addSavedCard) { window.addSavedCard({cardNumber: ccNum, expiry: ccExpiry, cardholderName: ccName, brand}); };
                                expanded = false
                              ">
                        <span data-i18n="checkout.saveAndContinue">${t('checkout.saveAndContinue')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Option 4: Çek / Senet -->
          <label class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors"
                 :style="selectedMethod === 'cek_senet' ? 'border-color: var(--btn-bg, #ff6600); background-color: var(--color-primary-50, #fff9f5);' : 'border-color: var(--color-border-default, #e5e5e5); background-color: var(--color-surface, #ffffff);'">
            <input type="radio" name="payment_method" value="cek_senet" x-model="selectedMethod" class="mt-1" :style="'color: var(--btn-bg, #ff6600); outline-color: var(--btn-bg, #ff6600)'" style="accent-color: var(--btn-bg, #ff6600);">
            <div>
              <span class="block text-sm font-semibold" :style="selectedMethod === 'cek_senet' ? 'color: var(--btn-bg, #ff6600);' : 'color: var(--color-text-primary, #111827);'" data-i18n="checkout.checkDraft">${t('checkout.checkDraft')}</span>
              <span class="block text-xs text-[#6b7280] mt-1" data-i18n="checkout.checkDraftDesc">${t('checkout.checkDraftDesc')}</span>
            </div>
          </label>
        </div>
      </div>
    `;
  };

  return `
    <section
      id="checkout-payment"
      class="checkout-section border-t border-[#e5e5e5]"
      x-data="checkoutAccordion({ initialExpanded: ${initialExpanded} })"
      :class="{ 'checkout-section--collapsed': !expanded }"
      ${!initialExpanded ? 'x-cloak' : ''}
    >
      <button
        class="checkout-section__header checkout-section__header--toggle w-full flex items-center gap-3 py-4 px-4 sm:py-5 sm:px-6 cursor-pointer hover:bg-[#fafafa] transition-colors"
        :aria-expanded="expanded"
        aria-expanded="${initialExpanded ? 'true' : 'false'}"
        @click="toggle()"
        type="button"
      >
        <svg class="checkout-section__icon w-6 h-6 min-w-[24px] text-[#6b7280]" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v12M9 9.5c0-1.1.9-2 2-2h2a2 2 0 010 4h-2a2 2 0 000 4h2a2 2 0 002-2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <h2 class="checkout-section__title text-lg font-bold text-[#111827] flex-1 text-left" data-i18n="checkout.paymentMethod">${t('checkout.paymentMethod')}</h2>
        <svg class="checkout-section__chevron w-5 h-5 text-[#6b7280] transition-transform duration-300 ${chevronRotate}" :class="{ 'rotate-180': expanded }" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <div class="checkout-section__content transition-[height] duration-300 ease-in-out overflow-hidden" style="${contentStyle}" x-ref="content">
        ${renderPaymentMethods()}
      </div>
    </section>
  `.trim();
}

/** @deprecated Migrated to Alpine.js x-data="checkoutAccordion" — see alpine.ts */
export function initAccordionSections(): void {
  // No-op: accordion interactions now handled by Alpine.js checkoutAccordion component
}
