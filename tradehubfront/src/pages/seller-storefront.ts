/**
 * Seller Storefront — Page Orchestrator
 * Imports all components, renders into #app, initializes interactions.
 * Loads seller data from API via ?store= URL parameter.
 */
import '../style.css';
import '../styles/seller/seller-storefront.css';
import { initFlowbite } from 'flowbite';
import 'swiper/swiper-bundle.css';
import { startAlpine } from '../alpine';

// Components
import { TopBar } from '../components/header';
import { initLanguageSelector } from '../components/header/TopBar';
import {
  StoreHeader,
  StoreNav,
} from '../components/seller';

import { CompanyProfileComponent } from '../components/seller/CompanyProfile';

// API
import { loadStorefrontData } from '../utils/api';
import type { SellerStorefrontApiData } from '../utils/api';

// Static Config (structural/template data that doesn't change per-seller)
import {
  getNavDataConfig,
  getHeroBannerConfig,
  getCategoryCardsConfig,
  getHotProductsConfig,
  getContactFormConfig,
  getFloatingActionsConfig,
} from '../data/seller/staticConfig';

// Sanitization
import { safeInnerHTML, sanitizeHtml } from '../utils/sanitize';

// Types
import type {
  SellerProfile,
  SellerStorefrontData,
  CompanyInfo,
  SellerPerformanceStats,
  SellerReview,
} from '../types/seller/types';

// Interactions
import { initSellerStorefront } from '../utils/seller/interactions';

// Guest auth handler
import { wireGuestAuthHandlers } from '../components/manufacturers/ManufacturerList';

// i18n
import { t } from '../i18n';

// ─── API → Component Param Mapping ──────────────────────

/**
 * Maps API SellerInfo to the SellerProfile type expected by StoreHeader.
 */
function mapSellerProfile(apiData: SellerStorefrontApiData, slug: string): SellerProfile {
  const { seller } = apiData;
  const badges = seller.badges || [];
  const deliveryBadge = badges.find(b => b.type === 'fast_delivery');
  const assessmentBadge = badges.find(b => b.type === 'certified');

  return {
    name: seller.display_name || '',
    slug,
    logo: seller.logo || '',
    verificationType: seller.is_verified
      ? (seller.verification_label as 'Verified' | 'Verified PRO') || 'Verified'
      : 'Verified',
    verificationBadgeType: 'standard',
    yearsOnPlatform: seller.years_active || 0,
    location: `${seller.city || ''}, ${seller.country || ''}`,
    mainCategories: seller.categories || [],
    email: seller.contact_email || '',
    deliveryBadge: deliveryBadge?.label,
    assessmentBadge: assessmentBadge?.label,
    verificationDate: seller.verified_at || '',
  };
}

/**
 * Maps API PerformanceInfo to the SellerPerformanceStats type
 * expected by CompanyProfileComponent.
 */
function mapPerformanceStats(apiData: SellerStorefrontApiData): SellerPerformanceStats {
  const { performance } = apiData;
  return {
    rating: performance.average_rating,
    reviewCount: performance.total_reviews,
    responseTime: `${performance.response_time_hours}h`,
    onTimeDeliveryRate: `${performance.on_time_delivery_rate}%`,
    transactions: performance.total_orders,
    supplierServiceScore: performance.average_rating,
    onTimeShipmentScore: Math.min(performance.on_time_delivery_rate / 20, 5),
    productQualityScore: performance.average_rating,
  };
}

/**
 * Builds the full SellerStorefrontData object from API data + static config.
 * API data populates seller-specific fields; static config provides
 * structural/template data that doesn't change per-seller.
 */
function buildStorefrontData(apiData: SellerStorefrontApiData, slug: string): SellerStorefrontData {
  return {
    seller: mapSellerProfile(apiData, slug),
    navData: getNavDataConfig(),
    heroBanner: getHeroBannerConfig(),
    categoryCards: getCategoryCardsConfig(),
    hotProducts: getHotProductsConfig(),
    company: {
      heroImage: '',
      heroTitle: '',
      heroSubtitle: '',
      description: '',
      factoryPhotos: [],
      carouselPhotos: [],
      locations: [],
    } as CompanyInfo,
    contactForm: getContactFormConfig(),
    floatingActions: getFloatingActionsConfig(),
  };
}

// ─── Render Storefront (data-* DOM hydration) ───────────

/**
 * Populates all 19 data-* attribute DOM elements with live API data.
 * Called after innerHTML is set and before library initialization.
 */
