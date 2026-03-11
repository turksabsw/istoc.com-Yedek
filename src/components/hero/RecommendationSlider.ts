/**
 * RecommendationSlider Component
 * Single-image recommendation cards in a Swiper carousel.
 */

import Swiper from 'swiper';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import 'swiper/swiper-bundle.css';
import { t } from '../../i18n';

interface RecommendationCard {
  titleKey: string;
  subtitleKey?: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
}

const recommendationCards: RecommendationCard[] = [
  {
    titleKey: 'recommendation.frequentlySearched',
    subtitleKey: 'recommendation.vendingMachines',
    href: '/pages/product-detail.html',
    imageSrc: 'https://images.unsplash.com/photo-1515706886582-54c73c5eaf41?auto=format&fit=crop&w=600&h=600&q=80',
    imageAlt: 'Vending machine product card',
  },
  {
    titleKey: 'recommendation.frequentlySearched',
    subtitleKey: 'recommendation.weddingDresses',
    href: '/pages/product-detail.html',
    imageSrc: 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=600&h=600&q=80',
    imageAlt: 'Wedding dress product card',
  },
  {
    titleKey: 'recommendation.frequentlySearched',
    subtitleKey: 'recommendation.electricCars',
    href: '/pages/product-detail.html',
    imageSrc: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=600&h=600&q=80',
    imageAlt: 'Electric car product card',
  },
  {
    titleKey: 'recommendation.frequentlySearched',
    subtitleKey: 'recommendation.portableAC',
    href: '/pages/product-detail.html',
    imageSrc: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&h=600&q=80',
    imageAlt: 'Portable air conditioner product card',
  },
  {
    titleKey: 'recommendation.frequentlySearched',
    subtitleKey: 'recommendation.officeChairs',
    href: '/pages/product-detail.html',
    imageSrc: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=600&h=600&q=80',
    imageAlt: 'Office chair product card',
  },
  {
    titleKey: 'recommendation.frequentlySearched',
    subtitleKey: 'recommendation.setTopBoxes',
    href: '/pages/product-detail.html',
    imageSrc: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?auto=format&fit=crop&w=600&h=600&q=80',
    imageAlt: 'Set-top box product card',
  },
  {
    titleKey: 'recommendation.frequentlySearched',
    subtitleKey: 'recommendation.jewelryComponents',
    href: '/pages/product-detail.html',
    imageSrc: 'https://images.unsplash.com/photo-1515562141589-67f0d569b6f5?auto=format&fit=crop&w=600&h=600&q=80',
    imageAlt: 'Jewelry components product card',
  },
  {
    titleKey: 'recommendation.frequentlySearched',
    subtitleKey: 'recommendation.cargoServices',
    href: '/pages/product-detail.html',
    imageSrc: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=600&h=600&q=80',
    imageAlt: 'Cargo service product card',
  },
  {
    titleKey: 'recommendation.frequentlySearched',
    subtitleKey: 'recommendation.sportsShoes',
    href: '/pages/product-detail.html',
    imageSrc: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&h=600&q=80',
    imageAlt: 'Sports shoes product card',
  },
];

function renderCardImage(card: RecommendationCard): string {
  return `
    <div class="relative h-full w-full overflow-hidden rounded-md bg-gray-100" aria-hidden="true">
      <img
        src="${card.imageSrc}"
        alt="${card.imageAlt}"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105 group-focus-visible/card:scale-105"
      />
    </div>
  `;
}

function renderCard(card: RecommendationCard): string {
  const title = t(card.titleKey);
  const subtitle = card.subtitleKey ? t(card.subtitleKey) : undefined;
  const cardAriaLabel = subtitle ? `${title} - ${subtitle}` : title;

  return `
    <div class="swiper-slide recommendation-slide h-full xl:!w-[240px]">
      <a
        href="${card.href}"
        aria-label="${cardAriaLabel}"
        title="${card.imageAlt}"
        class="th-card group/card mx-auto flex h-full w-full flex-col transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-1 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary-400"
        style="background-color:var(--hero-card-bg);border-color:var(--hero-card-border-color);border-radius:var(--hero-card-radius)"
      >
        <div class="mb-2">
          <h3 class="text-[14px] sm:text-[16px] font-bold leading-tight truncate dark:text-white" style="color:var(--hero-title-color)" data-i18n="${card.titleKey}">${title}</h3>
          ${card.subtitleKey ? `<p class="mt-0.5 truncate text-[11px] sm:text-[12px] font-semibold leading-tight text-gray-700 dark:text-gray-300" data-i18n="${card.subtitleKey}">${subtitle}</p>` : ''}
        </div>
        <div class="min-h-0 flex-1">
          ${renderCardImage(card)}
        </div>
      </a>
    </div>
  `;
}

export function RecommendationSlider(): string {
  return `
    <div class="group/recommendation relative recommendation-slider-wrapper h-[200px] sm:h-[260px] xl:h-[300px] px-2 sm:px-4 xl:px-0">
      <div class="swiper recommendation-swiper h-full" aria-label="Frequently searched product slider">
        <div class="swiper-wrapper h-full">
          ${recommendationCards.map(card => renderCard(card)).join('')}
        </div>
      </div>

      <div class="reco-pagination mt-3 flex justify-center hidden"></div>

      <button
        aria-label="Previous recommendations"
        class="rec-swiper-prev absolute left-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-lg transition-all duration-200 hover:text-gray-900 opacity-0 pointer-events-none md:flex group-hover/recommendation:opacity-100 group-hover/recommendation:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto focus-visible:ring-2 focus-visible:ring-primary-300 disabled:opacity-0 disabled:pointer-events-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:text-white"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>

      <button
        aria-label="Next recommendations"
        class="rec-swiper-next absolute right-2 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-lg transition-all duration-200 hover:text-gray-900 opacity-0 pointer-events-none md:flex group-hover/recommendation:opacity-100 group-hover/recommendation:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto focus-visible:ring-2 focus-visible:ring-primary-300 disabled:opacity-0 disabled:pointer-events-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:text-white"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  `;
}

export function initRecommendationSlider(): void {
  const sliderElement = document.querySelector<HTMLElement>('.recommendation-swiper');
  if (!sliderElement) return;

  new Swiper(sliderElement, {
    modules: [Autoplay, Navigation, Pagination],
    loop: true,
    slidesPerView: 1,
    slidesPerGroup: 1,
    spaceBetween: 8,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    },
    navigation: {
      nextEl: '.rec-swiper-next',
      prevEl: '.rec-swiper-prev',
    },
    pagination: {
      el: '.reco-pagination',
      clickable: true,
      dynamicBullets: true,
    },
    breakpoints: {
      0: {
        slidesPerView: 1,
        spaceBetween: 12,
      },
      640: {
        slidesPerView: 1,
        spaceBetween: 16,
      },
      960: {
        slidesPerView: 2,
        spaceBetween: 20,
      },
      1280: {
        slidesPerView: 3,
        spaceBetween: 20,
      },
    },
  });
}
