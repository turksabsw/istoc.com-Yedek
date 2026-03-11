import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/swiper-bundle.css';
import { formatPrice } from '../../utils/currency';
import { t } from '../../i18n';
import { sanitizeHtml } from '../../utils/sanitize';
import type { Manufacturer, ManufacturerProduct } from '../../types/seller/manufacturer';

/**
 * Format a ManufacturerProduct's price range into a display string.
 * Outputs "$min-max" or "$min" when min equals max, then runs through
 * formatPrice() for currency symbol replacement.
 */
function formatProductPrice(prod: ManufacturerProduct): string {
  const min = prod.price_min.toFixed(2).replace('.', ',');
  const max = prod.price_max.toFixed(2).replace('.', ',');
  if (prod.price_min === prod.price_max || prod.price_max <= 0) {
    return formatPrice(`$${min}`);
  }
  return formatPrice(`$${min}-${max}`);
}

export function ManufacturerList(manufacturers: Manufacturer[]): string {
  const lightboxModal = `
    <div id="factory-lightbox" class="fixed inset-0 bg-white z-[9999] hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <span id="factory-lightbox-title" class="text-[15px] text-[#222]"></span>
        <button id="factory-lightbox-close" type="button" class="text-gray-400 hover:text-gray-600 transition-colors">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div id="factory-lightbox-body" class="overflow-y-auto p-6" style="height:calc(100vh - 65px)">
      </div>
    </div>
    `;

  if (manufacturers.length === 0) {
    return `
      <div class="flex flex-col items-center justify-center py-16">
        <p class="text-gray-500 text-[14px]">${t('mfr.list.noManufacturers')}</p>
      </div>
      ${lightboxModal}
    `;
  }

  return `
    <div class="flex flex-col">
      ${manufacturers.map((mfg, idx) => renderFactoryCard(mfg, idx)).join('')}
    </div>
    ${lightboxModal}
  `;
}

