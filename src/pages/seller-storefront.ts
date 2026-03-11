/**
 * Seller Storefront — Page Orchestrator
 * Imports all components, renders into #app, initializes interactions
 */
import '../style.css';
import '../styles/seller/seller-storefront.css';
import { initFlowbite } from 'flowbite';
import 'swiper/swiper-bundle.css';
import { startAlpine } from '../alpine';

// Components
import { TopBar } from '../components/header';
import { initLanguageSelector } from '../components/header/TopBar'
import {
  StoreHeader,
  StoreNav,
} from '../components/seller';

import { CompanyProfileComponent } from '../components/seller/CompanyProfile';

// Mock Data
import { getSellerData, getSellerStats, getSellerReviews } from '../data/seller/mockData';
const sellerData = getSellerData();
const sellerStats = getSellerStats();
const sellerReviews = getSellerReviews();

// Interactions
import { initSellerStorefront } from '../utils/seller/interactions';

// ─── Render ─────────────────────────────────────────────
const appEl = document.querySelector<HTMLDivElement>('#app')!;

appEl.innerHTML = `
  <!-- MAIN PLATFORM HEADER -->
  ${TopBar()}

  <main class="seller-storefront flex flex-col min-h-screen" data-seller-slug="${sellerData.seller.slug}" x-data="sellerStorefront">
    ${StoreHeader(sellerData.seller)}
    ${StoreNav(sellerData.navData)}

    <!-- PROFILE VIEW -->
    ${CompanyProfileComponent(
  sellerData,
  sellerStats,
  sellerReviews
)}

  </main>

  <!-- SITE FOOTER PLACEHOLDER -->
`;

// ─── Initialize ─────────────────────────────────────────
initFlowbite();
initLanguageSelector();
initSellerStorefront();

// Start Alpine.js (must be called AFTER innerHTML is set)
startAlpine();
