/**
 * 404 Page — Explore Top Deals Section
 * Category-tabbed product slider reusing TopDeals visual system.
 * Fully responsive down to 320px.
 */

import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/swiper-bundle.css';
import { formatPrice } from '../../utils/currency';

interface DealProduct {
  name: string;
  href: string;
  price: string;
  moq: string;
  image: string;
  badge?: string;
}

interface DealCategory {
  label: string;
  products: DealProduct[];
}

const dealCategories: DealCategory[] = [
  {
    label: 'Tumunu Gor',
    products: [
      { name: 'Wireless Bluetooth Headphones', href: '/pages/product-detail.html', price: '$12.50', moq: '2 adet', image: 'headphones', badge: 'Top pick' },
      { name: 'Smart Fitness Watch', href: '/pages/product-detail.html', price: '$8.99', moq: '5 adet', image: 'smartwatch' },
      { name: 'Waterproof Travel Backpack', href: '/pages/product-detail.html', price: '$6.80', moq: '10 adet', image: 'backpack' },
      { name: 'Running Sports Sneakers', href: '/pages/product-detail.html', price: '$9.20', moq: '5 cift', image: 'sneakers' },
      { name: 'Polarized UV Sunglasses', href: '/pages/product-detail.html', price: '$3.50', moq: '20 adet', image: 'sunglasses' },
      { name: '10000mAh Power Bank', href: '/pages/product-detail.html', price: '$7.20', moq: '10 adet', image: 'power-bank' },
      { name: 'Portable Bluetooth Speaker', href: '/pages/product-detail.html', price: '$5.60', moq: '10 adet', image: 'bluetooth-speaker' },
      { name: 'Energy Saving LED Bulb', href: '/pages/product-detail.html', price: '$1.20', moq: '50 adet', image: 'led-bulb' },
    ],
  },
  {
    label: 'Elektronik',
    products: [
      { name: 'Wireless Bluetooth Headphones', href: '/pages/product-detail.html', price: '$12.50', moq: '2 adet', image: 'headphones' },
      { name: 'Smart Fitness Watch', href: '/pages/product-detail.html', price: '$8.99', moq: '5 adet', image: 'smartwatch' },
      { name: '10000mAh Power Bank', href: '/pages/product-detail.html', price: '$7.20', moq: '10 adet', image: 'power-bank' },
      { name: 'Portable Bluetooth Speaker', href: '/pages/product-detail.html', price: '$5.60', moq: '10 adet', image: 'bluetooth-speaker' },
      { name: 'Energy Saving LED Bulb', href: '/pages/product-detail.html', price: '$1.20', moq: '50 adet', image: 'led-bulb' },
    ],
  },
  {
    label: 'Giyim & Aksesuar',
    products: [
      { name: 'Running Sports Sneakers', href: '/pages/product-detail.html', price: '$9.20', moq: '5 cift', image: 'sneakers' },
      { name: 'Polarized UV Sunglasses', href: '/pages/product-detail.html', price: '$3.50', moq: '20 adet', image: 'sunglasses' },
      { name: 'Waterproof Travel Backpack', href: '/pages/product-detail.html', price: '$6.80', moq: '10 adet', image: 'backpack' },
    ],
  },
  {
    label: 'Ev & Yasam',
    products: [
      { name: 'Energy Saving LED Bulb', href: '/pages/product-detail.html', price: '$1.20', moq: '50 adet', image: 'led-bulb' },
      { name: 'Portable Bluetooth Speaker', href: '/pages/product-detail.html', price: '$5.60', moq: '10 adet', image: 'bluetooth-speaker' },
    ],
  },
  {
    label: 'Spor & Eglence',
    products: [
      { name: 'Smart Fitness Watch', href: '/pages/product-detail.html', price: '$8.99', moq: '5 adet', image: 'smartwatch' },
      { name: 'Running Sports Sneakers', href: '/pages/product-detail.html', price: '$9.20', moq: '5 cift', image: 'sneakers' },
      { name: 'Waterproof Travel Backpack', href: '/pages/product-detail.html', price: '$6.80', moq: '10 adet', image: 'backpack' },
    ],
  },
];

