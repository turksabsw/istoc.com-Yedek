/**
 * PriceDisplay Atom
 */

import { getCurrencySymbol } from '../../../utils/currency';

export interface PriceDisplayProps {
  amount: number;
  currency?: string;
  bold?: boolean;
  unit?: string;
  emphasize?: boolean;
}

function formatPriceLocal(amount: number, currency: string): string {
  return `${currency}${amount.toFixed(2).replace('.', ',')}`;
}

export function PriceDisplay({
  amount,
  currency = getCurrencySymbol(),
  bold: _bold = false,
  unit,
  emphasize: _emphasize = false,
}: PriceDisplayProps): string {
  const price = formatPriceLocal(amount, currency);
  let unitHtml = '';
  if (unit) {
    unitHtml = `
      <span class="inline-flex items-center text-[12px] text-[#666] ml-[2px] font-normal">
        ${unit}
        <svg class="w-[12px] h-[12px] ml-1 text-[#999] opacity-70 hover:opacity-100 transition-opacity" viewBox="0 0 1024 1024" fill="currentColor">
          <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
          <path d="M464 688a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm24-376c-39.7 0-72 32.3-72 72v120h48V384c0-13.2 10.8-24 24-24s24 10.8 24 24v104h48V384c0-39.7-32.3-72-72-72z"/>
        </svg>
      </span>
      
      <!-- Price by Quantity Tooltip -->
      <div class="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[220px] bg-white rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-[#eee] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none group-hover:pointer-events-auto">
        <!-- Up arrow indicator -->
        <div class="absolute -top-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-[#eee] rotate-45"></div>
        
        <div class="relative p-4 bg-white rounded-lg">
          <div class="flex items-center gap-2 mb-3">
            <svg class="w-4 h-4 text-[#2b88ff]" viewBox="0 0 1024 1024" fill="currentColor">
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/>
              <path d="M464 688a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm24-376c-39.7 0-72 32.3-72 72v120h48V384c0-13.2 10.8-24 24-24s24 10.8 24 24v104h48V384c0-39.7-32.3-72-72-72z"/>
            </svg>
            <span class="text-[14px] text-[#333] font-medium">Price by quantity</span>
            <button class="ml-auto text-[#999] hover:text-[#666]">
              <svg class="w-3.5 h-3.5" viewBox="0 0 1024 1024" fill="currentColor">
                <path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 0 0 203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"/>
              </svg>
            </button>
          </div>
          
          <div class="space-y-2 mt-3">
            <div class="flex justify-between items-center text-[13px]">
              <span class="text-[#666]">1-9</span>
              <span class="text-[#333] font-medium">${formatPriceLocal(amount, currency)}</span>
            </div>
            <div class="flex justify-between items-center text-[13px]">
              <span class="text-[#666] opacity-70">10-49</span>
              <span class="text-[#999] font-medium">${formatPriceLocal(amount * 0.95, currency)}</span>
            </div>
            <div class="flex justify-between items-center text-[13px]">
              <span class="text-[#666] opacity-70">50-999</span>
              <span class="text-[#999] font-medium">${formatPriceLocal(amount * 0.90, currency)}</span>
            </div>
            <div class="flex justify-between items-center text-[13px]">
              <span class="text-[#666] opacity-70">≥1000</span>
              <span class="text-[#999] font-medium">${formatPriceLocal(amount * 0.80, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="inline-flex items-baseline relative group cursor-pointer select-none">
      <span class="text-[16px] font-[700] text-[#111] whitespace-nowrap leading-none">${price}</span>
      ${unitHtml}
    </div>
  `;
}
