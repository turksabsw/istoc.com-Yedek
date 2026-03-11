import { t } from '../../i18n';

interface TabCategory {
  label: string;
  key: string;
}

interface SubTabFilter {
  label: string;
  key: string;
}

function getTabCategories(): TabCategory[] {
  return [
    { label: t('mfr.allCategories'), key: '' },
    { label: t('mfr.cat.luggageBagsCases'), key: 'luggage_bags_cases' },
    { label: t('mfr.cat.sportswearOutdoor'), key: 'sportswear_outdoor' },
    { label: t('mfr.cat.personalElectronics'), key: 'personal_electronics' },
    { label: t('mfr.cat.jewelryEyewearWatches'), key: 'jewelry_eyewear_watches' },
    { label: t('mfr.cat.motherChildToys'), key: 'mother_child_toys' },
    { label: t('mfr.cat.shoesAccessories'), key: 'shoes_accessories' },
  ];
}

interface DropdownCategory {
  label: string;
  key: string;
}

function getAllCategories(): DropdownCategory[] {
  return [
    // Column 1
    { label: t('mfr.allCategories'), key: '' },
    { label: t('mfr.allCat.jewelryEyewearWatches'), key: 'jewelry_eyewear_watches' },
    { label: t('mfr.allCat.electricalEquipment'), key: 'electrical_equipment' },
    { label: t('mfr.allCat.foodBeverage'), key: 'food_beverage' },
    { label: t('mfr.allCat.chemicals'), key: 'chemicals' },
    { label: t('mfr.allCat.medicalDevices'), key: 'medical_devices' },
    { label: t('mfr.allCat.vehiclePartsAccessories'), key: 'vehicle_parts_accessories' },
    { label: t('mfr.allCat.cosmetics'), key: 'cosmetics' },
    { label: t('mfr.allCat.furniture'), key: 'furniture' },
    { label: t('mfr.allCat.materialHandling'), key: 'material_handling' },
    { label: t('mfr.allCat.personalCareHomeCleaning'), key: 'personal_care_home_cleaning' },
    // Column 2
    { label: t('mfr.allCat.luggageBagsCases'), key: 'luggage_bags_cases' },
    { label: t('mfr.allCat.motherChildToys'), key: 'mother_child_toys' },
    { label: t('mfr.allCat.packagingPrinting'), key: 'packaging_printing' },
    { label: t('mfr.allCat.clothingAccessories'), key: 'clothing_accessories' },
    { label: t('mfr.allCat.metalAlloys'), key: 'metal_alloys' },
    { label: t('mfr.allCat.sportsEntertainment'), key: 'sports_entertainment' },
    { label: t('mfr.allCat.lampsLighting'), key: 'lamps_lighting' },
    { label: t('mfr.allCat.rubberPlastics'), key: 'rubber_plastics' },
    { label: t('mfr.allCat.commercialEquipmentMachinery'), key: 'commercial_equipment_machinery' },
    { label: t('mfr.allCat.renewableEnergy'), key: 'renewable_energy' },
    { label: t('mfr.allCat.constructionBuildingMachinery'), key: 'construction_building_machinery' },
    // Column 3
    { label: t('mfr.allCat.sportswearOutdoor'), key: 'sportswear_outdoor' },
    { label: t('mfr.allCat.shoesAccessories'), key: 'shoes_accessories' },
    { label: t('mfr.allCat.homeGarden'), key: 'home_garden' },
    { label: t('mfr.allCat.fabricTextileRawMaterials'), key: 'fabric_textile_raw_materials' },
    { label: t('mfr.allCat.environment'), key: 'environment' },
    { label: t('mfr.allCat.schoolOfficeSupplies'), key: 'school_office_supplies' },
    { label: t('mfr.allCat.manufacturingServices'), key: 'manufacturing_services' },
    { label: t('mfr.allCat.electronicPartsTelecom'), key: 'electronic_parts_telecom' },
    { label: t('mfr.allCat.vehiclesTransportation'), key: 'vehicles_transportation' },
    { label: t('mfr.allCat.occupationalSafety'), key: 'occupational_safety' },
    { label: t('mfr.allCat.petProducts'), key: 'pet_products' },
    // Column 4
    { label: t('mfr.allCat.personalElectronics'), key: 'personal_electronics' },
    { label: t('mfr.allCat.giftsHobbies'), key: 'gifts_hobbies' },
    { label: t('mfr.allCat.agriculture'), key: 'agriculture' },
    { label: t('mfr.allCat.homeAppliances'), key: 'home_appliances' },
    { label: t('mfr.allCat.constructionRealEstate'), key: 'construction_real_estate' },
    { label: t('mfr.allCat.security'), key: 'security' },
    { label: t('mfr.allCat.industrialMachinery'), key: 'industrial_machinery' },
    { label: t('mfr.allCat.handToolsHardware'), key: 'hand_tools_hardware' },
    { label: t('mfr.allCat.powerTransmission'), key: 'power_transmission' },
    { label: t('mfr.allCat.testEquipment'), key: 'test_equipment' },
  ];
}

