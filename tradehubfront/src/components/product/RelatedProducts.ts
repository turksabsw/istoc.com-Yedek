/**
 * RelatedProducts Component
 * Horizontal Swiper slider of related product cards.
 * Uses Tailwind utility classes for card styling.
 */

import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/swiper-bundle.css';
import { t } from '../../i18n';
import { formatPrice } from '../../utils/currency';

interface RelatedProduct {
  name: string;
  href: string;
  price: string;
  discountPercent?: number;
  moqCount: number;
  moqUnit: 'pcs' | 'kg';
  soldCount: string;
  imageSrc: string;
  supplierYearCount?: number;
  supplierCountry?: string;
}

const relatedProducts: RelatedProduct[] = [
  {
    name: 'Stainless Steel Minimalist Chain Bracelet Unisex Adjustable...',
    href: '/pages/product-detail.html',
    price: '$2.10-3.60',
    discountPercent: 10,
    moqCount: 10,
    moqUnit: 'pcs',
    soldCount: '3,580',
    imageSrc: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=600&h=600&q=80',
    supplierYearCount: 4,
    supplierCountry: 'CN',
  },
  {
    name: '18K Gold Plated Crystal Pendant Necklace Women Fashion Jewelry...',
    href: '/pages/product-detail.html',
    price: '$0.90-1.60',
    moqCount: 20,
    moqUnit: 'pcs',
    soldCount: '8,950',
    imageSrc: 'https://images.unsplash.com/photo-1515562141589-67f0d569b6fc?auto=format&fit=crop&w=600&h=600&q=80',
    supplierYearCount: 6,
    supplierCountry: 'CN',
  },
  {
    name: 'Genuine Leather Minimalist Card Holder RFID Blocking Slim Wallet...',
    href: '/pages/product-detail.html',
    price: '$1.50-2.20',
    discountPercent: 15,
    moqCount: 50,
    moqUnit: 'pcs',
    soldCount: '6,730',
    imageSrc: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&h=600&q=80',
    supplierYearCount: 5,
    supplierCountry: 'CN',
  },
  {
    name: 'Handmade Resin Phone Case Mold Kit DIY Craft Silicone Set...',
    href: '/pages/product-detail.html',
    price: '$2.40-3.80',
    moqCount: 20,
    moqUnit: 'pcs',
    soldCount: '890',
    imageSrc: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=600&h=600&q=80',
    supplierYearCount: 2,
    supplierCountry: 'CN',
  },
  {
    name: 'Smart WiFi Security Camera 1080P Indoor Wireless Surveillance...',
    href: '/pages/product-detail.html',
    price: '$8.50-12',
    discountPercent: 8,
    moqCount: 10,
    moqUnit: 'pcs',
    soldCount: '1,280',
    imageSrc: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&h=600&q=80',
    supplierYearCount: 7,
    supplierCountry: 'CN',
  },
  {
    name: 'Oversize Cotton Vintage Print T-Shirt Streetwear Graphic Tee...',
    href: '/pages/product-detail.html',
    price: '$3.20-4.50',
    discountPercent: 10,
    moqCount: 30,
    moqUnit: 'pcs',
    soldCount: '9,450',
    imageSrc: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&h=600&q=80',
    supplierYearCount: 4,
    supplierCountry: 'CN',
  },
  {
    name: 'PU Leather Crossbody Mini Bag Women Casual Fashion Design...',
    href: '/pages/product-detail.html',
    price: '$1.20-2.40',
    moqCount: 50,
    moqUnit: 'pcs',
    soldCount: '14,200',
    imageSrc: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&h=600&q=80',
    supplierYearCount: 3,
    supplierCountry: 'CN',
  },
  {
    name: 'Natural Gemstone Beaded Bracelet Healing Crystal Chakra Set...',
    href: '/pages/product-detail.html',
    price: '$1.20-2.80',
    discountPercent: 12,
    moqCount: 10,
    moqUnit: 'pcs',
    soldCount: '7,890',
    imageSrc: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=600&h=600&q=80',
    supplierYearCount: 3,
    supplierCountry: 'CN',
  },
];

