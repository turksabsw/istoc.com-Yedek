import '../style.css'
import { initFlowbite } from 'flowbite'
import { t } from '../i18n'

// Header components
import { TopBar, MobileSearchTabs, initMobileDrawer, initStickyHeaderSearch, MegaMenu, initMegaMenu, PromoBanner, initPromoBanner, initTopBarAuth } from '../components/header'
import { initLanguageSelector } from '../components/header/TopBar'

// Shared components
import { Breadcrumb } from '../components/shared/Breadcrumb'

// Footer components
import { FooterLinks } from '../components/footer'

// Floating components
import { FloatingPanel } from '../components/floating'

// Alpine.js
import { startAlpine } from '../alpine'

// Utilities
import { initAnimatedPlaceholder } from '../utils/animatedPlaceholder'

// API
import { loadManufacturers } from '../utils/api'
import type { ManufacturersParams, ManufacturersResponse } from '../utils/api'

// Manufacturers components (imported individually for dynamic rendering)
import { ManufacturersHero, initCategoryFlyout, initProfilePanel } from '../components/manufacturers/ManufacturersHero'
import { HorizontalCategoryBar, initHorizontalCategoryBar } from '../components/manufacturers/HorizontalCategoryBar'
import { ManufacturerList, initFactorySliders } from '../components/manufacturers/ManufacturerList'

// ─── Sort Options Configuration ────────────────────────────
const SORT_OPTIONS: { label: string; value: string }[] = [
  { label: t('mfr.sort.popular'), value: 'popular' },
  { label: t('mfr.sort.bestSeller'), value: 'best_seller' },
  { label: t('mfr.sort.leader'), value: 'leader' },
  { label: t('mfr.sort.fastResponse'), value: 'fast_response' },
];

// ─── Page State ────────────────────────────────────────────
const currentParams: ManufacturersParams = {
  sort_by: 'popular',
  page: 1,
  page_size: 10,
};

// ─── Sort Bar HTML ─────────────────────────────────────────
function SortBar(): string {
  return `
    <div id="mfr-sort-bar" class="flex items-center justify-between mb-4 px-1">
      <span id="mfr-result-count" class="text-sm text-gray-500"></span>
      <div class="flex items-center gap-2">
        <label for="mfr-sort-select" class="text-sm text-[#222] font-medium">${t('mfr.sort.label')}:</label>
        <select id="mfr-sort-select"
                class="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white text-[#222] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer">
          ${SORT_OPTIONS.map(opt => `
            <option value="${opt.value}" ${opt.value === 'popular' ? 'selected' : ''}>${opt.label}</option>
          `).join('')}
        </select>
      </div>
    </div>
  `;
}

// ─── Loading Spinner HTML ──────────────────────────────────
function LoadingSpinner(): string {
  return `
    <div id="mfr-loading" class="hidden flex flex-col items-center justify-center py-16">
      <div class="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#222] mb-4"></div>
      <p class="text-sm text-gray-500">${t('mfr.loadingText')}</p>
    </div>
  `;
}

// ─── Error State HTML ──────────────────────────────────────
function ErrorState(): string {
  return `
    <div id="mfr-error" class="hidden flex flex-col items-center justify-center py-16">
      <svg class="w-12 h-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      <p id="mfr-error-msg" class="text-gray-500 text-sm mb-4">${t('mfr.errorText')}</p>
      <button id="mfr-retry-btn" type="button"
              class="px-4 py-2 border border-[#222] rounded-full text-sm font-medium text-[#222] hover:bg-gray-50 transition-colors">
        ${t('mfr.retry')}
      </button>
    </div>
  `;
}