// Column header indices (first item of each column is bold)
const COLUMN_HEADERS = [0, 11, 22, 33];

function getSubTabFilters(): SubTabFilter[] {
  return [
    { label: t('mfr.filter.lowMoqCustomization'), key: 'low_moq' },
    { label: t('mfr.filter.sampleCustomization'), key: 'samples' },
    { label: t('mfr.filter.qualityCertified'), key: 'quality_control' },
    { label: t('mfr.filter.smallCustomization'), key: 'small_customization' },
  ];
}

function getSubTabMoreFilters(): SubTabFilter[] {
  return [
    { label: t('mfr.filter.lowMoqCustomization'), key: 'low_moq' },
    { label: t('mfr.filter.sampleCustomization'), key: 'samples' },
    { label: t('mfr.filter.qualityCertified'), key: 'quality_control' },
    { label: t('mfr.filter.smallCustomization'), key: 'small_customization' },
    { label: t('mfr.filter.fullCustomization'), key: 'full_customization' },
    { label: t('mfr.filter.highRdCapacity'), key: 'high_rd' },
    { label: t('mfr.filter.fortune500Collab'), key: 'fortune_500' },
  ];
}

export function HorizontalCategoryBar(): string {
  const TAB_CATEGORIES = getTabCategories();
  const ALL_CATEGORIES = getAllCategories();
  const SUB_TAB_FILTERS = getSubTabFilters();
  const SUB_TAB_MORE_FILTERS = getSubTabMoreFilters();

  return `
    <!-- Desktop layout (Category bar) -->
    <div class="hidden lg:block relative bg-white rounded-md mb-8" data-factory-tab-wrapper>

      <!-- Tab Bar -->
      <div class="flex items-center h-[62px] border-b border-[#d8d8d8]">
        <ul class="flex items-center h-full overflow-hidden flex-1 list-none m-0 p-0" data-factory-tab>
          ${TAB_CATEGORIES.map((cat, i) => `
            <li class="whitespace-nowrap cursor-pointer px-5 h-[61px] leading-[61px] text-base transition-colors
                       ${i === 0 ? 'factory-tab-active font-bold text-[#222]' : 'font-normal text-[#222] hover:text-[#666]'}"
                data-tab-index="${i}" data-category-key="${cat.key}">
              ${cat.label}
            </li>
          `).join('')}
        </ul>

        <!-- View more button -->
        <div class="flex-shrink-0 flex items-center h-full px-2">
          <button id="hm-view-more" type="button"
                  class="flex items-center gap-2 px-4 py-2 rounded-full border border-[#d8d8d8] text-sm font-medium text-[#222] hover:border-[#999] transition-colors whitespace-nowrap">
            <span>${t('mfr.viewMore')}</span>
            <svg class="w-3.5 h-3.5 transition-transform duration-200" id="hm-view-more-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- More Content Dropdown (absolutely positioned below tab bar) -->
      <div id="hm-mega-menu" class="hidden absolute left-0 right-0 top-[62px] z-50 bg-white rounded-b-lg py-8 px-5" style="box-shadow: rgba(0,0,0,0.12) 0 8px 20px 0">
        <ul class="grid grid-cols-4 grid-flow-col max-h-[400px] overflow-y-auto list-none m-0 p-0" style="grid-template-rows: repeat(11, auto);">
          ${ALL_CATEGORIES.map((cat, i) => {
    const isHeader = COLUMN_HEADERS.includes(i);
    return `
              <li class="mb-3 pr-4 ${isHeader ? 'font-bold' : 'font-normal'} text-[#222]"
                  style="font-size: 14px; line-height: 21px;"
                  data-dropdown-cat="${cat.label}"
                  data-dropdown-key="${cat.key}"
                  ${isHeader ? 'data-column-header' : ''}>
                <a href="#" class="hover:text-primary-600 transition-colors">${cat.label}</a>
              </li>
            `;
  }).join('')}
        </ul>
      </div>

      <!-- Sub Tab Filter Chips -->
      <ul class="flex items-center h-[48px] px-5 list-none m-0 p-0 overflow-x-auto" data-factory-sub-tab>
        ${SUB_TAB_FILTERS.map(filter => `
          <li class="flex-shrink-0 flex items-center h-8 mr-3 mt-0 px-4 border border-[#767676] rounded-full text-xs text-[#222] text-center cursor-pointer whitespace-nowrap hover:border-[#222] hover:font-medium transition-colors"
              data-filter-key="${filter.key}">
            ${filter.label}
          </li>
        `).join('')}
        <!-- Sub-tab view more -->
        <li id="sub-tab-more-btn" class="ml-auto flex-shrink-0 flex items-center gap-1 h-8 px-4 border border-[#d8d8d8] rounded-full text-xs text-[#222] text-center cursor-pointer whitespace-nowrap hover:border-[#999] transition-colors">
          ${t('mfr.viewMore')}
          <svg class="w-3 h-3 transition-transform duration-200" id="sub-tab-more-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </li>
      </ul>

      <!-- Sub-tab More Dropdown -->
      <div id="sub-tab-dropdown" class="hidden absolute left-0 right-0 top-[110px] z-50 bg-white rounded-b-lg py-6 px-5" style="box-shadow: rgba(0,0,0,0.12) 0 8px 20px 0">
        <ul class="flex flex-wrap list-none m-0 p-0">
          ${SUB_TAB_MORE_FILTERS.map(filter => `
            <li class="w-1/4 mb-3 pr-4 text-sm text-[#222] cursor-pointer hover:text-primary-600 transition-colors"
                data-filter-key="${filter.key}">
              ${filter.label}
            </li>
          `).join('')}
        </ul>
      </div>

    </div>

    <!-- Mobile layout (Filter bar) -->
    <div class="lg:hidden flex items-center overflow-x-auto gap-2.5 pb-2 mb-1 no-scrollbar scroll-smooth">
      <button class="flex items-center justify-center w-[30px] h-[30px] border border-gray-300 rounded-full shrink-0 bg-white">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" class="w-4 h-4 text-[#222]">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 0H3.75m12 12h3.75m-3.75 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 0H3.75m9.75-6h3.75m-3.75 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 0H3.75" />
        </svg>
      </button>
      <button class="px-3.5 h-[30px] border border-gray-300 rounded-full text-[12px] font-medium whitespace-nowrap text-[#222] hover:bg-gray-50 flex items-center shrink-0">
        ${t('mfr.verifiedManufacturers')}
      </button>
    </div>
  `;
}

