/**
 * TailoredSelections Component
 * Alibaba-style: Swiper slider with curated collection cards.
 * Each card has a title, views subtitle, two product images side by side, and prices.
 */

import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/swiper-bundle.css';
import { t } from '../../i18n';
import { formatPrice } from '../../utils/currency';

interface CollectionProduct {
  name: string;
  price: string;
  imageSrc: string;
}

interface TailoredCollection {
  title: string;
  titleKey: string;
  views: string;
  viewsCount: string;
  href: string;
  products: [CollectionProduct, CollectionProduct];
}

const tailoredCollections: TailoredCollection[] = [
  {
    title: 'Office Tech Essentials',
    titleKey: 'tailored.officeTech',
    views: '28K+ views',
    viewsCount: '28K+',
    href: '/pages/product-detail.html',
    products: [
      { name: 'Business Laptop', price: '$320.00', imageSrc: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&h=400&q=80' },
      { name: 'Drawing Tablet', price: '$85.00', imageSrc: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=400&h=400&q=80' },
    ],
  },
  {
    title: 'Photography Gear',
    titleKey: 'tailored.photographyGear',
    views: '15K+ views',
    viewsCount: '15K+',
    href: '/pages/product-detail.html',
    products: [
      { name: 'Mirrorless Camera', price: '$480.00', imageSrc: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&h=400&q=80' },
      { name: 'FPV Drone', price: '$260.00', imageSrc: 'https://images.unsplash.com/photo-1507582020474-9a35b7d455d9?auto=format&fit=crop&w=400&h=400&q=80' },
    ],
  },
  {
    title: 'Fashion Forward',
    titleKey: 'tailored.fashionForward',
    views: '42K+ views',
    viewsCount: '42K+',
    href: '/pages/product-detail.html',
    products: [
      { name: 'Winter Jacket', price: '$45.00', imageSrc: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&h=400&q=80' },
      { name: 'Leather Handbag', price: '$32.00', imageSrc: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&h=400&q=80' },
    ],
  },
  {
    title: 'Audio & Sound',
    titleKey: 'tailored.audioSound',
    views: '31K+ views',
    viewsCount: '31K+',
    href: '/pages/product-detail.html',
    products: [
      { name: 'Wireless Headphones', price: '$28.50', imageSrc: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&h=400&q=80' },
      { name: 'Bluetooth Speaker', price: '$19.00', imageSrc: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=400&h=400&q=80' },
    ],
  },
  {
    title: 'Smart Accessories',
    titleKey: 'tailored.smartAccessories',
    views: '56K+ views',
    viewsCount: '56K+',
    href: '/pages/product-detail.html',
    products: [
      { name: 'Smart Watch', price: '$42.00', imageSrc: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&h=400&q=80' },
      { name: 'Sport Sneakers', price: '$35.00', imageSrc: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&h=400&q=80' },
    ],
  },
];

function renderProductImage(product: CollectionProduct): string {
  return `
    <div class="relative h-full w-full overflow-hidden rounded-md bg-gray-100" aria-hidden="true">
      <img
        src="${product.imageSrc}"
        alt="${product.name}"
        loading="lazy"
        class="w-full h-full object-cover"
      />
    </div>
  `;
}

function renderCollectionSlide(collection: TailoredCollection): string {
  const [product1, product2] = collection.products;
  return `
    <div class="swiper-slide tailored-slide">
      <a
        href="${collection.href}"
        class="group/col flex flex-col h-full rounded-md overflow-hidden cursor-pointer"
        style="background: var(--tailored-card-bg, #ffffff); padding: var(--space-card-padding, 16px);"
        aria-label="${t(collection.titleKey)}"
      >
        <!-- Title -->
        <h3
          class="truncate font-bold leading-tight"
          style="color: var(--tailored-collection-title-color, #222222); font-size: var(--text-product-price, 20px);"
        ><span data-i18n="${collection.titleKey}">${t(collection.titleKey)}</span></h3>

        <!-- Views subtitle -->
        <p
          class="truncate"
          style="color: var(--tailored-views-color, #767676); font-size: var(--text-product-meta, 16px); margin: 0 0 12px;"
        ><span data-i18n="tailored.views" data-i18n-options='${JSON.stringify({ count: collection.viewsCount })}'>${t('tailored.views', { count: collection.viewsCount })}</span></p>

        <!-- Product images side by side — 164x164 each -->
        <div class="flex gap-2 flex-1">
          <div class="flex-1 flex flex-col">
            <div class="aspect-square w-full">
              ${renderProductImage(product1)}
            </div>
            <p
              class="font-bold leading-none truncate"
              style="color: var(--tailored-price-color, #222222); font-size: var(--text-product-price, 20px); margin-top: 8px;"
            >${formatPrice(product1.price)}</p>
          </div>
          <div class="flex-1 flex flex-col">
            <div class="aspect-square w-full">
              ${renderProductImage(product2)}
            </div>
            <p
              class="font-bold leading-none truncate"
              style="color: var(--tailored-price-color, #222222); font-size: var(--text-product-price, 20px); margin-top: 8px;"
            >${formatPrice(product2.price)}</p>
          </div>
        </div>
      </a>
    </div>
  `;
}

export function initTailoredSelections(): void {
  const el = document.querySelector<HTMLElement>('.tailored-swiper');
  if (!el) return;

  new Swiper(el, {
    modules: [Navigation],
    spaceBetween: 8,
    navigation: {
      nextEl: '.tailored-next',
      prevEl: '.tailored-prev',
    },
    breakpoints: {
      0: {
        slidesPerView: 1.2,
        spaceBetween: 8,
      },
      480: {
        slidesPerView: 1.5,
        spaceBetween: 8,
      },
      640: {
        slidesPerView: 2,
        spaceBetween: 8,
      },
      1024: {
        slidesPerView: 3,
        spaceBetween: 8,
      },
    },
  });
}

export function TailoredSelections(): string {
  return `
    <section class="py-4 lg:py-6" aria-label="Tailored Selections" style="margin-top: 28px;">
      <div class="container-boxed">
        <div class="rounded-md" style="background-color: var(--tailored-bg, #F5F5F5); padding: var(--space-card-padding, 16px);">
          <!-- Section header -->
          <div class="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2
                class="text-[20px] sm:text-[22px] font-bold leading-tight"
                style="color: var(--tailored-title-color, #111827);"
              ><span data-i18n="tailored.title">${t('tailored.title')}</span></h2>
            </div>
            <a
              href="/pages/tailored-selections.html"
              class="flex-shrink-0 text-[13px] font-semibold transition-colors duration-150 hover:underline"
              style="color: var(--tailored-link-color, #111827);"
            ><span data-i18n="common.viewMore">${t('common.viewMore')}</span> &gt;</a>
          </div>

          <!-- Swiper slider -->
          <div class="group/tailored relative">
            <div class="swiper tailored-swiper overflow-hidden" aria-label="Tailored selection collections">
              <div class="swiper-wrapper">
                ${tailoredCollections.map(c => renderCollectionSlide(c)).join('')}
              </div>
            </div>

            <!-- Navigation arrows -->
            <button
              aria-label="Previous collections"
              class="tailored-prev absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-lg transition-all duration-200 hover:text-gray-900 opacity-0 pointer-events-none md:flex group-hover/tailored:opacity-100 group-hover/tailored:pointer-events-auto disabled:opacity-0 disabled:pointer-events-none"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>

            <button
              aria-label="Next collections"
              class="tailored-next absolute right-0 top-1/2 z-10 hidden h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-lg transition-all duration-200 hover:text-gray-900 opacity-0 pointer-events-none md:flex group-hover/tailored:opacity-100 group-hover/tailored:pointer-events-auto disabled:opacity-0 disabled:pointer-events-none"
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