function renderStorefront(apiData: SellerStorefrontApiData): void {
  const { seller, performance, storefront } = apiData;

  // 1. [data-seller-name] — Company name heading
  const nameEl = document.querySelector<HTMLElement>('[data-seller-name]');
  if (nameEl) nameEl.textContent = seller.display_name;

  // 2. [data-seller-logo] — Logo <img>
  const logoEl = document.querySelector<HTMLImageElement>('[data-seller-logo]');
  if (logoEl) {
    logoEl.setAttribute('src', seller.logo);
    logoEl.setAttribute('alt', seller.display_name);
  }

  // 3. [data-verified-badge] — Verified badge container
  const verifiedEl = document.querySelector<HTMLElement>('[data-verified-badge]');
  if (verifiedEl) {
    if (seller.is_verified) {
      verifiedEl.classList.remove('hidden');
    } else {
      verifiedEl.classList.add('hidden');
    }
  }

  // 4. [data-years] — Years display
  const yearsEl = document.querySelector<HTMLElement>('[data-years]');
  if (yearsEl) yearsEl.textContent = `${seller.years_active}yrs`;

  // 5. [data-location] — Location text
  const locationEl = document.querySelector<HTMLElement>('[data-location]');
  if (locationEl) locationEl.textContent = `${seller.city}, ${seller.country}`;

  // 6. [data-categories] — Categories text
  const categoriesEl = document.querySelector<HTMLElement>('[data-categories]');
  if (categoriesEl) {
    const categories = seller.categories || [];
    categoriesEl.textContent = categories.length > 0
      ? `${t('seller.sf.mainCategoriesLabel')} ${categories.join(', ')}`
      : '';
  }

  // 7. [data-email] — Email text
  const emailEl = document.querySelector<HTMLElement>('[data-email]');
  if (emailEl) {
    if (seller.contact_email) {
      emailEl.classList.remove('hidden');
      const emailSpan = emailEl.querySelector('span');
      if (emailSpan) emailSpan.textContent = seller.contact_email;
    } else {
      emailEl.classList.add('hidden');
    }
  }

  // 8. [data-badges] — Badge container (user-provided content, use safeInnerHTML)
  const badgesEl = document.querySelector<HTMLElement>('[data-badges]');
  if (badgesEl && (seller.badges || []).length > 0) {
    const badgesHtml = seller.badges.map(b => {
      if (b.type === 'fast_delivery') {
        return `<a class="store-header__delivery-badge inline-flex items-center border border-(--color-border-strong) dark:border-gray-600 rounded-sm px-2.5 py-1 text-[12px] text-[#374151] dark:text-gray-300 underline hover:bg-(--color-surface-muted) focus:ring-1 focus:ring-[#d1d5db] transition-colors cursor-pointer max-w-[260px] lg:max-w-none truncate" href="#">${b.label}</a>`;
      }
      return `<span class="store-header__assessment-badge inline-flex items-center text-[12px] text-(--color-text-tertiary) dark:text-gray-400 gap-1"><span class="w-2 h-2 rounded-full bg-[#2563eb] inline-block"></span>${b.label}</span>`;
    }).join('');
    safeInnerHTML(badgesEl, badgesHtml);
  }

  // 9. [data-verified-by] — Verification info
  const verifiedByEl = document.querySelector<HTMLElement>('[data-verified-by]');
  if (verifiedByEl) {
    if (seller.verified_by) {
      verifiedByEl.innerHTML = `${t('seller.sf.verifiedBy')} ${sanitizeHtml(seller.verified_by)} &mdash; ${sanitizeHtml(seller.verified_at)} <span class="inline-block ml-1 cursor-help" data-tooltip-target="tuv-tooltip" data-tooltip-placement="top">&oplus;</span>`;
    } else {
      verifiedByEl.classList.add('hidden');
    }
  }

  // 10. [data-rating] — Rating number
  const ratingEl = document.querySelector<HTMLElement>('[data-rating]');
  if (ratingEl) ratingEl.textContent = performance.average_rating.toFixed(1);

  // 11. [data-reviews-count] — Review count
  const reviewsEl = document.querySelector<HTMLElement>('[data-reviews-count]');
  if (reviewsEl) reviewsEl.textContent = `${performance.total_reviews} ${t('seller.sf.reviews')}`;

  // 12. [data-response-time] — Response time
  const responseEl = document.querySelector<HTMLElement>('[data-response-time]');
  if (responseEl) responseEl.textContent = `\u2264${performance.response_time_hours}h`;

  // 13. [data-delivery-rate] — Delivery rate
  const deliveryEl = document.querySelector<HTMLElement>('[data-delivery-rate]');
  if (deliveryEl) deliveryEl.textContent = `${performance.on_time_delivery_rate}%`;

  // 14. [data-total-orders] — Order count
  const ordersEl = document.querySelector<HTMLElement>('[data-total-orders]');
  if (ordersEl) ordersEl.textContent = `${performance.total_orders}+`;

  // 15. [data-factory-video] — Video container (hidden by default in HTML)
  const factoryVideoEl = document.querySelector<HTMLElement>('[data-factory-video]');
  if (factoryVideoEl) {
    if (storefront.factory_video_url) {
      factoryVideoEl.classList.remove('hidden');
      const imgEl = factoryVideoEl.querySelector('img');
      if (imgEl) {
        imgEl.setAttribute('src', storefront.factory_video_url);
        imgEl.setAttribute('alt', t('seller.sf.factoryVideoAlt'));
      }
    }
    // If no factory_video_url, leave it hidden (default state)
  }

  // 16. [data-capabilities] — Capability list
  // Uses DOM API to keep trusted SVG markup while safely escaping API-sourced capability names
  const capabilitiesEl = document.querySelector<HTMLElement>('[data-capabilities]');
  if (capabilitiesEl && (storefront.capabilities || []).length > 0) {
    const checkSvg = '<svg class="w-4 h-4 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>';
    capabilitiesEl.innerHTML = ''; // Clear existing content
    storefront.capabilities.forEach(c => {
      const li = document.createElement('li');
      li.className = 'flex items-center gap-2';
      // SVG is trusted hardcoded markup — safe to use innerHTML for it
      const iconSpan = document.createElement('span');
      iconSpan.innerHTML = checkSvg;
      li.appendChild(iconSpan.firstChild!);
      // Capability name is API data — use textContent (XSS-safe)
      li.appendChild(document.createTextNode(` ${c}`));
      capabilitiesEl.appendChild(li);
    });
  }

  // 17. [data-capability-verifier] — Verifier text
  const verifierEl = document.querySelector<HTMLElement>('[data-capability-verifier]');
  if (verifierEl && storefront.capability_verified_by) {
    verifierEl.innerHTML = `${t('seller.sf.verifiedBy')} <strong>${sanitizeHtml(storefront.capability_verified_by)}</strong>`;
  }

  // 18. [data-sidebar-name] — Sidebar company name
  const sidebarNameEl = document.querySelector<HTMLElement>('[data-sidebar-name]');
  if (sidebarNameEl) sidebarNameEl.textContent = seller.display_name;

  // 19. [data-sidebar-logo] — Sidebar logo <img>
  const sidebarLogoEl = document.querySelector<HTMLImageElement>('[data-sidebar-logo]');
  if (sidebarLogoEl) {
    sidebarLogoEl.setAttribute('src', seller.logo);
    sidebarLogoEl.setAttribute('alt', seller.display_name);
  }
}