// ─── Pagination HTML (dynamic, re-rendered after each fetch)
function PaginationControls(response: ManufacturersResponse): string {
  const { page, page_size, total } = response;
  const totalPages = Math.ceil(total / page_size);

  if (totalPages <= 1) return '';

  const from = (page - 1) * page_size + 1;
  const to = Math.min(page * page_size, total);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  // Build page number buttons (show max 5 pages centered on current)
  const pageNumbers: (number | string)[] = [];
  const maxVisible = 5;
  let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    pageNumbers.push(1);
    if (startPage > 2) pageNumbers.push('...');
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) pageNumbers.push('...');
    pageNumbers.push(totalPages);
  }

  return `
    <nav id="mfr-pagination" class="flex flex-col sm:flex-row items-center justify-between gap-4 py-8" aria-label="Pagination">
      <span class="text-sm text-gray-500">
        ${t('mfr.pagination.showing', { from, to, total })}
      </span>
      <div class="flex items-center gap-1">
        <!-- Previous Button -->
        <button type="button" data-page-action="prev"
                class="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition-colors
                       ${hasPrev ? 'border-gray-300 text-[#222] hover:bg-gray-50 cursor-pointer' : 'border-gray-200 text-gray-300 cursor-not-allowed'}"
                ${hasPrev ? '' : 'disabled'}>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          ${t('mfr.pagination.prev')}
        </button>

        <!-- Page Numbers -->
        ${pageNumbers.map(p => {
    if (p === '...') {
      return `<span class="px-2 py-1.5 text-sm text-gray-400">...</span>`;
    }
    const isActive = p === page;
    return `
            <button type="button" data-page-number="${p}"
                    class="min-w-[36px] px-2 py-1.5 text-sm rounded-lg border transition-colors
                           ${isActive
      ? 'bg-[#222] text-white border-[#222]'
      : 'border-gray-300 text-[#222] hover:bg-gray-50 cursor-pointer'}">
              ${p}
            </button>`;
  }).join('')}

        <!-- Next Button -->
        <button type="button" data-page-action="next"
                class="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition-colors
                       ${hasNext ? 'border-gray-300 text-[#222] hover:bg-gray-50 cursor-pointer' : 'border-gray-200 text-gray-300 cursor-not-allowed'}"
                ${hasNext ? '' : 'disabled'}>
          ${t('mfr.pagination.next')}
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </nav>
  `;
}

// ─── DOM Helpers ────────────────────────────────────────────
function showLoading(): void {
  const loading = document.getElementById('mfr-loading');
  const listContainer = document.getElementById('mfr-list-container');
  const error = document.getElementById('mfr-error');
  const pagination = document.getElementById('mfr-pagination-wrapper');

  if (loading) loading.classList.remove('hidden');
  if (listContainer) listContainer.classList.add('hidden');
  if (error) error.classList.add('hidden');
  if (pagination) pagination.innerHTML = '';
}

function hideLoading(): void {
  const loading = document.getElementById('mfr-loading');
  const listContainer = document.getElementById('mfr-list-container');

  if (loading) loading.classList.add('hidden');
  if (listContainer) listContainer.classList.remove('hidden');
}

function showError(message?: string): void {
  const loading = document.getElementById('mfr-loading');
  const listContainer = document.getElementById('mfr-list-container');
  const error = document.getElementById('mfr-error');
  const errorMsg = document.getElementById('mfr-error-msg');
  const pagination = document.getElementById('mfr-pagination-wrapper');

  if (loading) loading.classList.add('hidden');
  if (listContainer) listContainer.classList.add('hidden');
  if (error) error.classList.remove('hidden');
  if (errorMsg && message) errorMsg.textContent = message;
  if (pagination) pagination.innerHTML = '';
}

function updateResultCount(total: number): void {
  const el = document.getElementById('mfr-result-count');
  if (el) el.textContent = t('mfr.resultsCount', { count: total });
}

// ─── Render Manufacturer List ──────────────────────────────
function renderList(response: ManufacturersResponse): void {
  const container = document.getElementById('mfr-list-container');
  if (!container) return;

  container.innerHTML = ManufacturerList(response.data);
  initFactorySliders();
}

// ─── Render Pagination ─────────────────────────────────────
function renderPagination(response: ManufacturersResponse): void {
  const wrapper = document.getElementById('mfr-pagination-wrapper');
  if (!wrapper) return;

  wrapper.innerHTML = PaginationControls(response);
  wirePaginationEvents();
}

// ─── Wire Pagination Click Events ──────────────────────────
function wirePaginationEvents(): void {
  const wrapper = document.getElementById('mfr-pagination-wrapper');
  if (!wrapper) return;

  // Previous/Next buttons
  wrapper.querySelectorAll<HTMLButtonElement>('[data-page-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const action = btn.dataset.pageAction;
      if (action === 'prev' && currentParams.page && currentParams.page > 1) {
        currentParams.page--;
        fetchManufacturers();
      } else if (action === 'next') {
        currentParams.page = (currentParams.page || 1) + 1;
        fetchManufacturers();
      }
    });
  });

  // Page number buttons
  wrapper.querySelectorAll<HTMLButtonElement>('[data-page-number]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pageNum = parseInt(btn.dataset.pageNumber || '1');
      if (pageNum !== currentParams.page) {
        currentParams.page = pageNum;
        fetchManufacturers();
      }
    });
  });
}

