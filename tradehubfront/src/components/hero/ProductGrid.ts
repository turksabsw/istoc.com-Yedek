/**
 * ProductGrid Component
 * Themeable product card grid with Tailwind layout + CSS variable theming.
 */
import { t } from '../../i18n';
import { formatPrice } from '../../utils/currency';

interface ProductCard {
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

const productCardSeed: ProductCard[] = [
  {
    name: "Custom Beanie Patch Hat | Leather Patch Winter Beanie ADD YOUR LOGO Company Employee...",
    href: '/pages/product-detail.html',
    price: '$1.28-2.99',
    discountPercent: 15,
    moqCount: 10,
    moqUnit: 'pcs',
    soldCount: '19,070',
    imageSrc: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&h=600&q=80',
    supplierYearCount: 5,
    supplierCountry: 'CN',
  },
  {
    name: 'New Wireless TWS M10 Mini Black Earbuds Earphone Headphone Power Bank In-ear...',
    href: '/pages/product-detail.html',
    price: '$1.30-1.99',
    discountPercent: 10,
    moqCount: 1,
    moqUnit: 'pcs',
    soldCount: '341',
    imageSrc: 'https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?auto=format&fit=crop&w=600&h=600&q=80',
    supplierYearCount: 1,
    supplierCountry: 'CN',
  },
  {
    name: "Hot Sale 125ml High Quality Men's Perfume Floral Fragrance Light and Long Lasting Factory...",
    href: '/pages/product-detail.html',
    price: '$6.02-7.02',
    moqCount: 10,
    moqUnit: 'pcs',
    soldCount: '490',
    imageSrc: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=600&h=600&q=80',
    supplierYearCount: 1,
    supplierCountry: 'CN',
  },
  {
    name: 'Free to Door DHL FEDEX UPS Express Sea Railway Air Shipping Agent China to Egypt Freight...',
    href: '/pages/product-detail.html',
    price: '$0.50-1',
    discountPercent: 5,
    moqCount: 1,
    moqUnit: 'kg',
    soldCount: '880',
    imageSrc: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=600&h=600&q=80',
    supplierYearCount: 1,
    supplierCountry: 'CN',
  },
  {
    name: 'Cross-Border New Style Cat-Eye Glasses Frame Fashion Eyewear...',
    href: '/pages/product-detail.html',
    price: '$1.53-1.62',
    discountPercent: 8,
    moqCount: 5,
    moqUnit: 'pcs',
    soldCount: '649',
    imageSrc: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&h=600&q=80',
    supplierYearCount: 1,
    supplierCountry: 'CN',
  },
  {
    name: "MORESE 2085 Men's Optical Eyeglasses Frame Full Rim...",
    href: '/pages/product-detail.html',
    price: '$3.65-4.05',
    moqCount: 2,
    moqUnit: 'pcs',
    soldCount: '228',
    imageSrc: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=600&h=600&q=80',
    supplierYearCount: 7,
    supplierCountry: 'CN',
  },
  {
    name: '2026 New Smart Fitness Watch Waterproof Touch Screen Men Women...',
    href: '/pages/product-detail.html',
    price: '$4.10-5.90',
    discountPercent: 12,
    moqCount: 2,
    moqUnit: 'pcs',
    soldCount: '1,102',
    imageSrc: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&h=600&q=80',
    supplierYearCount: 3,
    supplierCountry: 'CN',
  },
  {
    name: 'Wholesale Mini Crossbody Bag PU Leather Casual Fashion Design...',
    href: '/pages/product-detail.html',
    price: '$2.10-3.40',
    moqCount: 20,
    moqUnit: 'pcs',
    soldCount: '2,345',
    imageSrc: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&h=600&q=80',
    supplierYearCount: 2,
    supplierCountry: 'CN',
  },
  {
    name: 'Oversized Cotton Streetwear Blank T-Shirt Custom Logo Printing...',
    href: '/pages/product-detail.html',
    price: '$2.60-3.20',
    discountPercent: 10,
    moqCount: 30,
    moqUnit: 'pcs',
    soldCount: '978',
    imageSrc: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&h=600&q=80',
    supplierYearCount: 4,
    supplierCountry: 'CN',
  },
  {
    name: 'Wireless Bluetooth Stereo Headphones Foldable Deep Bass Sound...',
    href: '/pages/product-detail.html',
    price: '$5.30-7.20',
    moqCount: 5,
    moqUnit: 'pcs',
    soldCount: '413',
    imageSrc: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=600&q=80',
    supplierYearCount: 1,
    supplierCountry: 'CN',
  },
  {
    name: 'Private Label Skincare Moisturizing Essence Serum Set OEM...',
    href: '/pages/product-detail.html',
    price: '$3.90-6.50',
    discountPercent: 20,
    moqCount: 12,
    moqUnit: 'pcs',
    soldCount: '752',
    imageSrc: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&h=600&q=80',
    supplierYearCount: 2,
    supplierCountry: 'CN',
  },
  {
    name: 'Premium Optical Frames With Case Lightweight Business Style...',
    href: '/pages/product-detail.html',
    price: '$2.95-3.88',
    moqCount: 6,
    moqUnit: 'pcs',
    soldCount: '529',
    imageSrc: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=600&h=600&q=80',
    supplierYearCount: 5,
    supplierCountry: 'CN',
  },
];

function lensIcon(): string {
  return `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M3 9a2 2 0 0 1 2-2h2l1-2h8l1 2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  `;
}

function renderProductCard(card: ProductCard, index: number): string {
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
    <a
      class="product-card flex flex-col relative w-full gap-2 overflow-hidden text-sm leading-[18px] text-start no-underline animate-fade-slide-up"
      style="animation-delay: ${index * 60}ms;"
      href="${card.href}"
      target="_blank"
      aria-label="${safeName}"
    >
      <!-- Image area -->
      <div class="product-card__image-area relative">
        <div class="product-card__image-wrap relative w-full h-full min-w-0 min-h-0 overflow-hidden leading-[0]">
          <img
            class="product-card__img block w-full max-w-full h-full object-cover origin-center"
            src="${card.imageSrc}"
            alt="${safeName}"
            loading="lazy"
          />
        </div>
        <div class="product-card__lens-wrap absolute">
          <div
            class="product-card__lens flex relative items-center justify-center w-full h-full rounded-full"
            role="button"
            aria-label="${t('productGrid.findSimilar')}"
            data-i18n-aria-label="productGrid.findSimilar"
            tabindex="0"
          >
            ${lensIcon()}
          </div>
        </div>
      </div>

      <!-- Content area -->
      <div class="flex flex-col gap-2 w-full min-h-[126px]">
        <div class="flex flex-col gap-2">
          <!-- Title (3 lines) -->
          <div class="product-card__title-wrap h-[54px] overflow-hidden">
            <div class="product-card__title line-clamp-3 h-[54px]">
              <span title="${safeName}">${card.name}</span>
            </div>
          </div>

          <div class="flex flex-col gap-px">
            <!-- Price + discount -->
            <div class="flex flex-wrap items-center gap-1 min-h-[26px] overflow-hidden">
              <div class="product-card__price overflow-hidden">${formatPrice(card.price)}</div>
              ${discountText ? `<div class="product-card__discount">${discountText}</div>` : ''}
            </div>

            <!-- MOQ + sold -->
            <div class="product-card__moq-line overflow-hidden h-[18px] leading-[18px]">
              <div class="product-card__moq inline mr-1"><bdi>${moqText}</bdi></div>
              <span class="product-card__stats" title="${soldText}">${soldText}</span>
            </div>

            <!-- Supplier info -->
            <div class="product-card__supplier flex items-center min-h-[18px] pt-0.5 leading-4">
              ${supplierYearsText ? `<span class="product-card__supplier-text block overflow-hidden text-ellipsis">${supplierYearsText}</span>` : ''}
              ${card.supplierCountry ? `<span class="product-card__supplier-text block overflow-hidden text-ellipsis">${card.supplierCountry}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    </a>
  `;
}

/** No-op — ProductGrid uses CSS grid, no JS initialization needed. */
export function initProductGrid(): void { }

export function ProductGrid(): string {
  return `
    <section
      data-theme-section="productgrid"
      aria-label="Recommended Products"
      style="background-color: var(--product-bg, #f4f4f4); padding-top: 28px; padding-bottom: 28px;"
    >
      <div class="container-wide">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 product-grid home-product-grid" style="gap: var(--product-grid-gap, 8px);" role="list" aria-label="Product listings">
          ${productCardSeed.map((card, index) => renderProductCard(card, index)).join('')}
        </div>
      </div>
    </section>
  `;
}
