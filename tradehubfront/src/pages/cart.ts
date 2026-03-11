/**
 * Cart Page — Entry Point
 * Assembles header, cart content, and footer.
 */

import '../style.css'
import { initFlowbite } from 'flowbite'
import { initStickyHeights } from '../utils/stickyHeights'

// Header components (reuse from main page)
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

// Cart components
import { CartPage, initCartPage } from '../components/cart/page/CartPage'
import { cartStore } from '../components/cart/state/CartStore'
import { getMockCartSuppliers, getMockCartSummary, getMockAssuranceItems } from '../data/mockCart'
const mockCartSuppliers = getMockCartSuppliers();
const mockCartSummary = getMockCartSummary();
const mockAssuranceItems = getMockAssuranceItems();

// localStorage'dan sepet verisini yükle, yoksa mock verisini kullan
if (!cartStore.load()) {
  cartStore.init(mockCartSuppliers, mockCartSummary.shippingFee, mockCartSummary.currency, mockCartSummary.discount);
}
const cartSuppliers = cartStore.getSuppliers();
const cartSummary = cartStore.getSummary();

const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');
appEl.innerHTML = `
  <!-- Header -->
  <div id="sticky-header" class="relative bg-white border-b border-[#e5e5e5] w-full z-40">
    <div class="relative z-50 bg-white">
      ${TopBar()}
      ${SubHeader()}
    </div>
  </div>

  ${MegaMenu()}

  <!-- Main Content -->
  <main class="min-h-screen bg-surface relative z-10 pt-4 flex flex-col">
    <div class="container-boxed">
      ${Breadcrumb([{ label: 'Sepetim' }])}
    </div>

    <!-- Client-side Cart Container -->
    ${CartPage({
  suppliers: cartSuppliers,
  summary: cartSummary,
  assuranceItems: mockAssuranceItems
})}
  </main>

  <!-- Footer -->
  <footer class="relative z-10 mt-12 border-t border-border-default pt-12 pb-8 bg-white">
    <div class="container-boxed">
      ${FooterLinks()}
    </div>
  </footer>

  <!-- Floating Panel -->
  ${FloatingPanel()}
`;

// Initialize all behaviors
initMegaMenu();
initFlowbite();
initMobileDrawer();
initLanguageSelector();

// Initialize cart page logic (store zaten load() ile yüklendi)
initCartPage();

// Header cart init'i store doldurulduktan SONRA gelsin ki badge güncellensin
initHeaderCart();
initStickyHeights();

// Start Alpine LAST — after innerHTML is set so it can find all x-data directives in the DOM
startAlpine();