const productVisuals: Record<string, { bg: string; accent: string; stroke: string; icon: string }> = {
  headphones: {
    bg: 'linear-gradient(180deg, #f0f4ff 0%, #e4ecff 100%)',
    accent: 'rgba(147,170,255,0.35)',
    stroke: '#4a5e9a',
    icon: '<path d="M5 12.5V12a7 7 0 0 1 14 0v.5"/><path d="M3 14a2 2 0 0 1 2-2h1v5H5a2 2 0 0 1-2-2v-1ZM18 12h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-1v-5Z"/>',
  },
  smartwatch: {
    bg: 'linear-gradient(180deg, #f2fdf6 0%, #e2f8ec 100%)',
    accent: 'rgba(134,224,170,0.35)',
    stroke: '#3a7a54',
    icon: '<rect x="7" y="3" width="10" height="18" rx="2"/><circle cx="12" cy="12" r="3.5"/><path d="M12 10v2l1.5 1"/>',
  },
  backpack: {
    bg: 'linear-gradient(180deg, #fef8f0 0%, #fdefd8 100%)',
    accent: 'rgba(240,196,120,0.35)',
    stroke: '#8a6930',
    icon: '<path d="M9 5a3 3 0 0 1 6 0"/><rect x="5" y="7" width="14" height="14" rx="2"/><path d="M9 7v4h6V7"/>',
  },
  sneakers: {
    bg: 'linear-gradient(180deg, #f8f0fe 0%, #efe0fd 100%)',
    accent: 'rgba(192,150,240,0.35)',
    stroke: '#6a4a9a',
    icon: '<path d="M3 16h18v2H3z"/><path d="M4 16c0-4 2-6 5-7l2 2h5c2 0 4 1.5 4 5"/><circle cx="7" cy="13" r="0.8"/><circle cx="10" cy="11.5" r="0.8"/>',
  },
  sunglasses: {
    bg: 'linear-gradient(180deg, #fff5f0 0%, #ffe8db 100%)',
    accent: 'rgba(255,170,120,0.35)',
    stroke: '#a05a30',
    icon: '<circle cx="7.5" cy="13" r="3.5"/><circle cx="16.5" cy="13" r="3.5"/><path d="M11 13h2M4 13l-1-2M20 13l1-2"/>',
  },
  'power-bank': {
    bg: 'linear-gradient(180deg, #f0f8ff 0%, #dceeff 100%)',
    accent: 'rgba(130,190,255,0.35)',
    stroke: '#3570a0',
    icon: '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M12 9v6M9 12h6"/><path d="M7 9h2M7 12h.01M7 15h2"/>',
  },
  'bluetooth-speaker': {
    bg: 'linear-gradient(180deg, #f5f0ff 0%, #ebe0ff 100%)',
    accent: 'rgba(170,140,255,0.35)',
    stroke: '#5a40a0',
    icon: '<rect x="6" y="4" width="12" height="16" rx="3"/><circle cx="12" cy="10" r="3"/><circle cx="12" cy="16" r="1.5"/>',
  },
  'led-bulb': {
    bg: 'linear-gradient(180deg, #fffce8 0%, #fff5c0 100%)',
    accent: 'rgba(255,220,80,0.35)',
    stroke: '#9a8020',
    icon: '<path d="M9 18h6M10 21h4"/><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z"/><path d="M10 14h4"/>',
  },
};

function renderProductPlaceholder(imageKey: string): string {
  const v = productVisuals[imageKey];
  if (!v) return '<div class="w-full h-full bg-gray-100 rounded-md"></div>';
  return `
    <div class="relative w-full h-full overflow-hidden rounded-md" style="background:${v.bg}" aria-hidden="true">
      <div class="absolute -right-4 -top-4 h-12 w-12 rounded-full opacity-60" style="background:${v.accent}"></div>
      <div class="absolute -left-3 bottom-0 h-10 w-10 rounded-full opacity-50" style="background:${v.accent}"></div>
      <div class="absolute inset-0 flex items-center justify-center">
        <svg class="h-14 w-14 sm:h-16 sm:w-16" fill="none" stroke-width="1.4" viewBox="0 0 24 24" style="stroke:${v.stroke}">${v.icon}</svg>
      </div>
    </div>
  `;
}

function renderProductCard(p: DealProduct): string {
  return `
    <div class="swiper-slide">
      <a href="${p.href}" class="group/card relative flex flex-col min-w-0" aria-label="${p.name}">
        ${p.badge ? `<span class="absolute top-2 left-2 z-10 inline-flex items-center rounded-sm text-[10px] font-bold leading-none px-1.5 py-0.5 text-white" style="background-color:#DE0505">${p.badge}</span>` : ''}
        <div class="aspect-square w-full mb-2 flex-shrink-0">
          ${renderProductPlaceholder(p.image)}
        </div>
        <p class="text-sm sm:text-[15px] font-bold leading-tight truncate" style="color:var(--color-error-600, #dc2626)">${formatPrice(p.price)}</p>
        <p class="mt-1 text-xs sm:text-[13px] font-medium leading-none truncate text-secondary-700 dark:text-secondary-300">MOQ: ${p.moq}</p>
      </a>
    </div>
  `;
}

