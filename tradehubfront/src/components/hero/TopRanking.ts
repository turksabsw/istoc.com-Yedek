/**
 * TopRanking Component
 * Horizontal scrollable category ranking cards with badges and trend labels.
 */

import topBadgeUrl from '../../assets/images/top.avif';
import { t } from '../../i18n';

interface TopRankingCard {
  name: string;
  nameKey: string;
  href: string;
  label: string;
  labelKey: string;
  imageSrc: string;
}

const topRankingCards: TopRankingCard[] = [
  {
    name: 'Consumer Electronics',
    nameKey: 'topRanking.consumerElectronics',
    href: '/pages/product-detail.html',
    label: 'Hot selling',
    labelKey: 'topRanking.hotSelling',
    imageSrc: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    name: 'Fashion & Apparel',
    nameKey: 'topRanking.fashionApparel',
    href: '/pages/product-detail.html',
    label: 'Hot selling',
    labelKey: 'topRanking.hotSelling',
    imageSrc: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    name: 'Home & Garden',
    nameKey: 'topRanking.homeGarden',
    href: '/pages/product-detail.html',
    label: 'Rising trend',
    labelKey: 'topRanking.risingTrend',
    imageSrc: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    name: 'Beauty & Health',
    nameKey: 'topRanking.beautyHealth',
    href: '/pages/product-detail.html',
    label: 'Hot selling',
    labelKey: 'topRanking.hotSelling',
    imageSrc: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    name: 'Auto Parts',
    nameKey: 'topRanking.autoParts',
    href: '/pages/product-detail.html',
    label: 'Steady growth',
    labelKey: 'topRanking.steadyGrowth',
    imageSrc: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    name: 'Sports & Outdoors',
    nameKey: 'topRanking.sportsOutdoors',
    href: '/pages/product-detail.html',
    label: 'Hot selling',
    labelKey: 'topRanking.hotSelling',
    imageSrc: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    name: 'Industrial Equipment',
    nameKey: 'topRanking.industrialEquipment',
    href: '/pages/product-detail.html',
    label: 'Rising trend',
    labelKey: 'topRanking.risingTrend',
    imageSrc: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&h=400&q=80',
  },
  {
    name: 'Toys & Hobbies',
    nameKey: 'topRanking.toysHobbies',
    href: '/pages/product-detail.html',
    label: 'Hot selling',
    labelKey: 'topRanking.hotSelling',
    imageSrc: 'https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=400&h=400&q=80',
  },
];

function renderRankingImage(card: TopRankingCard): string {
  return `
    <div class="relative h-full w-full overflow-hidden rounded-md bg-gray-100" aria-hidden="true">
      <img
        src="${card.imageSrc}"
        alt="${card.name}"
        loading="lazy"
        class="w-full h-full object-cover transition-transform duration-300 group-hover/rank:scale-110"
      />
    </div>
  `;
}

function renderRankingCard(card: TopRankingCard): string {
  return `
    <a
      href="${card.href}"
      class="group/rank relative flex-shrink-0 flex flex-col w-[156px] sm:w-[188px] h-[230px] sm:h-[262px] rounded-md border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 cursor-pointer"
      style="background: var(--topranking-card-bg, #ffffff); border-color: var(--topranking-card-border, #e5e7eb); padding: var(--space-card-padding, 12px);"
      aria-label="${t(card.nameKey)}"
    >
      <!-- Image area with badge -->
      <div class="relative w-full flex-1">
        <div class="h-full w-full overflow-hidden rounded-md">
          ${renderRankingImage(card)}
        </div>
        <!-- TOP badge — overlaps bottom edge of image -->
        <div class="absolute -bottom-5 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center">
          <img
            src="${topBadgeUrl}"
            alt=""
            class="h-[48px] w-[48px] object-contain drop-shadow"
            loading="lazy"
          />
        </div>
      </div>

      <!-- Info area -->
      <div class="flex flex-col min-w-0" style="margin-top: 28px;">
        <p
          class="truncate font-semibold leading-tight"
          style="color: var(--topranking-name-color, #222222); font-size: var(--text-product-title, 16px);"
          title="${t(card.nameKey)}"
        ><span data-i18n="${card.nameKey}">${t(card.nameKey)}</span></p>
        <p
          class="truncate leading-none"
          style="color: var(--topranking-label-color, #666666); margin-top: 2px; font-size: var(--text-product-meta, 14px);"
        ><span data-i18n="${card.labelKey}">${t(card.labelKey)}</span></p>
      </div>
    </a>
  `;
}

/** No-op init — TopRanking uses native scroll, no JS library needed. */
export function initTopRanking(): void {
  // Placeholder for future enhancements
}

export function TopRanking(): string {
  return `
    <section class="py-4 lg:py-6" aria-label="Top Ranking" style="margin-top: 28px;">
      <div class="container-boxed">
        <div class="relative overflow-hidden rounded-md" style="background-color: var(--topranking-bg, #F5F5F5);">
          <div style="padding: var(--space-card-padding, 20px);">
            <!-- Section header -->
            <div class="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2
                  class="text-[20px] sm:text-[22px] font-bold leading-tight"
                  style="color: var(--topranking-title-color, #111827);"
                ><span data-i18n="topRanking.title">${t('topRanking.title')}</span></h2>
                <p
                  class="mt-0.5 text-[13px]"
                  style="color: var(--topranking-subtitle-color, #6b7280);"
                ><span data-i18n="topRanking.subtitle">${t('topRanking.subtitle')}</span></p>
              </div>
              <a
                href="/pages/top-ranking.html"
                class="flex-shrink-0 text-[13px] font-semibold transition-colors duration-150 hover:underline"
                style="color: var(--topranking-link-color, #111827);"
              ><span data-i18n="common.viewMore">${t('common.viewMore')}</span> &gt;</a>
            </div>

            <!-- Scrollable cards -->
            <div class="relative">
              <div
                class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
                role="list"
                aria-label="Top ranking categories"
              >
                ${topRankingCards.map(card => `<div role="listitem">${renderRankingCard(card)}</div>`).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
