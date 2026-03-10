/**
 * Tailored Selections Page — Entry Point
 * Assembles header, hero carousel, product grid, and footer for the
 * Tailored Selections landing page (opened from homepage "View more" link).
 */

import '../style.css'
import { initFlowbite } from 'flowbite'
import { t } from '../i18n'

// Header components
import { TopBar, initMobileDrawer, SubHeader, MegaMenu, initMegaMenu, initHeaderCart } from '../components/header'
import { initLanguageSelector } from '../components/header/TopBar'

// Shared components
import { Breadcrumb } from '../components/shared/Breadcrumb'

// Footer components
import { FooterLinks } from '../components/footer'

// Floating components
import { FloatingPanel } from '../components/floating'

// Alpine.js
import { startAlpine } from '../alpine'

// Tailored Selections components
import { TailoredSelectionsHero, initTailoredSelectionsHero, TailoredProductGrid } from '../components/tailored-selections'

// Data
import { getTailoredCategories, getTailoredProducts } from '../data/mockTailoredSelections'

// Utilities
import { initAnimatedPlaceholder } from '../utils/animatedPlaceholder'

/* ── Data ── */

const categories = getTailoredCategories();
const products = getTailoredProducts();

/* ── Breadcrumb ── */

const breadcrumbItems = [
    { label: t('tailoredPage.breadcrumbHome'), href: '/' },
    { label: t('tailoredPage.breadcrumb') },
];

/* ── Page Assembly ── */

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <!-- Header -->
  <div id="sticky-header" class="sticky top-0 z-[30]" style="background-color:var(--header-scroll-bg);border-bottom:1px solid var(--header-scroll-border)">
    ${TopBar()}
    ${SubHeader()}
  </div>

  ${MegaMenu()}

  <!-- Main Content -->
  <main>
    <!-- Hero Section with Category Carousel -->
    ${TailoredSelectionsHero(categories)}

    <!-- Breadcrumb -->
    <div class="container-boxed pt-4 pb-2" style="background: var(--products-bg, #f5f5f5);">
      ${Breadcrumb(breadcrumbItems)}
    </div>

    <!-- Product Grid -->
    ${TailoredProductGrid(products)}
  </main>

  <!-- Footer -->
  <footer>
    ${FooterLinks()}
  </footer>

  <!-- Floating Panel -->
  ${FloatingPanel()}
`;

/* ── Initialization ── */

initMegaMenu();
initFlowbite();
startAlpine();
initHeaderCart();
initMobileDrawer();
initLanguageSelector();
initTailoredSelectionsHero();
initAnimatedPlaceholder('#topbar-compact-search-input');