export function initHorizontalCategoryBar(): void {
  const btn = document.getElementById('hm-view-more');
  const menu = document.getElementById('hm-mega-menu');
  const icon = document.getElementById('hm-view-more-icon');
  const tabUl = document.querySelector<HTMLElement>('[data-factory-tab]');

  const subBtn = document.getElementById('sub-tab-more-btn');
  const subIcon = document.getElementById('sub-tab-more-icon');
  const subDropdown = document.getElementById('sub-tab-dropdown');

  if (!btn || !menu || !tabUl) return;

  function closeMain() {
    if (menu) menu.classList.add('hidden');
    if (icon) icon.style.transform = 'rotate(0deg)';
  }

  function closeSub() {
    if (subDropdown) subDropdown.classList.add('hidden');
    if (subIcon) subIcon.style.transform = 'rotate(0deg)';
  }

  // Main "View more" toggle -- close sub when opening
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = menu.classList.contains('hidden');
    if (isHidden) {
      closeSub();
      menu.classList.remove('hidden');
      if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
      closeMain();
    }
  });

  // Sub-tab "View more" toggle -- close main when opening
  if (subBtn && subDropdown) {
    subBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = subDropdown.classList.contains('hidden');
      if (isHidden) {
        closeMain();
        subDropdown.classList.remove('hidden');
        if (subIcon) subIcon.style.transform = 'rotate(180deg)';
      } else {
        closeSub();
      }
    });
  }

  // Close all on outside click
  document.addEventListener('click', (e) => {
    const target = e.target as Node;
    if (!menu.contains(target) && !btn.contains(target)) closeMain();
    if (subDropdown && subBtn && !subDropdown.contains(target) && !subBtn.contains(target)) closeSub();
  });

  // Tab switching + dropdown active sync + category-change event dispatch
  const tabs = Array.from(tabUl.querySelectorAll<HTMLElement>('[data-tab-index]'));
  const dropdownItems = menu.querySelectorAll<HTMLElement>('[data-dropdown-cat]');

  function syncDropdownActive(activeTabName: string) {
    dropdownItems.forEach(item => {
      const isHeader = item.hasAttribute('data-column-header');
      const isActive = item.dataset.dropdownCat === activeTabName;
      if (isHeader || isActive) {
        item.classList.add('font-bold');
        item.classList.remove('font-normal');
      } else {
        item.classList.remove('font-bold');
        item.classList.add('font-normal');
      }
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('factory-tab-active', 'font-bold');
        t.classList.add('font-normal');
      });
      tab.classList.add('factory-tab-active', 'font-bold');
      tab.classList.remove('font-normal');

      const idx = parseInt(tab.dataset.tabIndex || '0');
      const categoryKey = tab.dataset.categoryKey || '';
      const TAB_CATEGORIES = getTabCategories();
      syncDropdownActive(TAB_CATEGORIES[idx].label);

      // Dispatch category change event
      document.dispatchEvent(new CustomEvent('mfr:category-change', {
        detail: { category: categoryKey },
      }));
    });
  });

  // Dropdown category click → dispatch category change with machine key + close menu
  dropdownItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const categoryKey = item.dataset.dropdownKey || '';
      closeMain();

      // Dispatch category change with the machine-readable key (not display label)
      document.dispatchEvent(new CustomEvent('mfr:category-change', {
        detail: { category: categoryKey },
      }));
    });
  });

  // Filter chip toggle + filter-change event dispatch
  const filterChips = document.querySelectorAll<HTMLElement>('[data-factory-sub-tab] [data-filter-key]');
  const dropdownFilterChips = subDropdown
    ? subDropdown.querySelectorAll<HTMLElement>('[data-filter-key]')
    : [];

  const activeFilters = new Set<string>();

  function dispatchFilterChange() {
    document.dispatchEvent(new CustomEvent('mfr:filter-change', {
      detail: { filters: Array.from(activeFilters).join(',') },
    }));
  }

  function toggleFilter(chip: HTMLElement) {
    const key = chip.dataset.filterKey || '';
    if (!key) return;

    if (activeFilters.has(key)) {
      activeFilters.delete(key);
      chip.classList.remove('bg-[#222]', 'text-white', 'border-[#222]');
      chip.classList.add('border-[#767676]', 'text-[#222]');
    } else {
      activeFilters.add(key);
      chip.classList.add('bg-[#222]', 'text-white', 'border-[#222]');
      chip.classList.remove('border-[#767676]', 'text-[#222]');
    }

    // Sync toggle state across main and dropdown filter chips
    syncFilterChipState(key);
    dispatchFilterChange();
  }

  function syncFilterChipState(key: string) {
    const isActive = activeFilters.has(key);
    const allChips = [
      ...Array.from(filterChips),
      ...Array.from(dropdownFilterChips),
    ];
    allChips.forEach(c => {
      if (c.dataset.filterKey === key) {
        if (isActive) {
          c.classList.add('bg-[#222]', 'text-white', 'border-[#222]');
          c.classList.remove('border-[#767676]', 'text-[#222]');
        } else {
          c.classList.remove('bg-[#222]', 'text-white', 'border-[#222]');
          c.classList.add('border-[#767676]', 'text-[#222]');
        }
      }
    });
  }

  filterChips.forEach(chip => {
    chip.addEventListener('click', () => toggleFilter(chip));
  });

  dropdownFilterChips.forEach(chip => {
    chip.addEventListener('click', () => toggleFilter(chip));
  });
}
