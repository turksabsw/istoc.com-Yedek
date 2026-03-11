import Swiper from 'swiper';
import { Navigation } from 'swiper/modules';
import 'swiper/swiper-bundle.css';
import { formatPrice } from '../../utils/currency';
import { t } from '../../i18n';

export function ManufacturerList(): string {
  const manufacturers = [
    {
      name: "Jingmen Tanmeng Technology Co., Ltd.",
      logo: "https://images.unsplash.com/photo-1549924231-f129b911e442?w=50&h=50&fit=crop",
      verified: true,
      years: t('mfr.list.years', { count: 2 }),
      staff: t('mfr.list.staff', { count: '100+' }),
      area: t('mfr.list.area', { size: '10.000+' }),
      revenue: "$70 B+",
      rating: "4.9",
      reviews: t('mfr.list.reviews', { count: '90+' }),
      capabilities: [t('mfr.list.responseTime', { time: '1h' }), t('mfr.list.onTimeDelivery', { pct: '100.0%' })],
      certifications: ["ISO", "CE", "CPC"],
      products: [
        { image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=200", price: "$0,66-1,39", moq: t('common.minOrder', { count: 5 }) },
        { image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=200", price: "$0,84-2,68", moq: t('common.minOrder', { count: 10 }) },
        { image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=200", price: "$4,86", moq: t('common.minOrder', { count: 48 }) },
        { image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=200", price: "$0,66-1,39", moq: t('common.minOrder', { count: 5 }) }
      ],
      factoryImages: [
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1565514020179-026b92b84bb6?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1567789884554-0b844b597180?auto=format&fit=crop&q=80&w=600"
      ]
    },
    {
      name: "Ganzhou Mingxiang Toys Co., Ltd.",
      logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=50&h=50&fit=crop",
      verified: true,
      years: t('mfr.list.years', { count: 5 }),
      staff: t('mfr.list.staff', { count: '200+' }),
      area: t('mfr.list.area', { size: '3.000+' }),
      revenue: "$500 B+",
      rating: "4.7",
      reviews: t('mfr.list.reviews', { count: '120+' }),
      capabilities: [t('mfr.list.responseTime', { time: '2h' }), t('mfr.list.onTimeDelivery', { pct: '98.5%' })],
      certifications: ["ISO", "CE"],
      products: [
        { image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=200", price: "$6,50-7,60", moq: t('common.minOrder', { count: 100 }) },
        { image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&q=80&w=200", price: "$7,60-8,80", moq: t('common.minOrder', { count: 100 }) },
        { image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=200", price: "$8,60-10,60", moq: t('common.minOrder', { count: 50 }) },
        { image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=200", price: "$6,50-7,60", moq: t('common.minOrder', { count: 100 }) }
      ],
      factoryImages: [
        "https://images.unsplash.com/photo-1565514020179-026b92b84bb6?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1567789884554-0b844b597180?auto=format&fit=crop&q=80&w=600"
      ]
    },
    {
      name: "Shenzhen Dingyi Electronics Technology Co., Ltd.",
      logo: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=50&h=50&fit=crop",
      verified: true,
      years: t('mfr.list.years', { count: 8 }),
      staff: t('mfr.list.staff', { count: '500+' }),
      area: t('mfr.list.area', { size: '20.000+' }),
      revenue: "$1 T+",
      rating: "4.8",
      reviews: t('mfr.list.reviews', { count: '250+' }),
      capabilities: [t('mfr.list.responseTime', { time: '1h' }), t('mfr.list.onTimeDelivery', { pct: '99.2%' })],
      certifications: ["ISO", "CE", "RoHS", "FCC"],
      products: [
        { image: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&q=80&w=200", price: "$12,00-15,00", moq: t('common.minOrder', { count: 50 }) },
        { image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&q=80&w=200", price: "$25,00-30,00", moq: t('common.minOrder', { count: 20 }) },
        { image: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&q=80&w=200", price: "$8,00-10,00", moq: t('common.minOrder', { count: 100 }) },
        { image: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&q=80&w=200", price: "$12,00-15,00", moq: t('common.minOrder', { count: 50 }) }
      ],
      factoryImages: [
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1565514020179-026b92b84bb6?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1567789884554-0b844b597180?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600"
      ]
    }
  ];

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

  return `
    <div class="flex flex-col">
      ${manufacturers.map((mfg, idx) => renderFactoryCard(mfg, idx)).join('')}
    </div>
    ${lightboxModal}
  `;
}

function renderFactoryCard(mfg: any, cardIndex: number): string {
  const verifiedBadge = mfg.verified ? `
        <img src="https://img.icons8.com/fluency/16/verified-badge.png" alt="${t('mfr.list.verified')}" class="w-4 h-4" />
        <span class="text-[#1a66ff] font-bold text-[13px]">${t('mfr.list.verified')}</span>
    ` : '';

  const certBadges = mfg.certifications.map((cert: string) => `
        <span class="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-[10px] font-bold text-gray-600 border border-gray-200">${cert}</span>
    `).join('');

  const totalImages = mfg.factoryImages.length;

  return `
    <div class="bg-white rounded-lg p-3 mb-2 lg:p-5 lg:mb-5" data-factory-card="${cardIndex}" data-factory-name="${mfg.name}" data-factory-images='${JSON.stringify(mfg.factoryImages)}'>
      <!-- Desktop Layout -->
      <div class="hidden lg:flex flex-col">
        <!-- Card Title Row -->
        <div class="flex flex-col xl:flex-row gap-4 xl:gap-0 justify-between items-start mb-6 xl:mb-8">
        <!-- Left: Logo + Info -->
        <div class="flex items-start min-w-0">
          <div class="w-[45px] h-[45px] xl:w-[50px] xl:h-[50px] border border-[#ddd] rounded overflow-hidden shrink-0 mr-3">
            <img src="${mfg.logo}" alt="${mfg.name}" class="w-full h-full object-cover" />
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="text-[15px] xl:text-[16px] font-bold text-[#222] truncate max-w-[350px] xl:max-w-[440px]">${mfg.name}</h3>
            <div class="flex flex-wrap items-center gap-1 xl:gap-1.5 mt-1 text-[12px] xl:text-[14px] text-[#222]">
              ${verifiedBadge}
              <span>${mfg.years}</span>
              <span class="text-gray-400">·</span>
              <span>${mfg.staff}</span>
              <span class="text-gray-400 hidden xl:inline">·</span>
              <span class="hidden xl:inline">${mfg.area}</span>
              <span class="text-gray-400">·</span>
              <span>${mfg.revenue}</span>
            </div>
          </div>
        </div>

        <!-- Right: Action Buttons -->
        <div class="flex items-center gap-2 xl:gap-5 shrink-0">
          <button type="button" class="text-gray-400 hover:text-red-500 transition-colors" aria-label="${t('mfr.list.addToFavorites')}">
            <svg class="w-[20px] h-[20px] xl:w-[25px] xl:h-[25px]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
          <button type="button" class="h-8 xl:h-10 px-3 xl:px-4 border border-[#222] rounded-full text-[12px] xl:text-[14px] font-bold text-[#222] bg-white hover:bg-gray-50 transition-colors whitespace-nowrap">
            ${t('mfr.list.chatNow')}
          </button>
          <button type="button" class="h-8 xl:h-10 px-3 xl:px-4 border border-[#222] rounded-full text-[12px] xl:text-[14px] font-bold text-[#222] bg-white hover:bg-gray-50 transition-colors whitespace-nowrap">
            ${t('mfr.list.contactUs')}
          </button>
        </div>
      </div>

      <!-- Card Content Row -->
      <div class="flex justify-between gap-3 xl:gap-3 2xl:gap-4">
        <!-- Left Column: Info -->
        <div class="w-[180px] xl:w-[244px] shrink-0 pr-1 xl:pr-3">
          <h4 class="text-[12px] xl:text-[14px] font-normal text-[#222] mb-1">${t('mfr.list.rankingsAndReviews')}</h4>
          <div class="mb-4 xl:mb-6 text-[12px] xl:text-[14px]">
            <strong class="text-[#222]">${mfg.rating}</strong><span class="text-[#222]">/5</span>
            <a href="#" class="underline text-[#222] hover:text-[#1a66ff] ml-1">(${mfg.reviews})</a>
          </div>
          <h4 class="text-[12px] xl:text-[14px] font-normal text-[#222] mb-2">${t('mfr.list.factoryCapacity')}</h4>
          <ul class="space-y-0.5">
            ${mfg.capabilities.map((cap: string) => `
              <li class="text-[12px] xl:text-[14px] leading-[20px] xl:leading-[25px] font-bold text-[#222] truncate">· ${cap}</li>
            `).join('')}
            <li class="text-[12px] xl:text-[14px] leading-[20px] xl:leading-[25px] font-bold text-[#222] flex items-center gap-1 xl:gap-1.5 flex-wrap">
              · ${t('mfr.list.certifications')}: ${certBadges}
            </li>
          </ul>
        </div>

        <!-- Middle Column: Products -->
        <div class="flex gap-2 xl:gap-3 flex-1 min-w-0">
          ${mfg.products.map((prod: any) => `
            <a href="#" class="flex flex-col group flex-1 min-w-0">
              <div class="w-full aspect-[1/1] rounded-lg overflow-hidden bg-gray-100 shrink-0">
                <img src="${prod.image}" alt="${t('mfr.list.product')}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <p class="text-[13px] xl:text-[16px] font-bold text-[#222] mt-2 xl:mt-3 truncate">${formatPrice(prod.price)}</p>
              <p class="text-[11px] xl:text-[14px] text-[#222] mt-0.5 xl:mt-1 truncate">${prod.moq}</p>
            </a>
          `).join('')}
        </div>

        <!-- Right Column: Factory Slider (Swiper) -->
        <div class="factory-slider w-[220px] xl:w-[320px] h-[165px] xl:h-[240px] shrink-0 relative lg:ml-2 xl:ml-2" data-slider-root="${cardIndex}">
          <div class="swiper factory-swiper-${cardIndex} w-full h-full overflow-hidden">
            <div class="swiper-wrapper">
              ${mfg.factoryImages.map((img: string, i: number) => `
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
        </div>
      </div>
    </div>

    <!-- Mobile Layout -->
    <div class="lg:hidden flex flex-col gap-2">
        <!-- Logo and Title -->
        <div class="flex items-center gap-2 mb-1.5">
          <img src="${mfg.logo}" alt="${mfg.name}" class="w-[28px] h-[28px] rounded-sm shrink-0 border border-gray-100 object-cover" />
          <h3 class="text-[14px] font-bold text-[#222] truncate">${mfg.name}</h3>
          <span class="text-[12px] text-gray-400 shrink-0 ml-auto">${mfg.years}</span>
        </div>

        <!-- Stats -->
        <div class="text-[11px] text-[#222] mb-1.5 truncate flex items-center">
          <span class="font-bold">${mfg.capabilities.find((c: string) => c.includes(t('mfr.list.onTimeDeliveryShort'))) || t('mfr.list.onTimeDelivery', { pct: '100%' })}</span>
          <span class="mx-1.5 text-gray-300">|</span>
          <span>${mfg.capabilities.find((c: string) => c.includes(t('mfr.list.responseTimeShort')))?.replace(t('mfr.list.responseTimeShort'), t('mfr.list.responseTimeLong')) || t('mfr.list.responseTimeLong') + ' ≤1h'}</span>
        </div>

        <!-- Tags -->
        <div class="flex gap-1.5 mb-2.5 flex-wrap">
            <span class="bg-[#f5f5f5] text-[#222] text-[11px] px-2 py-0.5 rounded-sm font-medium">${t('mfr.list.odmService')}</span>
            <span class="bg-[#f5f5f5] text-[#222] text-[11px] px-2 py-0.5 rounded-sm font-medium">${t('mfr.filter.fullCustomization')}</span>
        </div>

        <!-- Products Grid (4 items) -->
        <div class="grid grid-cols-4 gap-1.5 w-full">
            ${mfg.products.slice(0, 4).map((prod: any) => `
              <div class="relative aspect-[1/1.05] w-full bg-gray-50 overflow-hidden rounded-[4px]">
                <img src="${prod.image}" class="w-full h-full object-cover mix-blend-multiply" />
                <!-- Price Overlay at Bottom -->
                <div class="absolute bottom-0 inset-x-0 w-full bg-gradient-to-t from-black/70 to-transparent pt-4 pb-1 px-1 flex justify-center">
                  <span class="text-white font-bold text-[13px] tracking-tight">${formatPrice(prod.price.split('-')[0])}</span>
                </div>
              </div>
            `).join('')}
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
}
