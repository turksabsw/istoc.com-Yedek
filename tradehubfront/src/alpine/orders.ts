import Alpine from 'alpinejs'
import { t } from '../i18n'
import { orderStore } from '../components/orders/state/OrderStore'
import { getOrderTabs, getOrderFilters } from '../components/buyer-dashboard/ordersData'

export const ORDER_STATUS_MAP: Record<string, string[]> = {
  all: [],
  unpaid: ['Waiting for payment'],
  confirming: ['Confirming'],
  preparing: ['Confirming'],
  delivering: ['Delivering'],
  'refunds-aftersales': ['Cancelled'],
  'completed-review': ['Completed'],
  completed: ['Completed'],
  cancelled: ['Cancelled'],
  closed: ['Cancelled'],
};

Alpine.data('ordersListComponent', () => ({
  activeTab: 'all',
  searchQuery: '',
  dateFilter: 'all',
  dateFrom: '',
  dateTo: '',
  dateOpen: false,
  timeOpen: false,
  selectedOrder: null,
  copiedNumber: false,
  orders: [] as any[],

  init() {
    orderStore.load();
    this.orders = orderStore.getOrders();
    orderStore.subscribe(() => {
      this.orders = orderStore.getOrders();
    });
  },

  get filteredOrders() {
    return this.orders.filter((o: any) => {
      // Status filter
      const allowedStatuses = ORDER_STATUS_MAP[this.activeTab];
      const matchStatus = !allowedStatuses || allowedStatuses.length === 0 || allowedStatuses.includes(o.status);

      // Search filter
      const q = this.searchQuery.toLowerCase();
      const matchSearch = !q || o.orderNumber.toLowerCase().includes(q) || o.seller.toLowerCase().includes(q) || o.products.some((p: any) => p.name.toLowerCase().includes(q));

      // Date filter
      let matchDate = true;
      if (this.dateFilter !== 'all' && o.createdAt) {
        const orderTime = o.createdAt;
        const now = Date.now();
        if (this.dateFilter === '7d') {
          matchDate = now - orderTime <= 7 * 24 * 60 * 60 * 1000;
        } else if (this.dateFilter === '30d') {
          matchDate = now - orderTime <= 30 * 24 * 60 * 60 * 1000;
        } else if (this.dateFilter === '90d') {
          matchDate = now - orderTime <= 90 * 24 * 60 * 60 * 1000;
        } else if (this.dateFilter === 'custom') {
          if (this.dateFrom) matchDate = orderTime >= new Date(this.dateFrom).getTime();
          if (this.dateTo && matchDate) matchDate = orderTime <= new Date(this.dateTo).getTime() + 24 * 60 * 60 * 1000;
        }
      }

      return matchStatus && matchSearch && matchDate;
    });
  },

  tabCount(tabId: string) {
    const allowedStatuses = ORDER_STATUS_MAP[tabId];
    if (!allowedStatuses || allowedStatuses.length === 0) return this.orders.length;
    return this.orders.filter((o: any) => allowedStatuses.includes(o.status)).length;
  },

  viewDetail(order: any) {
    this.selectedOrder = order;
    window.scrollTo({ top: 0 });
  },

  backToList() {
    this.selectedOrder = null;
    this.copiedNumber = false;
  },

  get dateFilterLabel() {
    if (this.dateFilter === 'custom') return t('orders.customDate');
    if (this.dateFilter === '7d') return t('orders.last7Days');
    if (this.dateFilter === '30d') return t('orders.last30Days');
    if (this.dateFilter === '90d') return t('orders.last90Days');
    return t('orders.orderDate');
  },

  setDateFilter(val: string) {
    this.dateFilter = val;
    if (val !== 'custom') {
      this.dateFrom = '';
      this.dateTo = '';
    }
  },

  clearTimeRange() {
    this.dateFrom = '';
    this.dateTo = '';
    this.dateFilter = 'all';
    this.timeOpen = false;
  },

  applyTimeRange() {
    if (this.dateFrom || this.dateTo) {
      this.dateFilter = 'custom';
      this.timeOpen = false;
    }
  },

  copyOrderNumber() {
    if (!this.selectedOrder) return;
    navigator.clipboard.writeText((this.selectedOrder as any).orderNumber);
    this.copiedNumber = true;
    setTimeout(() => { this.copiedNumber = false; }, 2000);
  },

  // Modal states
  showOperationHistory: false,
  showPaymentHistory: false,
  showTrackPackage: false,
  showModifyShipping: false,
  showAddServices: false,
  showCancelOrder: false,
  paymentHistoryTab: 'records',
  cancelReason: '',
  cancellingOrder: null as any,

  openModal(name: string) {
    (this as any)[name] = true;
    document.body.style.overflow = 'hidden';
  },

  closeModal(name: string) {
    (this as any)[name] = false;
    document.body.style.overflow = '';
  },

  confirmCancelOrder() {
    const order = (this.cancellingOrder || this.selectedOrder) as any;
    if (!order || !this.cancelReason) return;
    orderStore.updateOrderStatus(order.orderNumber, 'Cancelled', 'text-red-600', 'Order cancelled by buyer.');
    this.cancelReason = '';
    this.cancellingOrder = null;
    this.closeModal('showCancelOrder');
    if (this.selectedOrder && (this.selectedOrder as any).orderNumber === order.orderNumber) {
      this.selectedOrder = null;
    }
  },

  getStepIndex(order: any) {
    if (!order) return -1;
    if (order.status === 'Waiting for payment') return 0;
    if (order.status === 'Delivering') return 2;
    if (order.status === 'Completed') return 4;
    return 1;
  }
}));

Alpine.data('ordersSection', () => ({
  activeTabId: getOrderTabs()[0].id,
  selectedFilterId: getOrderFilters()[0].id as string | null,
  dropdownOpen: false,

  selectTab(tabId: string, hasDropdown: boolean) {
    if (hasDropdown) {
      if (this.activeTabId === tabId) {
        this.dropdownOpen = !this.dropdownOpen;
        return;
      }
      this.activeTabId = tabId;
      this.dropdownOpen = true;
    } else {
      this.activeTabId = tabId;
      this.dropdownOpen = false;
    }
  },

  selectFilter(filterId: string) {
    this.selectedFilterId = filterId;
    this.dropdownOpen = false;
  },
}));