function renderCategoryTabs(): string {
  return dealCategories.map((cat, i) => `
    <button
      type="button"
      class="explore-tab whitespace-nowrap px-1 pb-2 text-sm font-medium transition-colors duration-150 border-b-2 ${i === 0 ? 'text-primary-600 border-primary-500' : 'text-secondary-500 border-transparent hover:text-secondary-700'}"
      data-tab-index="${i}"
    >${cat.label}</button>
  `).join('');
}

function renderSwiperContainers(): string {
  return dealCategories.map((cat, i) => `
    <div class="explore-panel ${i === 0 ? '' : 'hidden'}" data-panel-index="${i}">
      <div class="group/explore relative">
        <div class="swiper explore-swiper-${i} overflow-hidden" aria-label="${cat.label} urunleri">
          <div class="swiper-wrapper">
            ${cat.products.map(p => renderProductCard(p)).join('')}
          </div>
        </div>
        <button aria-label="Onceki" class="explore-prev-${i} absolute left-0 top-[calc(50%-40px)] z-10 hidden h-9 w-9 -translate-x-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-md transition-all hover:text-gray-900 opacity-0 pointer-events-none md:flex group-hover/explore:opacity-100 group-hover/explore:pointer-events-auto disabled:opacity-0 disabled:pointer-events-none">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <button aria-label="Sonraki" class="explore-next-${i} absolute right-0 top-[calc(50%-40px)] z-10 hidden h-9 w-9 translate-x-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-md transition-all hover:text-gray-900 opacity-0 pointer-events-none md:flex group-hover/explore:opacity-100 group-hover/explore:pointer-events-auto disabled:opacity-0 disabled:pointer-events-none">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  `).join('');
}

export function ExploreDeals(): string {
  return `
    <section class="py-6 sm:py-8 lg:py-10 border-t border-secondary-100 dark:border-secondary-800">
      <div class="container-boxed">
        <h2 class="text-lg sm:text-xl font-bold text-secondary-900 dark:text-secondary-100 mb-4">
          En iyi firsatlari kesfedin
        </h2>

        <!-- Category tabs -->
        <div class="flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-hide mb-6 border-b border-secondary-100 dark:border-secondary-800">
          ${renderCategoryTabs()}
        </div>

        <!-- Product sliders -->
        ${renderSwiperContainers()}
      </div>
    </section>
  `;
}

export function initExploreDeals(): void {
  // Initialize swipers for each category
  const swipers: Swiper[] = [];

  dealCategories.forEach((_, i) => {
    const el = document.querySelector<HTMLElement>(`.explore-swiper-${i}`);
    if (!el) return;

    swipers.push(
      new Swiper(el, {
        modules: [Navigation],
        spaceBetween: 10,
        navigation: {
          nextEl: `.explore-next-${i}`,
          prevEl: `.explore-prev-${i}`,
        },
        breakpoints: {
          0: { slidesPerView: 2.3, spaceBetween: 8 },
          400: { slidesPerView: 2.8, spaceBetween: 10 },
          480: { slidesPerView: 3.3, spaceBetween: 10 },
          640: { slidesPerView: 4, spaceBetween: 12 },
          768: { slidesPerView: 4.5, spaceBetween: 12 },
          1024: { slidesPerView: 5.5, spaceBetween: 14 },
          1280: { slidesPerView: 6.5, spaceBetween: 16 },
        },
      })
    );
  });

  // Tab switching
  const tabs = document.querySelectorAll<HTMLButtonElement>('.explore-tab');
  const panels = document.querySelectorAll<HTMLElement>('.explore-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const idx = tab.dataset.tabIndex;
      if (!idx) return;

      // Update tabs
      tabs.forEach(t => {
        t.classList.remove('text-primary-600', 'border-primary-500');
        t.classList.add('text-secondary-500', 'border-transparent');
      });
      tab.classList.remove('text-secondary-500', 'border-transparent');
      tab.classList.add('text-primary-600', 'border-primary-500');

      // Update panels
      panels.forEach(p => p.classList.add('hidden'));
      const target = document.querySelector<HTMLElement>(`[data-panel-index="${idx}"]`);
      target?.classList.remove('hidden');

      // Update swiper on show
      const swiperIdx = parseInt(idx, 10);
      if (swipers[swiperIdx]) {
        swipers[swiperIdx].update();
      }
    });
  });
}