function renderFactoryCard(mfg: Manufacturer, cardIndex: number): string {
  const displayName = sanitizeHtml(mfg.display_name);
  const storefrontUrl = `/pages/seller/seller-storefront.html?store=${encodeURIComponent(mfg.storefront_slug)}`;

  const verifiedBadge = mfg.is_verified ? `
        <img src="https://img.icons8.com/fluency/16/verified-badge.png" alt="${t('mfr.list.verified')}" class="w-4 h-4" />
        <span class="text-[#1a66ff] font-bold text-[13px]">${t('mfr.list.verified')}</span>
    ` : '';

  const certBadges = (mfg.certificates || []).length > 0
    ? mfg.certificates.map((cert: string) => `
        <span class="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-[10px] font-bold text-gray-600 border border-gray-200">${sanitizeHtml(cert)}</span>
    `).join('')
    : '';

  const years = t('mfr.list.years', { count: mfg.years_active });
  const staff = t('mfr.list.staff', { count: sanitizeHtml(mfg.employee_count) });
  const area = t('mfr.list.area', { size: sanitizeHtml(mfg.factory_area) });
  const revenue = sanitizeHtml(mfg.annual_revenue);
  const rating = mfg.average_rating.toFixed(1);
  const reviews = t('mfr.list.reviews', { count: mfg.total_reviews });

  // Build performance capability lines from numeric fields
  const cardCapabilities = [
    t('mfr.list.responseTime', { time: mfg.response_time_hours + 'h' }),
    t('mfr.list.onTimeDelivery', { pct: mfg.on_time_delivery_rate.toFixed(1) + '%' })
  ];

  const totalImages = (mfg.factory_images || []).length;
  const hasProducts = (mfg.top_products || []).length > 0;
  const hasFactoryImages = totalImages > 0;

  // Products section — desktop
  const desktopProductsHtml = hasProducts
    ? mfg.top_products.map((prod: ManufacturerProduct) => `
        <a href="#" class="flex flex-col group flex-1 min-w-0">
          <div class="w-full aspect-[1/1] rounded-lg overflow-hidden bg-gray-100 shrink-0">
            <img src="${prod.item_image}" alt="${t('mfr.list.product')}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
          <p class="text-[13px] xl:text-[16px] font-bold text-[#222] mt-2 xl:mt-3 truncate">${formatProductPrice(prod)}</p>
          <p class="text-[11px] xl:text-[14px] text-[#222] mt-0.5 xl:mt-1 truncate">${t('common.minOrder', { count: prod.min_order_qty })}</p>
        </a>
      `).join('')
    : `<div class="flex-1 flex items-center justify-center text-gray-400 text-[13px]">${t('mfr.list.noProducts')}</div>`;

  // Products section — mobile
  const mobileProductsHtml = hasProducts
    ? mfg.top_products.slice(0, 4).map((prod: ManufacturerProduct) => `
        <div class="relative aspect-[1/1.05] w-full bg-gray-50 overflow-hidden rounded-[4px]">
          <img src="${prod.item_image}" class="w-full h-full object-cover mix-blend-multiply" />
          <!-- Price Overlay at Bottom -->
          <div class="absolute bottom-0 inset-x-0 w-full bg-gradient-to-t from-black/70 to-transparent pt-4 pb-1 px-1 flex justify-center">
            <span class="text-white font-bold text-[13px] tracking-tight">${formatProductPrice(prod)}</span>
          </div>
        </div>
      `).join('')
    : `<div class="col-span-4 flex items-center justify-center py-4 text-gray-400 text-[12px]">${t('mfr.list.noProducts')}</div>`;

  // Factory slider section — only render if images exist
  const factorySliderHtml = hasFactoryImages ? `
        <!-- Right Column: Factory Slider (Swiper) -->
        <div class="factory-slider w-[220px] xl:w-[320px] h-[165px] xl:h-[240px] shrink-0 relative lg:ml-2 xl:ml-2" data-slider-root="${cardIndex}">
          <div class="swiper factory-swiper-${cardIndex} w-full h-full overflow-hidden">
            <div class="swiper-wrapper">
              ${mfg.factory_images.map((img: string, i: number) => `
                <div class="swiper-slide">
                  <img src="${img}" alt="${t('mfr.list.factoryView')} ${i + 1}" class="w-full h-full object-cover cursor-pointer" data-slider-img="${cardIndex}" />
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Left Arrow -->
          <button type="button" class="factory-prev-${cardIndex} absolute left-0 top-1/2 -translate-y-1/2 w-[24px] h-[48px] xl:w-[28px] xl:h-[56px] bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors duration-100 z-10" aria-label="${t('mfr.list.previous')}">
            <svg class="w-[20px] h-[20px] xl:w-[24px] xl:h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          </button>

          <!-- Right Arrow -->
          <button type="button" class="factory-next-${cardIndex} absolute right-0 top-1/2 -translate-y-1/2 w-[24px] h-[48px] xl:w-[28px] xl:h-[56px] bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors duration-100 z-10" aria-label="${t('mfr.list.next')}">
            <svg class="w-[20px] h-[20px] xl:w-[24px] xl:h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>

          <!-- Image Counter -->
          <span class="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] xl:text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 z-10 pointer-events-none">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            <span class="factory-counter-${cardIndex}">1/${totalImages}</span>
          </span>
        </div>` : '';

  // On-time delivery and response time for mobile stats
  const onTimeDeliveryText = t('mfr.list.onTimeDelivery', { pct: mfg.on_time_delivery_rate.toFixed(1) + '%' });
  const responseTimeText = t('mfr.list.responseTime', { time: mfg.response_time_hours + 'h' });

  return `
    <div class="bg-white rounded-lg p-3 mb-2 lg:p-5 lg:mb-5" data-factory-card="${cardIndex}" data-factory-name="${displayName}" data-factory-images='${JSON.stringify(mfg.factory_images || [])}'>
      <!-- Desktop Layout -->
      <div class="hidden lg:flex flex-col">
        <!-- Card Title Row -->
        <div class="flex flex-col xl:flex-row gap-4 xl:gap-0 justify-between items-start mb-6 xl:mb-8">
        <!-- Left: Logo + Info -->
        <div class="flex items-start min-w-0">
          <div class="w-[45px] h-[45px] xl:w-[50px] xl:h-[50px] border border-[#ddd] rounded overflow-hidden shrink-0 mr-3">
            <img src="${mfg.logo}" alt="${displayName}" class="w-full h-full object-cover" />
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="text-[15px] xl:text-[16px] font-bold text-[#222] truncate max-w-[350px] xl:max-w-[440px]">
              <a href="${storefrontUrl}" class="hover:text-[#1a66ff] transition-colors">${displayName}</a>
            </h3>
            <div class="flex flex-wrap items-center gap-1 xl:gap-1.5 mt-1 text-[12px] xl:text-[14px] text-[#222]">
              ${verifiedBadge}
              <span>${years}</span>
              <span class="text-gray-400">·</span>
              <span>${staff}</span>
              <span class="text-gray-400 hidden xl:inline">·</span>
              <span class="hidden xl:inline">${area}</span>
              <span class="text-gray-400">·</span>
              <span>${revenue}</span>
            </div>
          </div>
        </div>

        <!-- Right: Action Buttons -->
        <div class="flex items-center gap-2 xl:gap-5 shrink-0">
          <button type="button" class="text-gray-400 hover:text-red-500 transition-colors" aria-label="${t('mfr.list.addToFavorites')}" data-auth-action="favorite">
            <svg class="w-[20px] h-[20px] xl:w-[25px] xl:h-[25px]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
          <a href="${sanitizeHtml(mfg.chat_url || '#')}" data-auth-action="chat" class="h-8 xl:h-10 px-3 xl:px-4 border border-[#222] rounded-full text-[12px] xl:text-[14px] font-bold text-[#222] bg-white hover:bg-gray-50 transition-colors whitespace-nowrap inline-flex items-center no-underline">
            ${t('mfr.list.chatNow')}
          </a>
          <a href="${sanitizeHtml(mfg.contact_url || '#')}" data-auth-action="contact" class="h-8 xl:h-10 px-3 xl:px-4 border border-[#222] rounded-full text-[12px] xl:text-[14px] font-bold text-[#222] bg-white hover:bg-gray-50 transition-colors whitespace-nowrap inline-flex items-center no-underline">
            ${t('mfr.list.contactUs')}
          </a>
        </div>
      </div>

      <!-- Card Content Row -->
      <div class="flex justify-between gap-3 xl:gap-3 2xl:gap-4">
        <!-- Left Column: Info -->
        <div class="w-[180px] xl:w-[244px] shrink-0 pr-1 xl:pr-3">
          <h4 class="text-[12px] xl:text-[14px] font-normal text-[#222] mb-1">${t('mfr.list.rankingsAndReviews')}</h4>
          <div class="mb-4 xl:mb-6 text-[12px] xl:text-[14px]">
            <strong class="text-[#222]">${rating}</strong><span class="text-[#222]">/5</span>
            <a href="#" class="underline text-[#222] hover:text-[#1a66ff] ml-1">(${reviews})</a>
          </div>
          <h4 class="text-[12px] xl:text-[14px] font-normal text-[#222] mb-2">${t('mfr.list.factoryCapacity')}</h4>
          <ul class="space-y-0.5">
            ${cardCapabilities.map((cap: string) => `
              <li class="text-[12px] xl:text-[14px] leading-[20px] xl:leading-[25px] font-bold text-[#222] truncate">· ${cap}</li>
            `).join('')}
            ${(mfg.certificates || []).length > 0 ? `
            <li class="text-[12px] xl:text-[14px] leading-[20px] xl:leading-[25px] font-bold text-[#222] flex items-center gap-1 xl:gap-1.5 flex-wrap">
              · ${t('mfr.list.certifications')}: ${certBadges}
            </li>
            ` : ''}
          </ul>
        </div>

        <!-- Middle Column: Products -->
        <div class="flex gap-2 xl:gap-3 flex-1 min-w-0">
          ${desktopProductsHtml}
        </div>

        ${factorySliderHtml}
      </div>
    </div>

    <!-- Mobile Layout -->
    <div class="lg:hidden flex flex-col gap-2">
        <!-- Logo and Title -->
        <div class="flex items-center gap-2 mb-1.5">
          <img src="${mfg.logo}" alt="${displayName}" class="w-[28px] h-[28px] rounded-sm shrink-0 border border-gray-100 object-cover" />
          <h3 class="text-[14px] font-bold text-[#222] truncate">
            <a href="${storefrontUrl}" class="hover:text-[#1a66ff] transition-colors">${displayName}</a>
          </h3>
          <span class="text-[12px] text-gray-400 shrink-0 ml-auto">${years}</span>
        </div>

        <!-- Stats -->
        <div class="text-[11px] text-[#222] mb-1.5 truncate flex items-center">
          <span class="font-bold">${onTimeDeliveryText}</span>
          <span class="mx-1.5 text-gray-300">|</span>
          <span>${responseTimeText}</span>
        </div>

        <!-- Tags -->
        <div class="flex gap-1.5 mb-2.5 flex-wrap">
            <span class="bg-[#f5f5f5] text-[#222] text-[11px] px-2 py-0.5 rounded-sm font-medium">${t('mfr.list.odmService')}</span>
            <span class="bg-[#f5f5f5] text-[#222] text-[11px] px-2 py-0.5 rounded-sm font-medium">${t('mfr.filter.fullCustomization')}</span>
        </div>

        <!-- Products Grid (4 items) -->
        <div class="grid grid-cols-4 gap-1.5 w-full">
            ${mobileProductsHtml}
        </div>
      </div>
    </div>
  `;
}

export function initFactorySliders(): void {
  // Initialize each factory card slider with Swiper + peek animation
  document.querySelectorAll<HTMLDivElement>('[data-slider-root]').forEach(root => {
    const cardIndex = root.dataset.sliderRoot!;
    const swiperEl = root.querySelector<HTMLElement>(`.factory-swiper-${cardIndex}`);
    if (!swiperEl) return;

    const prevBtn = root.querySelector<HTMLButtonElement>(`.factory-prev-${cardIndex}`);
    const nextBtn = root.querySelector<HTMLButtonElement>(`.factory-next-${cardIndex}`);
    const counterEl = root.querySelector<HTMLSpanElement>(`.factory-counter-${cardIndex}`);
    const total = swiperEl.querySelectorAll('.swiper-slide').length;

    const stopPeek = () => {
      root.classList.remove('factory-peek-prev', 'factory-peek-next');
    };

    // Peek: arrow hover shifts slide 28px
    prevBtn?.addEventListener('mouseenter', () => {
      root.classList.remove('factory-peek-next');
      root.classList.add('factory-peek-prev');
    });
    prevBtn?.addEventListener('mouseleave', stopPeek);
    prevBtn?.addEventListener('click', stopPeek);

    nextBtn?.addEventListener('mouseenter', () => {
      root.classList.remove('factory-peek-prev');
      root.classList.add('factory-peek-next');
    });
    nextBtn?.addEventListener('mouseleave', stopPeek);
    nextBtn?.addEventListener('click', stopPeek);

    root.addEventListener('mouseleave', stopPeek);

    const swiper = new Swiper(swiperEl, {
      modules: [Navigation],
      slidesPerView: 1,
      loop: true,
      speed: 650,
      navigation: {
        prevEl: prevBtn,
        nextEl: nextBtn,
      },
    });

    swiper.on('slideChange', () => {
      if (counterEl) counterEl.textContent = `${swiper.realIndex + 1}/${total}`;
    });
    swiper.on('slideChangeTransitionStart', stopPeek);
  });

  // Lightbox
  const lightbox = document.getElementById('factory-lightbox');
  const lightboxTitle = document.getElementById('factory-lightbox-title');
  const lightboxBody = document.getElementById('factory-lightbox-body');
  const lightboxClose = document.getElementById('factory-lightbox-close');

  function openLightbox(name: string, images: string[]) {
    if (!lightbox || !lightboxTitle || !lightboxBody) return;
    lightboxTitle.textContent = name;
    lightboxBody.innerHTML = images.map(img => `
            <div class="flex justify-center mb-4">
              <img src="${img}" alt="${t('mfr.list.factory')}" class="max-w-[800px] w-full object-contain" />
            </div>
        `).join('');
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.add('hidden');
    document.body.style.overflow = '';
  }

  lightboxClose?.addEventListener('click', closeLightbox);
  lightbox?.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox && !lightbox.classList.contains('hidden')) {
      closeLightbox();
    }
  });

  // Image click -> open lightbox
  document.querySelectorAll<HTMLImageElement>('[data-slider-img]').forEach(img => {
    img.addEventListener('click', () => {
      const cardIndex = img.dataset.sliderImg!;
      const card = document.querySelector<HTMLDivElement>(`[data-factory-card="${cardIndex}"]`);
      if (!card) return;
      const name = card.dataset.factoryName || '';
      const images: string[] = JSON.parse(card.dataset.factoryImages || '[]');
      openLightbox(name, images);
    });
  });

  // Wire guest auth handlers for chat/favorite buttons
  wireGuestAuthHandlers();
}

/**
 * Wire click handlers on buttons with data-auth-action attributes.
 * For guests (no tradehub_auth token), shows a login prompt alert
 * instead of performing the action.
 */
export function wireGuestAuthHandlers(): void {
  document.querySelectorAll<HTMLElement>('[data-auth-action]').forEach(btn => {
    // Skip if already wired
    if (btn.dataset.authWired) return;
    btn.dataset.authWired = '1';

    btn.addEventListener('click', (e) => {
      const token = localStorage.getItem('tradehub_auth');
      if (token) return; // Authenticated — let default behavior proceed (link navigates normally)

      e.preventDefault();
      e.stopPropagation();

      const action = btn.dataset.authAction;
      const message = action === 'favorite'
        ? t('seller.sf.loginToFavorite')
        : t('seller.sf.loginToChat');

      // Show login prompt via a non-blocking toast/alert
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg z-[9999] text-sm flex items-center gap-3 animate-fade-slide-up';
      toast.innerHTML = `
        <span>${message}</span>
        <a href="/pages/auth/login.html" class="underline font-medium text-blue-300 hover:text-blue-200 whitespace-nowrap">${t('header.signIn')}</a>
      `;
      document.body.appendChild(toast);

      // Auto-remove toast after 4 seconds
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, 4000);
    });
  });
}
