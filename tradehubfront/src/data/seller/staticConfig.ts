/**
 * Seller Storefront — Static Configuration
 * Structural/template data separated from dynamic API data.
 * These are page-layout items that don't change per-seller.
 * Internationalized: all user-visible strings use t() calls.
 */
import { t } from '../../i18n';
import type {
  StoreNavData,
  HeroBannerData,
  CategoryCard,
  SimpleProduct,
  ContactFormData,
  FloatingActionsData,
} from '../../types/seller/types';

// ─── C2: Navigation Structure ───────────────────────────
/** Default navigation structure with tabs and dropdowns. */
export function getNavDataConfig(): StoreNavData {
  return {
    items: [
      { label: t('sellerMock.navHome'), href: '#overview', isActive: true },
      { label: t('sellerMock.navProducts'), href: '#products', isActive: false, dropdownType: 'products' },
      { label: t('sellerMock.navCompanyProfile'), href: '#company', isActive: false, dropdownType: 'company' },
      { label: t('sellerMock.navContact'), href: '#contact', isActive: false },
      { label: t('sellerMock.navCampaigns'), href: '#', isActive: false },
    ],
    productCategories: [
      {
        name: t('sellerMock.pcPrepaidElectric'),
        slug: 'on-odemeli-elektrik',
        hasSubcategories: true,
        subcategories: [
          { name: t('sellerMock.pcSinglePhasePrepaid'), href: '#' },
          { name: t('sellerMock.pcThreePhasePrepaid'), href: '#' },
          { name: t('sellerMock.pcStsToken'), href: '#' },
        ],
      },
      {
        name: t('sellerMock.pcSmartElectric'),
        slug: 'akilli-elektrik',
        hasSubcategories: true,
        subcategories: [
          { name: t('sellerMock.pcWifiModule'), href: '#' },
          { name: t('sellerMock.pcLoraComm'), href: '#' },
          { name: t('sellerMock.pcGprs4g'), href: '#' },
        ],
      },
      {
        name: t('sellerMock.pcIndustrialEnergy'),
        slug: 'endustriyel-enerji',
        hasSubcategories: true,
        subcategories: [
          { name: t('sellerMock.pcCtConnected'), href: '#' },
          { name: t('sellerMock.pcReactiveEnergy'), href: '#' },
        ],
      },
      {
        name: t('sellerMock.pcWaterMeters'),
        slug: 'su-sayaclari',
        hasSubcategories: true,
        subcategories: [
          { name: t('sellerMock.pcUltrasonicWater'), href: '#' },
          { name: t('sellerMock.pcMechanicalWater'), href: '#' },
        ],
      },
      { name: t('sellerMock.pcGasMeters'), slug: 'dogalgaz', hasSubcategories: false },
      { name: t('sellerMock.pcSpareParts'), slug: 'yedek-parca', hasSubcategories: false },
    ],
    companyProfileLinks: [
      { label: t('sellerMock.cpOverview'), href: '#company' },
      { label: t('sellerMock.cpReviews'), href: '#reviews' },
    ],
    searchPlaceholder: t('sellerMock.searchPlaceholder'),
  };
}

// ─── C3: Hero Banner Carousel Structure ─────────────────
/** Default hero banner carousel configuration. */
export function getHeroBannerConfig(): HeroBannerData {
  return {
    slides: [
      {
        id: 'slide-1',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=600&q=80',
        title: 'OEM/ODM',
        subtitle: t('sellerMock.slide1Subtitle'),
        textPosition: 'left',
        textColor: 'dark',
      },
      {
        id: 'slide-2',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=600&q=80',
        title: t('sellerMock.slide2Title'),
        textPosition: 'left',
        textColor: 'dark',
      },
      {
        id: 'slide-3',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=600&q=80',
        title: t('sellerMock.slide3Title'),
        subtitle: t('sellerMock.slide3Subtitle'),
        textPosition: 'center',
        textColor: 'white',
      },
    ],
    autoplayDelay: 5000,
    showPagination: true,
  };
}

