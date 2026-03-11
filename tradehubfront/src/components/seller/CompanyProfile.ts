import type { SellerStorefrontData, SellerProfile, ProductCategory, SimpleProduct, CompanyInfo as CompanyInfoData, Certificate, ContactFormData, CategoryCard } from '../../types/seller/types';
import { formatPrice } from '../../utils/currency';
import { t } from '../../i18n';
import { CompanyInfoComponent } from './CompanyInfo';
import { Certificates } from './Certificates';
import { ContactForm } from './ContactForm';
import { CategoryGrid } from './CategoryGrid';

function lensIcon(): string {
  return `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M3 9a2 2 0 0 1 2-2h2l1-2h8l1 2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  `;
}

function renderSellerProductCard(product: any, index: number = 0): string {
  const price = typeof product.priceMin === 'number' ? formatPrice('$' + product.priceMin.toFixed(2)) : formatPrice('$25.40');
  const nameSafe = product.name.replace(/"/g, '&quot;');
  const link = product.link || '/pages/product-detail.html';
  const soldCount = product.soldCount || 0;
  const moqText = product.moq ? `${product.moq} ${product.moqUnit}` : `1 ${t('seller.sf.unitPiece')}`;

  // Find discount badge if exists
  const discountBadge = (product.badges || []).find((b: { type: string, label: string }) => b.type === 'discount');
  const discountText = discountBadge ? discountBadge.label : '';

  return `
    <a
      class="product-card flex flex-col relative w-full gap-2 overflow-hidden text-sm leading-[18px] text-start no-underline animate-fade-slide-up"
      style="animation-delay: ${Math.min(index * 60, 600)}ms;"
      href="${link}"
      aria-label="${nameSafe}"
    >
      <!-- Image area -->
      <div class="product-card__image-area relative">
        <div class="product-card__image-wrap relative w-full h-full min-w-0 min-h-0 overflow-hidden leading-[0]">
          <img
            class="product-card__img block w-full max-w-full h-full object-cover origin-center"
            src="${product.image}"
            alt="${nameSafe}"
            loading="lazy"
          />
        </div>
        <div class="product-card__lens-wrap absolute">
          <div
            class="product-card__lens flex relative items-center justify-center w-full h-full rounded-full"
            role="button"
            aria-label="${t('seller.sf.findSimilar')}"
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
              <span title="${nameSafe}">${product.name}</span>
            </div>
          </div>

          <div class="flex flex-col gap-px">
            <!-- Price + discount -->
            <div class="flex flex-wrap items-center gap-1 min-h-[26px] overflow-hidden">
              <div class="product-card__price overflow-hidden">${price}</div>
              ${discountText ? `<div class="product-card__discount">${discountText}</div>` : ''}
            </div>

            <!-- MOQ + sold -->
            <div class="product-card__moq-line overflow-hidden h-[18px] leading-[18px]">
              <div class="product-card__moq inline mr-1"><bdi>${moqText}</bdi></div>
              <span class="product-card__stats" title="${t('seller.sf.soldCount', { count: soldCount })}">${t('seller.sf.soldCount', { count: soldCount })}</span>
            </div>

            <!-- Supplier info -->
            <div class="product-card__supplier flex items-center min-h-[18px] pt-0.5 leading-4">
              <span class="product-card__supplier-text block overflow-hidden text-ellipsis">${t('seller.sf.year', { count: 1 })}</span>
              <span class="product-card__supplier-text block overflow-hidden text-ellipsis">CN</span>
            </div>
          </div>
        </div>
      </div>
    </a>
  `;
}

// Mock Review Data Type (to be added to types/seller/types.ts)
export interface SellerReview {
  id: string;
  reviewerName: string;
  country: string;
  countryFlag: string;
  date: string;
  comment: string;
  productName: string;
  productImage: string;
  productPrice: string;
}

export interface SellerPerformanceStats {
  rating: number;
  reviewCount: number;
  responseTime: string;
  onTimeDeliveryRate: string;
  transactions: number;
  supplierServiceScore: number;
  onTimeShipmentScore: number;
  productQualityScore: number;
}

function ContactSidebar(seller: SellerProfile): string {
  return `
    <div class="company-profile__sidebar sticky top-[100px] bg-white rounded-(--radius-md) border border-gray-200 p-4 sm:p-6" x-show="activeTab !== 'contact'" x-transition>
      <h3 class="text-[18px] font-bold text-gray-900 mb-4">${t('seller.sf.contactSupplier')}</h3>
      
      <div class="flex items-center gap-3 mb-6">
        <div class="w-12 h-12 flex items-center justify-center rounded overflow-hidden shadow-sm border border-gray-100 p-1">
          <img src="${seller.logo}" alt="${seller.name}" class="w-full h-full object-contain" />
        </div>
        <div>
          <h4 class="text-[14px] font-medium text-gray-900 leading-tight line-clamp-2">${seller.name}</h4>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <button @click="setTab('contact')" class="w-full th-btn th-btn-pill company-profile__contact-btn">
          ${t('seller.sf.contactNow')}
        </button>
        <button @click="setTab('contact')" class="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-medium py-2.5 px-4 rounded-full transition-colors text-[14px] company-profile__inquiry-btn">
          ${t('seller.sf.sendInquiry')}
        </button>
      </div>
    </div>
  `;
}

// ─── Overview Tab (Genel Bakış) ────────────────────────────────
function OverviewTab(stats: SellerPerformanceStats, mainProducts: SimpleProduct[]): string {
  return `
    <div class="company-profile__tab-content" x-show="activeTab === 'overview'" x-transition.opacity.duration.300ms id="tab-overview">
      
      <!-- Performance Section -->
      <section class="bg-white rounded-(--radius-md) border border-gray-200 p-6 mb-6">
        <h3 class="text-[18px] font-bold text-gray-900 mb-6">${t('seller.sf.performance')}</h3>
        
        <div class="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-8">
          <!-- Stats -->
          <div>
            <div class="flex items-end gap-2 mb-4">
              <span class="text-[32px] font-bold leading-none text-gray-900">${stats.rating.toFixed(1)}</span>
              <span class="text-[14px] text-gray-500 mb-1">/5</span>
              <div class="ml-2">
                <span class="block text-[12px] text-gray-900 font-medium">${t('seller.sf.satisfactory')}</span>
                <button type="button" @click="setTab('reviews')" class="text-[12px] text-blue-600 hover:underline cursor-pointer">${stats.reviewCount} ${t('seller.sf.reviews')}</button>
              </div>
            </div>
            
            <ul class="space-y-2 text-[13px] text-gray-900 mb-6 font-medium">
              <li class="flex items-center gap-2"><span>&le;${stats.responseTime}</span> <span class="text-gray-500 font-normal">${t('seller.sf.avgResponseTime')}</span></li>
              <li class="flex items-center gap-2"><span>${stats.onTimeDeliveryRate}</span> <span class="text-gray-500 font-normal">${t('seller.sf.onTimeDeliveryRate')}</span></li>
              <li class="flex items-center gap-2"><span>${stats.transactions}+</span> <span class="text-gray-500 font-normal">${t('seller.sf.orders')}</span></li>
            </ul>

            <div class="pt-4 border-t border-gray-100">
              <h4 class="text-[13px] font-bold text-gray-900 mb-3 flex items-center gap-2">
                ${t('seller.sf.supplierCapacity')} <span class="text-[11px] font-normal text-gray-500">${t('seller.sf.verifiedBy')} <strong>Intertek</strong></span>
              </h4>
              <ul class="space-y-2 text-[13px] text-gray-600">
                <li class="flex items-center gap-2"><svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg> ${t('seller.sf.minorCustomization')}</li>
                <li class="flex items-center gap-2"><svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg> ${t('seller.sf.drawingCustomization')}</li>
                <li class="flex items-center gap-2"><svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg> ${t('seller.sf.finalProductInspection')}</li>
                 <li class="flex items-center gap-2"><svg class="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg> ${t('seller.sf.warrantyOptions')}</li>
              </ul>
            </div>
          </div>
          
          <!-- Video / Images Gallery -->
          <div class="relative rounded-lg overflow-hidden bg-gray-100 aspect-video group cursor-pointer company-profile__video-trigger">
            <img src="https://images.unsplash.com/photo-1581091226825-acb28bd45c61?q=80&w=800&auto=format&fit=crop" alt="Factory Video" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
               <div class="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                 <svg class="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
               </div>
            </div>
          </div>

        </div>
      </section>

      <!-- Main Products Section -->
      <section class="bg-white rounded-(--radius-md) border border-gray-200 p-6">
        <h3 class="text-[18px] font-bold text-gray-900 mb-6 uppercase">${t('seller.sf.mainProducts')}</h3>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 product-grid">
          ${mainProducts.map((product, idx) => renderSellerProductCard(product, idx)).join('')}
        </div>
      </section>

    </div>
  `;
}

// ─── Reviews Tab (Yorumlar) ────────────────────────────────────
function ReviewsTab(stats: SellerPerformanceStats, reviews: SellerReview[]): string {
  return `
    <div class="company-profile__tab-content" x-show="activeTab === 'reviews'" x-transition.opacity.duration.300ms id="tab-reviews">
      <section class="bg-white rounded-(--radius-md) border border-gray-200 p-6">
        <h3 class="text-[18px] font-bold text-gray-900 mb-8">${t('seller.sf.companyReviews')} (${stats.reviewCount})</h3>
        
        <!-- Score Breakdown -->
        <div class="flex flex-col md:flex-row gap-12 mb-10 pb-10 border-b border-gray-100">
          <div class="flex flex-col">
            <div class="text-[48px] font-bold text-gray-900 leading-none">${stats.rating.toFixed(1)} <span class="text-[16px] text-gray-500 font-normal">/5</span></div>
            <div class="text-[14px] text-gray-600 font-medium mt-1">${t('seller.sf.satisfied')}</div>
          </div>
          
          <div class="flex-1 max-w-md space-y-3">
            <div class="flex items-center justify-between text-[13px]">
              <span class="text-gray-600 w-32">${t('seller.sf.supplierService')}</span>
              <div class="flex-1 mx-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-[var(--color-primary-500)] rounded-full" style="width: ${(stats.supplierServiceScore / 5) * 100}%"></div>
              </div>
              <span class="font-bold text-gray-900">${stats.supplierServiceScore.toFixed(1)}</span>
            </div>
            <div class="flex items-center justify-between text-[13px]">
              <span class="text-gray-600 w-32">${t('seller.sf.onTimeShipment')}</span>
              <div class="flex-1 mx-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-[var(--color-primary-500)] rounded-full" style="width: ${(stats.onTimeShipmentScore / 5) * 100}%"></div>
              </div>
              <span class="font-bold text-gray-900">${stats.onTimeShipmentScore.toFixed(1)}</span>
            </div>
            <div class="flex items-center justify-between text-[13px]">
              <span class="text-gray-600 w-32">${t('seller.sf.productQuality')}</span>
              <div class="flex-1 mx-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-[var(--color-primary-500)] rounded-full" style="width: ${(stats.productQualityScore / 5) * 100}%"></div>
              </div>
              <span class="font-bold text-gray-900">${stats.productQualityScore.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <!-- Reviews List -->
        <div class="space-y-8">
          ${reviews.map(review => `
            <div class="flex flex-col sm:flex-row gap-4 sm:gap-8">
              <div class="w-full sm:w-48 flex-shrink-0">
                <div class="flex items-center gap-2 text-[13px] font-medium text-gray-900 mb-1">
                  ${review.reviewerName} <span class="text-lg" title="${review.country}">${review.countryFlag}</span>
                </div>
                <div class="text-[12px] text-gray-400">${review.date}</div>
              </div>
              
              <div class="flex-1">
                <p class="text-[14px] text-gray-700 mb-4">${review.comment}</p>
                
                <div class="flex items-start gap-3 bg-gray-50 p-3 rounded-md border border-gray-100">
                  <img src="${review.productImage}" alt="${review.productName}" class="w-12 h-12 object-cover rounded bg-white border border-gray-200">
                  <div>
                    <a href="#" class="text-[12px] text-gray-600 hover:text-[var(--color-primary-500)] line-clamp-2 transition-colors">${review.productName}</a>
                    <div class="text-[13px] font-medium text-gray-900 mt-1">${formatPrice(review.productPrice)}</div>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="mt-8 text-center">
           <button class="px-6 py-2 border border-gray-300 rounded-full text-[14px] font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors">
              ${t('seller.sf.browseAllReviews')}
           </button>
        </div>
      </section>
    </div>
  `;
}

// ─── Products Tab (Ürünler) ────────────────────────────────────
function ProductsTab(categories: ProductCategory[]): string {
  // Flatten products for "All" view
  const allProducts = categories.flatMap(c => c.products).slice(0, 12);

  return `
    <div class="company-profile__tab-content" x-show="activeTab === 'products'" x-transition.opacity.duration.300ms id="tab-products">
      <section class="bg-white rounded-(--radius-md) border border-gray-200 p-6">
        
        <!-- Category Filter Bar -->
        <div class="flex items-center border-b border-gray-200 mb-6 overflow-x-auto no-scrollbar pb-1">
          <button class="company-profile__prod-cat active whitespace-nowrap px-4 py-2 text-[14px] font-bold text-gray-900 border-b-2 border-gray-900">${t('seller.sf.all')}</button>
          ${categories.map(cat => `
             <button class="company-profile__prod-cat whitespace-nowrap px-4 py-2 text-[14px] font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent transition-colors">${cat.name}</button>
          `).join('')}
        </div>

        <!-- Dynamic Product Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 product-grid">
          ${allProducts.map((product, idx) => renderSellerProductCard(product, idx)).join('')}
        </div>
      </section>
    </div>
  `;
}

// ─── Categories Tab (Kategoriler) ────────────────────────────────────
function CategoriesTab(categories: CategoryCard[]): string {
  // Using the new CategoryGrid component
  return `
    <div class="company-profile__tab-content" x-show="activeTab === 'categories'" x-transition.opacity.duration.300ms id="tab-categories">
      ${CategoryGrid(categories)}
    </div>
  `;
}

// ─── Company Info Tab (Şirket Bilgileri) ─────────────────────────────
function CompanyTab(seller: SellerProfile, infoData: CompanyInfoData, certs: Certificate[]): string {
  return `
    <div class="company-profile__tab-content" x-show="activeTab === 'company'" x-transition.opacity.duration.300ms id="tab-company">
      <div class="bg-white rounded-(--radius-md) border border-gray-200 mb-6 px-4">
        ${CompanyInfoComponent(infoData, seller)}
      </div>
      <div class="bg-white rounded-(--radius-md) border border-gray-200 px-4">
        ${Certificates(certs)}
      </div>
    </div>
  `;
}

// ─── Contact Info Tab (İletişim) ─────────────────────────────────────
function ContactTab(formData: ContactFormData): string {
  return `
    <div class="company-profile__tab-content" x-show="activeTab === 'contact'" x-transition.opacity.duration.300ms id="tab-contact">
      ${ContactForm(formData)}
    </div>
  `;
}

// ─── Main Wrapper ──────────────────────────────────────────────
export function CompanyProfileComponent(
  data: SellerStorefrontData,
  stats: SellerPerformanceStats,
  reviews: SellerReview[]
): string {
  const seller = data.seller;
  const categories = data.categoryListings || [];
  const categoryCards = data.categoryCards || [];
  const companyInfo = data.company || {} as CompanyInfoData;
  const certs = data.certificates || [];
  const contact = data.contactForm || {} as ContactFormData;
  const mainProducts = data.hotProducts || [];
  // Placeholder data for the mock integration
  // Need to import mock data dynamically or rely on it passed from seller-storefront.ts
  // For now, assume it's exposed or injected.
  return `
    <section class="company-profile bg-[#f9fafb] py-8 min-h-screen" aria-label="${t('seller.sf.sellerProfile')}">
      <div class="max-w-(--container-xl) mx-auto px-[clamp(0.75rem,0.5rem+1vw,1.5rem)] lg:px-6 xl:px-8">
        
        <!-- Main Navigation Tabs -->
        <div class="bg-white rounded-t-(--radius-md) border-b border-gray-200 px-3 sm:px-6 py-0 flex items-center gap-4 sm:gap-8 mb-6 overflow-x-auto no-scrollbar">
          <button @click="setTab('overview')" :class="activeTab === 'overview' ? 'active font-bold text-gray-900 border-gray-900 border-b-2' : 'font-medium text-gray-500 hover:text-gray-900 border-transparent border-b-2'" class="company-profile__main-tab py-4 text-[15px] transition-colors whitespace-nowrap">${t('seller.sf.myAccount')}</button>
          <button @click="setTab('reviews')" :class="activeTab === 'reviews' ? 'active font-bold text-gray-900 border-gray-900 border-b-2' : 'font-medium text-gray-500 hover:text-gray-900 border-transparent border-b-2'" class="company-profile__main-tab py-4 text-[15px] transition-colors whitespace-nowrap">${t('seller.sf.reviewsTab')}</button>
          <button @click="setTab('products')" :class="activeTab === 'products' ? 'active font-bold text-gray-900 border-gray-900 border-b-2' : 'font-medium text-gray-500 hover:text-gray-900 border-transparent border-b-2'" class="company-profile__main-tab py-4 text-[15px] transition-colors whitespace-nowrap">${t('seller.sf.productsTab')}</button>
          <button @click="setTab('categories')" :class="activeTab === 'categories' ? 'active font-bold text-gray-900 border-gray-900 border-b-2' : 'font-medium text-gray-500 hover:text-gray-900 border-transparent border-b-2'" class="company-profile__main-tab py-4 text-[15px] transition-colors whitespace-nowrap">${t('seller.sf.categoriesTab')}</button>
          <button @click="setTab('company')" :class="activeTab === 'company' ? 'active font-bold text-gray-900 border-gray-900 border-b-2' : 'font-medium text-gray-500 hover:text-gray-900 border-transparent border-b-2'" class="company-profile__main-tab py-4 text-[15px] transition-colors whitespace-nowrap">${t('seller.sf.companyProfile')}</button>
          <button @click="setTab('contact')" :class="activeTab === 'contact' ? 'active font-bold text-gray-900 border-gray-900 border-b-2' : 'font-medium text-gray-500 hover:text-gray-900 border-transparent border-b-2'" class="company-profile__main-tab py-4 text-[15px] transition-colors whitespace-nowrap">${t('seller.sf.contactTab')}</button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          <!-- Left Content Area (Tabs) -->
          <div class="lg:col-span-3">
            ${OverviewTab(stats, mainProducts)}
            ${ReviewsTab(stats, reviews)}
            ${ProductsTab(categories)}
            ${CategoriesTab(categoryCards)}
            ${CompanyTab(seller, companyInfo, certs)}
            ${ContactTab(contact)}
          </div>

          <!-- Right Sidebar -->
          <div class="lg:col-span-1 border-l border-gray-100 lg:pl-2">
            ${ContactSidebar(seller)}
          </div>

        </div>
      </div>
    </section>
  `;
}
