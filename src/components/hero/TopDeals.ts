/**
 * TopDeals Component
 * Alibaba-style: Swiper slider with individual product cards, spacing between them,
 * and prev/next navigation arrows.
 */

import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/swiper-bundle.css';
import { t } from '../../i18n';
import { formatPrice } from '../../utils/currency';

interface TopDealCard {
  name: string;
  href: string;
  price: string;
  originalPrice: string;
  moqCount: number;
  moqUnitKey: string;
  badge?: string;
  badgeKey?: string;
  imageSrc: string;
}

const topDealCards: TopDealCard[] = [
  {
    name: 'Wireless Bluetooth Headphones',
    href: '/pages/product-detail.html',
    price: '$12.50',
    originalPrice: '$25.00',
    moqCount: 2,
    moqUnitKey: 'topDeals.pieces',
    badge: 'Top picks',
    badgeKey: 'topDeals.topPicks',
    imageSrc: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    name: 'Smart Fitness Watch',
    href: '/pages/product-detail.html',
    price: '$8.99',
    originalPrice: '$18.00',
    moqCount: 5,
    moqUnitKey: 'topDeals.pieces',
    imageSrc: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    name: 'Waterproof Travel Backpack',
    href: '/pages/product-detail.html',
    price: '$6.80',
    originalPrice: '$15.50',
    moqCount: 10,
    moqUnitKey: 'topDeals.pieces',
    imageSrc: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    name: 'Running Sports Sneakers',
    href: '/pages/product-detail.html',
    price: '$9.20',
    originalPrice: '$22.00',
    moqCount: 5,
    moqUnitKey: 'topDeals.pairs',
    imageSrc: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    name: 'Polarized UV Sunglasses',
    href: '/pages/product-detail.html',
    price: '$3.50',
    originalPrice: '$8.99',
    moqCount: 20,
    moqUnitKey: 'topDeals.pieces',
    imageSrc: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    name: '10000mAh Power Bank',
    href: '/pages/product-detail.html',
    price: '$7.20',
    originalPrice: '$14.00',
    moqCount: 10,
    moqUnitKey: 'topDeals.pieces',
    imageSrc: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    name: 'Portable Bluetooth Speaker',
    href: '/pages/product-detail.html',
    price: '$5.60',
    originalPrice: '$12.00',
    moqCount: 10,
    moqUnitKey: 'topDeals.pieces',
    imageSrc: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    name: 'Energy Saving LED Bulb',
    href: '/pages/product-detail.html',
    price: '$1.20',
    originalPrice: '$3.50',
    moqCount: 50,
    moqUnitKey: 'topDeals.pieces',
    imageSrc: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&w=400&h=400&q=80',
  },
];

function renderDealImage(card: TopDealCard): string {
  return `
    <div class="relative w-full h-full overflow-hidden rounded-md bg-gray-100" aria-hidden="true">
      <img
        src="${card.imageSrc}"
        alt="${card.name}"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-300 group-hover/deal:scale-110"
      />
    </div>
  `;
}

function lightningBoltIcon(): string {
  return `
    <svg class="h-4 w-auto flex-shrink-0" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.5948 30.1888L0.735054 19.2232C0.221831 18.5826 0.604285 17.5239 1.34894 17.5239L6.20746 17.5239C6.77424 10.7461 10.1716 2.20349 20.7371 0.585977C21.9772 0.396125 23.4376 0.585405 24.5 0.585787C16.6194 3.93595 16.33 12.2572 16.2123 17.5239L21.5078 17.5239C22.2623 17.5239 22.6405 18.6069 22.1072 19.2408L11.8082 30.2064C11.4715 30.6066 10.9232 30.5987 10.5948 30.1888Z" fill="url(#paint0_linear_topdeals)"/>
      <defs>
        <linearGradient id="paint0_linear_topdeals" x1="11.4284" y1="30.5016" x2="11.2898" y2="-0.282995" gradientUnits="userSpaceOnUse">
          <stop stop-color="#FF988C"/>
          <stop offset="1" stop-color="#FFECEB"/>
        </linearGradient>
      </defs>
    </svg>
  `;
}