// ─── Fetch Manufacturers from API ──────────────────────────
async function fetchManufacturers(): Promise<void> {
  showLoading();

  try {
    const response = await loadManufacturers(currentParams);
    hideLoading();
    updateResultCount(response.total);
    renderList(response);
    renderPagination(response);

    // Scroll to top of list on page change (not on initial load)
    if (currentParams.page && currentParams.page > 1) {
      const sortBar = document.getElementById('mfr-sort-bar');
      if (sortBar) {
        sortBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  } catch {
    showError(t('mfr.errorText'));
  }
}

// ─── Wire Sort Selector ────────────────────────────────────
function wireSortSelector(): void {
  const select = document.getElementById('mfr-sort-select') as HTMLSelectElement | null;
  if (!select) return;

  select.addEventListener('change', () => {
    currentParams.sort_by = select.value;
    currentParams.page = 1;
    fetchManufacturers();
  });
}

// ─── Wire Category Change Events ───────────────────────────
function wireCategoryEvents(): void {
  document.addEventListener('mfr:category-change', ((e: CustomEvent) => {
    const { category } = e.detail;
    currentParams.category = category || undefined;
    currentParams.page = 1;
    fetchManufacturers();
  }) as EventListener);
}

// ─── Wire Filter Change Events ─────────────────────────────
function wireFilterEvents(): void {
  document.addEventListener('mfr:filter-change', ((e: CustomEvent) => {
    const { filters } = e.detail;
    currentParams.filters = filters || undefined;
    currentParams.page = 1;
    fetchManufacturers();
  }) as EventListener);
}

// ─── Wire Retry Button ─────────────────────────────────────
function wireRetryButton(): void {
  const retryBtn = document.getElementById('mfr-retry-btn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => fetchManufacturers());
  }
}

// ─── Render Page ───────────────────────────────────────────
const appEl = document.querySelector<HTMLDivElement>('#app')!;
appEl.classList.add('relative');

appEl.innerHTML = `
  <!-- Promo Banner -->
  ${PromoBanner()}

  <!-- Sticky Header (global, stays sticky across full page) -->
  <div id="sticky-header" class="sticky top-0 z-(--z-header) transition-colors duration-200" style="background-color:var(--header-scroll-bg);border-bottom:1px solid var(--header-scroll-border)">
    ${TopBar()}
  </div>

  <!-- Mobile Search Tabs (Products | Manufacturers) — non-sticky -->
  ${MobileSearchTabs('manufacturers')}

  <!-- Mega Menu (fixed overlay, positioned by JS) -->
  ${MegaMenu()}

  <!-- Main Content -->
  <main class="flex-1 min-w-0 bg-[#f0f2f5] dark:bg-gray-900 pb-12">
    <div class="container-boxed">
      ${Breadcrumb([{ label: t('search.manufacturers') }])}
    </div>
    <div class="container-boxed pt-4">
      <!-- 1) Top Hero Section -->
      ${ManufacturersHero()}

      <!-- 2) Horizontal Category Bar -->
      ${HorizontalCategoryBar()}

      <!-- 3) Sort Bar -->
      ${SortBar()}

      <!-- 4) Loading Spinner -->
      ${LoadingSpinner()}

      <!-- 5) Error State -->
      ${ErrorState()}

      <!-- 6) Manufacturer List Container -->
      <div id="mfr-list-container">
        ${ManufacturerList([])}
      </div>

      <!-- 7) Pagination Wrapper -->
      <div id="mfr-pagination-wrapper"></div>
    </div>
  </main>

  <!-- Footer Section -->
  <footer class="mt-auto">
    ${FooterLinks()}
  </footer>

  <!-- Floating Panel -->
  ${FloatingPanel()}
`

// ─── Initialize Components ─────────────────────────────────

// Initialize promo banner
initPromoBanner();

// Initialize custom component behaviors FIRST (before Flowbite can interfere)
initMegaMenu();

// Initialize Flowbite for other interactive components
initFlowbite();

// Initialize Alpine.js (FloatingPanel is now Alpine-driven)
startAlpine();

// Initialize remaining custom behaviors
initStickyHeaderSearch();
initMobileDrawer();
initLanguageSelector();
initTopBarAuth().then(() => initProfilePanel());
initAnimatedPlaceholder('#topbar-compact-search-input');

// Initialize Manufacturers specific behaviors
initHorizontalCategoryBar();
initCategoryFlyout();

// ─── Wire API Integration ──────────────────────────────────
wireSortSelector();
wireCategoryEvents();
wireFilterEvents();
wireRetryButton();

// Load initial data
fetchManufacturers();
