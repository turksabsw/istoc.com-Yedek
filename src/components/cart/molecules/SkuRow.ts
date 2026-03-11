/**
 * SKU row inside product card.
 * Alpine.js: Uses x-data on article for @click + $dispatch on delete button.
 * Checkbox and QuantityInput children have their own Alpine scopes.
 */

import type { CartSku } from '../../../types/cart';
import { Checkbox } from '../atoms/Checkbox';
import { PriceDisplay } from '../atoms/PriceDisplay';
import { QuantityInput } from '../atoms/QuantityInput';
import trashIcon from '../../../assets/images/trash.png';

export interface SkuRowProps {
  sku: CartSku;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function SkuRow({ sku }: SkuRowProps): string {
  return `
    <article class="sc-c-sku-container-new rounded-xl grid grid-cols-[auto_92px_minmax(0,1fr)] gap-3 items-start p-3 max-sm:p-2 max-sm:grid-cols-[auto_72px_minmax(0,1fr)] max-sm:gap-2 transition-colors" data-sku-id="${escapeHtml(sku.id)}" x-data>
      <div class="pt-9 max-sm:pt-7">
        ${Checkbox({ id: `sku-checkbox-${sku.id}`, checked: sku.selected, onChange: `sku-select-${sku.id}` })}
      </div>

      <div class="w-[92px] h-[92px] max-sm:w-[72px] max-sm:h-[72px] rounded-lg border border-border-default overflow-hidden bg-surface-muted">
        <img src="${escapeHtml(sku.skuImage)}" alt="SKU ${escapeHtml(sku.id)}" class="w-full h-full object-cover" loading="lazy" />
      </div>

      <div class="min-w-0">
        <div class="flex items-start justify-between gap-2">
          <span class="text-sm text-text-body truncate">${escapeHtml(sku.variantText)}</span>

          <div class="relative group">
            <button type="button" class="sc-c-sku-delete-btn w-8 h-8 inline-flex items-center justify-center rounded-full text-text-tertiary hover:bg-black transition-colors" data-sku-id="${escapeHtml(sku.id)}" @click="$dispatch('sku-delete', { skuId: '${escapeHtml(sku.id)}' })" aria-label="SKU sil">
              <img src="${trashIcon}" class="w-[18px] h-[18px] object-contain group-hover:invert transition-all" alt="Sil" />
            </button>
            <div class="absolute right-0 top-full mt-2 w-max px-3 py-2 bg-black text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Remove this variation
              <!-- Tooltip stem -->
              <div class="absolute -top-1 right-3 w-2 h-2 bg-black rotate-45"></div>
            </div>
          </div>
        </div>

        <div class="mt-3 flex items-end justify-between gap-3 flex-wrap">
          ${PriceDisplay({ amount: sku.unitPrice, currency: sku.currency, unit: `/${sku.unit}` })}
          <div class="flex flex-col items-end">
            ${QuantityInput({ id: `sku-qty-${sku.id}`, value: sku.quantity, min: sku.minQty, max: sku.maxQty })}
            <div class="sc-c-sku-moq-warning mt-2 text-right text-[14px] leading-[20px] text-[#dc2626] hidden">
              <span class="sc-c-sku-moq-missing">0</span> more required to check out
              <button
                type="button"
                class="ml-1 underline font-semibold text-[#8b1e1e] hover:opacity-80"
                @click="$dispatch('sku-fill-min', { skuId: '${escapeHtml(sku.id)}' })"
              >
                Add all
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  `.trim();
}

/** @deprecated Alpine.js handles sku-delete dispatch declaratively via @click + $dispatch. Kept as no-op for backward compatibility. */
export function initSkuRows(_container?: HTMLElement): void {
  // No-op — Alpine x-data on article + @click="$dispatch('sku-delete', ...)" handles delete dispatch.
}
