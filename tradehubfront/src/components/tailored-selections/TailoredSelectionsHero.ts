/**
 * TailoredSelectionsHero Component
 * Dark gradient hero section with Swiper carousel of category cards.
 * Each card has background image, title, description, and "Insights" link.
 */

import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/swiper-bundle.css';
import { t } from '../../i18n';
import type { TailoredCategory } from '../../data/mockTailoredSelections';

function renderCategorySlide(category: TailoredCategory, index: number): string {
    return `
    <div class="swiper-slide" style="height: auto;">
      <div
        class="relative rounded-xl overflow-hidden h-full min-h-[280px] sm:min-h-[320px] lg:min-h-[360px] group cursor-pointer"
        style="background: linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.65) 100%);"
      >
        <!-- Background image -->
        <img
          src="${category.imageSrc}"
          alt="${category.title}"
          loading="${index <= 2 ? 'eager' : 'lazy'}"
          class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <!-- Gradient overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

        <!-- Content overlay -->
        <div class="relative z-10 flex flex-col justify-end h-full p-5 sm:p-6">
          <h3 class="text-white font-bold text-lg sm:text-xl leading-tight mb-2">
            ${category.title}
          </h3>
          <p class="text-white/85 text-sm leading-relaxed line-clamp-2 mb-3">
            ${category.description}
          </p>
          <a
            href="/pages/tailored-selections.html"
            class="inline-flex items-center gap-1.5 text-white text-sm font-medium hover:underline"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/>
            </svg>
            <span data-i18n="tailoredPage.insights">${t('tailoredPage.insights')}</span> &gt;
          </a>
        </div>
      </div>
    </div>
  `;
}

export function initTailoredSelectionsHero(): void {
    const el = document.querySelector<HTMLElement>('.ts-hero-swiper');
    if (!el) return;

    new Swiper(el, {
        modules: [Navigation],
        spaceBetween: 16,
        centeredSlides: true,
        loop: true,
        navigation: {
            nextEl: '.ts-hero-next',
            prevEl: '.ts-hero-prev',
        },
        breakpoints: {
            0: {
                slidesPerView: 1.15,
                spaceBetween: 8,
            },
            480: {
                slidesPerView: 1.3,
                spaceBetween: 12,
            },
            768: {
                slidesPerView: 1.8,
                spaceBetween: 16,
            },
            1024: {
                slidesPerView: 2.5,
                spaceBetween: 16,
            },
            1280: {
                slidesPerView: 3,
                spaceBetween: 20,
            },
        },
    });
}

export function TailoredSelectionsHero(categories: TailoredCategory[]): string {
    return `
    <section class="relative overflow-hidden" style="background: linear-gradient(180deg, #3a2a1a 0%, #5c3d2e 40%, #4a3425 100%);">
      <!-- Decorative elements -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="absolute -top-20 -left-20 w-64 h-64 rounded-full" style="background: radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%);"></div>
        <div class="absolute top-10 right-10 w-48 h-48 rounded-full" style="background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);"></div>
      </div>

      <div class="relative z-10 pt-8 pb-4 sm:pt-12 sm:pb-6 lg:pt-16 lg:pb-8">
        <!-- Title -->
        <h1 class="text-white text-center text-2xl sm:text-3xl lg:text-4xl font-bold mb-8 sm:mb-10 lg:mb-12">
          <span data-i18n="tailoredPage.title">${t('tailoredPage.title')}</span>
        </h1>

        <!-- Category Carousel -->
        <div class="group/hero relative max-w-[1400px] mx-auto px-4 sm:px-6">
          <div class="swiper ts-hero-swiper overflow-hidden" aria-label="Tailored selection categories">
            <div class="swiper-wrapper" style="align-items: stretch;">
              ${categories.map((c, i) => renderCategorySlide(c, i)).join('')}
            </div>
          </div>

          <!-- Navigation arrows -->
          <button
            aria-label="Previous categories"
            class="ts-hero-prev absolute left-1 sm:left-2 top-1/2 z-10 h-10 w-10 -translate-y-1/2 flex items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg transition-all duration-200 hover:bg-white hover:text-gray-900 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <button
            aria-label="Next categories"
            class="ts-hero-next absolute right-1 sm:right-2 top-1/2 z-10 h-10 w-10 -translate-y-1/2 flex items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-lg transition-all duration-200 hover:bg-white hover:text-gray-900 hover:scale-110 disabled:opacity-0 disabled:pointer-events-none"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Down arrow indicator -->
      <div class="flex justify-center pb-3 sm:pb-4">
        <div class="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[12px] border-l-transparent border-r-transparent" style="border-top-color: var(--products-bg, #f5f5f5);"></div>
      </div>
    </section>
  `;
}