function renderRelatedSlide(card: RelatedProduct): string {
  const safeName = card.name.replace(/"/g, '&quot;');
  const unitLabel = card.moqUnit === 'kg' ? t('productGrid.kg') : t('productGrid.pcs');
  const moqText = `${card.moqCount} ${unitLabel}`;
  const soldText = t('productGrid.unitsSold', { count: card.soldCount });
  const discountText = card.discountPercent
    ? t('productGrid.discount', { percent: card.discountPercent })
    : '';
  const supplierYearsText = card.supplierYearCount
    ? `${card.supplierYearCount} ${t('productGrid.yr')}`
    : '';

  return `
    <div class="swiper-slide">
      <a
        class="flex flex-col h-full rounded-lg overflow-hidden bg-white border border-gray-100 transition-shadow hover:shadow-md"
        href="${card.href}"
        aria-label="${safeName}"
      >
        <!-- Image -->
        <div class="relative">
          <div class="aspect-square w-full overflow-hidden bg-gray-50">
            <img
              class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              src="${card.imageSrc}"
              alt="${safeName}"
              loading="lazy"
            />
          </div>
        </div>

        <!-- Content -->
        <div class="flex flex-col flex-1 gap-1.5 p-3">
          <!-- Title -->
          <p class="text-[13px] leading-[1.4] line-clamp-3 text-gray-800" title="${safeName}">${card.name}</p>

          <!-- Price + discount -->
          <div class="flex flex-wrap items-baseline gap-x-2">
            <span class="text-sm font-bold text-gray-900">${formatPrice(card.price)}</span>
            ${discountText ? `<span class="text-xs font-medium text-red-500">${discountText}</span>` : ''}
          </div>

          <!-- MOQ + sold -->
          <div class="text-xs text-gray-500 truncate">
            <span class="mr-1.5 font-medium text-gray-600">${moqText}</span>
            <span>${soldText}</span>
          </div>

          <!-- Supplier info -->
          <div class="mt-auto flex items-center gap-1.5 text-xs text-gray-400">
            ${supplierYearsText ? `<span class="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">${supplierYearsText}</span>` : ''}
            ${card.supplierCountry ? `<span class="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">${card.supplierCountry}</span>` : ''}
          </div>
        </div>
      </a>
    </div>
  `;
}

export function RelatedProducts(): string {
  return `
    <section class="related-products-section max-[374px]:px-3 max-[374px]:py-4" style="background: var(--pd-related-bg, #f8f8f8);">
        <div class="flex items-center justify-between mb-4 max-[374px]:mb-3">
          <h2 class="text-lg font-bold max-[374px]:text-base" style="color: var(--pd-title-color, #111827);">${t('product.similarProducts')}</h2>
          <a href="#" class="text-sm font-medium hover:underline max-[374px]:text-xs" style="color: var(--pd-breadcrumb-link-color, #cc9900);">${t('product.viewAllProducts')} →</a>
        </div>

        <div class="group/related-slider relative">
          <div class="swiper related-products-swiper overflow-hidden">
            <div class="swiper-wrapper">
              ${relatedProducts.map(p => renderRelatedSlide(p)).join('')}
            </div>
          </div>

          <!-- Navigation Arrows -->
          <button
            aria-label="${t('product.previousProducts')}"
            class="related-prev absolute left-0 top-[35%] z-10 hidden h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-lg transition-all duration-200 hover:text-gray-900 opacity-0 pointer-events-none md:flex group-hover/related-slider:opacity-100 group-hover/related-slider:pointer-events-auto disabled:opacity-0 disabled:pointer-events-none"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <button
            aria-label="${t('product.nextProducts')}"
            class="related-next absolute right-0 top-[35%] z-10 hidden h-10 w-10 translate-x-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-lg transition-all duration-200 hover:text-gray-900 opacity-0 pointer-events-none md:flex group-hover/related-slider:opacity-100 group-hover/related-slider:pointer-events-auto disabled:opacity-0 disabled:pointer-events-none"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
    </section>
  `;
}

export function initRelatedProducts(): void {
  const el = document.querySelector<HTMLElement>('.related-products-swiper');
  if (!el) return;

  new Swiper(el, {
    modules: [Navigation],
    spaceBetween: 12,
    navigation: {
      nextEl: '.related-next',
      prevEl: '.related-prev',
    },
    breakpoints: {
      0: { slidesPerView: 1.4, spaceBetween: 8 },
      375: { slidesPerView: 2.3, spaceBetween: 10 },
      480: { slidesPerView: 3.3, spaceBetween: 10 },
      640: { slidesPerView: 4, spaceBetween: 12 },
      768: { slidesPerView: 4, spaceBetween: 12 },
      1024: { slidesPerView: 3.5, spaceBetween: 14 },
      1280: { slidesPerView: 4, spaceBetween: 16 },
    },
  });
}