// ─── C4: Category Grid Items ────────────────────────────
/** Static category card grid items for storefront page. */
export function getCategoryCardsConfig(): CategoryCard[] {
  return [
    { id: 'cat-1', name: t('sellerMock.cardPrepaidElectric'), bgColor: '#d4e157', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=600&q=80' },
    { id: 'cat-2', name: t('sellerMock.cardSmartElectric'), bgColor: '#90caf9', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=600&q=80' },
    { id: 'cat-3', name: t('sellerMock.cardIndustrialEnergy'), bgColor: '#bdbdbd', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=600&q=80' },
    { id: 'cat-4', name: t('sellerMock.cardUltrasonicWater'), bgColor: '#80deea', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=600&q=80' },
    { id: 'cat-5', name: t('sellerMock.cardMechanicalWater'), bgColor: '#a5d6a7', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=600&q=80' },
    { id: 'cat-6', name: t('sellerMock.cardGasMeters'), bgColor: '#ffcc80', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=600&q=80' },
    { id: 'cat-7', name: t('sellerMock.cardSpareParts'), bgColor: '#f48fb1', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=600&q=80' },
  ];
}

// ─── C5: Default Hot Products Layout ────────────────────
/** Default hot products grid layout for storefront page. */
export function getHotProductsConfig(): SimpleProduct[] {
  return [
    { id: 'hp-1', name: t('sellerMock.hp1'), image: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=400&auto=format&fit=crop', link: '/pages/product-detail.html' },
    { id: 'hp-2', name: t('sellerMock.hp2'), image: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=400&auto=format&fit=crop', link: '/pages/product-detail.html' },
    { id: 'hp-3', name: t('sellerMock.hp3'), image: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?q=80&w=400&auto=format&fit=crop', link: '/pages/product-detail.html' },
    { id: 'hp-4', name: t('sellerMock.hp4'), image: 'https://images.unsplash.com/photo-1627964434947-d5ab70b8c66e?q=80&w=400&auto=format&fit=crop', link: '/pages/product-detail.html' },
    { id: 'hp-5', name: t('sellerMock.hp5'), image: 'https://images.unsplash.com/photo-1631541909061-71e34ddce158?q=80&w=400&auto=format&fit=crop', link: '/pages/product-detail.html' },
    { id: 'hp-6', name: t('sellerMock.hp6'), image: 'https://images.unsplash.com/photo-1582046426742-b06f8c792ea8?q=80&w=400&auto=format&fit=crop', link: '/pages/product-detail.html' },
    { id: 'hp-7', name: t('sellerMock.hp7'), image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400&auto=format&fit=crop', link: '/pages/product-detail.html' },
    { id: 'hp-8', name: t('sellerMock.hp8'), image: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?q=80&w=400&auto=format&fit=crop', link: '/pages/product-detail.html' },
    { id: 'hp-9', name: t('sellerMock.hp9'), image: 'https://images.unsplash.com/photo-1581092335878-2d9ff86ca2bf?q=80&w=400&auto=format&fit=crop', link: '/pages/product-detail.html' },
  ];
}

// ─── C12: Contact Form Structure ────────────────────────
/** Default contact form configuration for storefront page. */
export function getContactFormConfig(): ContactFormData {
  return {
    title: t('sellerMock.contactTitle'),
    recipient: {
      name: '',
      title: '',
      department: '',
    },
    placeholder: t('sellerMock.contactPlaceholder'),
    maxLength: 8000,
    businessCardDefault: true,
  };
}

// ─── C13: Floating Actions Configuration ────────────────
/** Floating action buttons config for storefront page. */
export function getFloatingActionsConfig(): FloatingActionsData {
  return {
    buttons: [
      {
        id: 'contact',
        label: t('sellerMock.floatContact'),
        icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
        bgColor: 'bg-[#f97316]',
        hoverColor: 'hover:bg-primary-600',
        action: 'scroll-to-contact',
        ariaLabel: 'Contact Supplier',
      },
      {
        id: 'chat',
        label: t('sellerMock.floatChat'),
        icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>',
        bgColor: 'bg-primary-600',
        hoverColor: 'hover:bg-[#dc2626]',
        action: 'open-chat',
        ariaLabel: 'Chat Now',
      },
    ],
    topPosition: '40%',
  };
}