// ─── Error State Renderer ───────────────────────────────

function renderErrorState(appEl: HTMLDivElement, message: string): void {
  appEl.innerHTML = `
    ${TopBar()}
    <main class="seller-storefront flex flex-col min-h-screen">
      <div class="max-w-(--container-lg) mx-auto px-6 py-20 text-center">
        <svg class="w-16 h-16 text-gray-300 mx-auto mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" />
        </svg>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-4">${t('seller.sf.storefrontNotFound')}</h1>
        <p class="text-gray-500 dark:text-gray-400 mb-6">${message}</p>
        <a href="/pages/manufacturers.html" class="th-btn inline-block">${t('seller.sf.browseManufacturers')}</a>
      </div>
    </main>
  `;
  initFlowbite();
  initLanguageSelector();
  startAlpine();
}

// ─── Page Entry Point ───────────────────────────────────

const appEl = document.querySelector<HTMLDivElement>('#app')!;
const slug = new URLSearchParams(window.location.search).get('store');

if (!slug) {
  // Missing slug — show error state
  renderErrorState(
    appEl,
    t('seller.sf.missingStoreParam')
  );
} else {
  // Load storefront data from API
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const apiData = await loadStorefrontData(slug);

      // Map API response to component params
      const storefrontData = buildStorefrontData(apiData, slug);
      const stats = mapPerformanceStats(apiData);
      const reviews: SellerReview[] = [];

      // ─── Render ─────────────────────────────────────────────
      appEl.innerHTML = `
        <!-- MAIN PLATFORM HEADER -->
        ${TopBar()}

        <main class="seller-storefront flex flex-col min-h-screen" data-seller-slug="${slug}" x-data="sellerStorefront">
          ${StoreHeader(storefrontData.seller)}
          ${StoreNav(storefrontData.navData)}

          <!-- PROFILE VIEW -->
          ${CompanyProfileComponent(
        storefrontData,
        stats,
        reviews
      )}

        </main>

        <!-- SITE FOOTER PLACEHOLDER -->
      `;

      // ─── Hydrate data-* attributes ──────────────────────────
      renderStorefront(apiData);

      // ─── Initialize ─────────────────────────────────────────
      initFlowbite();
      initLanguageSelector();
      initSellerStorefront();
      wireGuestAuthHandlers();

      // Start Alpine.js (must be called AFTER innerHTML is set)
      startAlpine();
    } catch (err) {
      renderErrorState(
        appEl,
        t('seller.sf.loadError')
      );
    }
  });
}