function renderDealSlide(card: TopDealCard): string {
  return `
    <div class="swiper-slide">
      <a
        href="${card.href}"
        class="group/deal relative flex flex-col min-w-0"
        aria-label="${card.name}"
      >
        ${card.badgeKey ? `
          <span
            class="absolute top-2 left-2 z-10 inline-flex items-center rounded-sm text-[10px] font-bold leading-none"
            style="background-color: var(--topdeals-badge-bg, #DE0505); color: var(--topdeals-badge-text, #ffffff); padding: 2px 4px;"
          ><span data-i18n="${card.badgeKey}">${t(card.badgeKey)}</span></span>
        ` : ''}

        <!-- Square image area -->
        <div class="aspect-square w-full mb-3 flex-shrink-0">
          ${renderDealImage(card)}
        </div>

        <!-- Price row -->
        <div class="flex items-center gap-1.5 min-w-0">
          <span
            class="inline-flex items-center gap-0.5 rounded-sm shrink-0"
            style="background: var(--topdeals-price-bg, #FFEDED); padding: 2px 12px 2px 4px;"
          >
            ${lightningBoltIcon()}
            <span
              class="text-(length:--text-product-price) font-bold leading-none"
              style="color: var(--topdeals-price-color, #dc2626); font-size: var(--text-product-price, 15px);"
            >${formatPrice(card.price)}</span>
          </span>
        </div>

        <!-- MOQ -->
        <p
          class="mt-1.5 font-medium leading-none truncate"
          style="color: var(--topdeals-moq-color, #222222); font-size: var(--text-product-meta, 14px);"
        ><span data-i18n="topDeals.moq" data-i18n-options='${JSON.stringify({ count: card.moqCount, unit: t(card.moqUnitKey) })}'>${t('topDeals.moq', { count: card.moqCount, unit: t(card.moqUnitKey) })}</span></p>
      </a>
    </div>
  `;
}

export function initTopDeals(): void {
  const el = document.querySelector<HTMLElement>('.topdeals-swiper');
  if (!el) return;

  new Swiper(el, {
    modules: [Navigation],
    spaceBetween: 12,
    navigation: {
      nextEl: '.topdeals-next',
      prevEl: '.topdeals-prev',
    },
    breakpoints: {
      0: {
        slidesPerView: 2.3,
        spaceBetween: 10,
      },
      480: {
        slidesPerView: 3.3,
        spaceBetween: 10,
      },
      640: {
        slidesPerView: 4,
        spaceBetween: 12,
      },
      768: {
        slidesPerView: 4.5,
        spaceBetween: 12,
      },
      1024: {
        slidesPerView: 5.5,
        spaceBetween: 14,
      },
      1280: {
        slidesPerView: 6.5,
        spaceBetween: 16,
      },
    },
  });
}

export function TopDeals(): string {
  return `
    <section class="py-4 lg:py-6" aria-label="Top Deals" style="margin-top: 28px;">
      <div class="container-boxed">
        <div class="rounded-md" style="background-color: var(--topdeals-bg, #F8F8F8); padding: var(--space-card-padding, 16px);">
        <!-- Section header -->
        <div class="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2
              class="text-[20px] sm:text-[22px] font-bold leading-tight"
              style="color: var(--topdeals-title-color, #111827);"
            ><span data-i18n="topDeals.title">${t('topDeals.title')}</span></h2>
            <p
              class="mt-0.5 text-[13px]"
              style="color: var(--topdeals-subtitle-color, #6b7280);"
            ><span data-i18n="topDeals.subtitle">${t('topDeals.subtitle')}</span></p>
          </div>
          <a
            href="/pages/top-deals.html"
            class="flex-shrink-0 text-[13px] font-semibold transition-colors duration-150 hover:underline"
            style="color: var(--topdeals-link-color, #111827);"
          ><span data-i18n="common.viewMore">${t('common.viewMore')}</span> &gt;</a>
        </div>

        <!-- Swiper slider -->
        <div class="group/topdeals relative">
          <div class="swiper topdeals-swiper overflow-hidden" aria-label="Top deal products">
            <div class="swiper-wrapper">
              ${topDealCards.map(card => renderDealSlide(card)).join('')}
            </div>
          </div>

          <!-- Navigation arrows -->
          <button
            aria-label="Previous deals"
            class="topdeals-prev absolute left-0 top-[94px] z-10 hidden h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-lg transition-all duration-200 hover:text-gray-900 opacity-0 pointer-events-none md:flex group-hover/topdeals:opacity-100 group-hover/topdeals:pointer-events-auto disabled:opacity-0 disabled:pointer-events-none"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <button
            aria-label="Next deals"
            class="topdeals-next absolute right-0 top-[94px] z-10 hidden h-10 w-10 translate-x-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-lg transition-all duration-200 hover:text-gray-900 opacity-0 pointer-events-none md:flex group-hover/topdeals:opacity-100 group-hover/topdeals:pointer-events-auto disabled:opacity-0 disabled:pointer-events-none"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
        </div>
      </div>
    </section>
  `;
}
