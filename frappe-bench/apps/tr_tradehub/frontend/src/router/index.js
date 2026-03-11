import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Layout — YENİ KONUM
import AppLayout from '@/layouts/AppLayout.vue'

// Views (lazy-loaded)
const LoginView = () => import('@/views/auth/LoginView.vue')
const ProductAddView = () => import('@/views/products/ProductAddView.vue')
const DocTypeListView = () => import('@/views/doctype/DocTypeListView.vue')

// Dashboard Module Pages (lazy-loaded)
const PlatformOverview = () => import('@/views/dashboard/PlatformOverview.vue')
const OrdersDashboard = () => import('@/views/dashboard/OrdersDashboard.vue')
const PaymentsDashboard = () => import('@/views/dashboard/PaymentsDashboard.vue')
const SellersDashboard = () => import('@/views/dashboard/SellersDashboard.vue')
const CatalogDashboard = () => import('@/views/dashboard/CatalogDashboard.vue')
const LogisticsDashboard = () => import('@/views/dashboard/LogisticsDashboard.vue')
const MarketingDashboard = () => import('@/views/dashboard/MarketingDashboard.vue')
const ComplianceDashboard = () => import('@/views/dashboard/ComplianceDashboard.vue')

// Seller Module Pages (lazy-loaded)
const SellerScoreList = () => import('@/views/seller/SellerScoreList.vue')
const SellerScoreDetail = () => import('@/views/seller/SellerScoreDetail.vue')
const SellerKpiList = () => import('@/views/seller/SellerKpiList.vue')
const SellerKpiDetail = () => import('@/views/seller/SellerKpiDetail.vue')
const SellerMetricsList = () => import('@/views/seller/SellerMetricsList.vue')
const SellerMetricsDetail = () => import('@/views/seller/SellerMetricsDetail.vue')
const KpiTemplateList = () => import('@/views/seller/KpiTemplateList.vue')
const KpiTemplateDetail = () => import('@/views/seller/KpiTemplateDetail.vue')

// Sales Module Pages (lazy-loaded)
const RfqList = () => import('@/views/sales/RfqList.vue')
const RfqDetail = () => import('@/views/sales/RfqDetail.vue')

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { guest: true },
  },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: PlatformOverview,
        meta: { title: 'Genel Bakış', breadcrumb: 'Genel Bakış', section: 'dashboard' },
      },
      {
        path: 'dashboard/orders',
        name: 'OrdersDashboard',
        component: OrdersDashboard,
        meta: { title: 'Sipariş Dashboard', breadcrumb: 'Siparişler', section: 'sales' },
      },
      {
        path: 'dashboard/payments',
        name: 'PaymentsDashboard',
        component: PaymentsDashboard,
        meta: { title: 'Ödeme Dashboard', breadcrumb: 'Ödemeler', section: 'finance' },
      },
      {
        path: 'dashboard/sellers',
        name: 'SellersDashboard',
        component: SellersDashboard,
        meta: { title: 'Satıcı Dashboard', breadcrumb: 'Satıcılar', section: 'customers' },
      },
      {
        path: 'dashboard/catalog',
        name: 'CatalogDashboard',
        component: CatalogDashboard,
        meta: { title: 'Katalog Dashboard', breadcrumb: 'Katalog', section: 'products' },
      },
      {
        path: 'dashboard/logistics',
        name: 'LogisticsDashboard',
        component: LogisticsDashboard,
        meta: { title: 'Lojistik Dashboard', breadcrumb: 'Lojistik', section: 'logistics' },
      },
      {
        path: 'dashboard/marketing',
        name: 'MarketingDashboard',
        component: MarketingDashboard,
        meta: { title: 'Pazarlama Dashboard', breadcrumb: 'Pazarlama', section: 'marketing' },
      },
      {
        path: 'dashboard/compliance',
        name: 'ComplianceDashboard',
        component: ComplianceDashboard,
        meta: { title: 'Uyumluluk Dashboard', breadcrumb: 'Uyumluluk', section: 'settings' },
      },
      {
        path: 'app/seller-score-list',
        name: 'SellerScoreList',
        component: SellerScoreList,
        meta: { title: 'Satıcı Puanı', breadcrumb: 'Satıcı Puanı', section: 'dashboard' },
      },
      {
        path: 'app/seller-score/:name',
        name: 'SellerScoreDetail',
        component: SellerScoreDetail,
        meta: { title: 'Satıcı Puanı Detay', breadcrumb: 'Detay', section: 'dashboard', breadcrumbParent: 'Satıcı Puanı', breadcrumbParentRoute: '/app/seller-score-list' },
      },
      {
        path: 'app/seller-kpi-list',
        name: 'SellerKpiList',
        component: SellerKpiList,
        meta: { title: 'Satıcı KPI Listesi', breadcrumb: 'Satıcı KPI', section: 'dashboard' },
      },
      {
        path: 'app/seller-kpi/:name',
        name: 'SellerKpiDetail',
        component: SellerKpiDetail,
        meta: { title: 'Satıcı KPI Detay', breadcrumb: 'Detay', section: 'dashboard', breadcrumbParent: 'Satıcı KPI', breadcrumbParentRoute: '/app/seller-kpi-list' },
      },
      {
        path: 'app/seller-metrics-list',
        name: 'SellerMetricsList',
        component: SellerMetricsList,
        meta: { title: 'Satıcı Metrikleri', breadcrumb: 'Satıcı Metrikleri', section: 'dashboard' },
      },
      {
        path: 'app/seller-metrics/:name',
        name: 'SellerMetricsDetail',
        component: SellerMetricsDetail,
        meta: { title: 'Satıcı Metrik Detay', breadcrumb: 'Detay', section: 'dashboard', breadcrumbParent: 'Satıcı Metrikleri', breadcrumbParentRoute: '/app/seller-metrics-list' },
      },
      {
        path: 'app/kpi-template-list',
        name: 'KpiTemplateList',
        component: KpiTemplateList,
        meta: { title: 'KPI Şablonları', breadcrumb: 'KPI Şablonları', section: 'dashboard' },
      },
      {
        path: 'app/kpi-template/:name',
        name: 'KpiTemplateDetail',
        component: KpiTemplateDetail,
        meta: { title: 'KPI Şablon Detay', breadcrumb: 'Detay', section: 'dashboard', breadcrumbParent: 'KPI Şablonları', breadcrumbParentRoute: '/app/kpi-template-list' },
      },
      {
        path: 'app/rfq-list',
        name: 'RfqList',
        component: RfqList,
        meta: { title: 'RFQ Listesi', breadcrumb: 'RFQ', section: 'sales' },
      },
      {
        path: 'app/rfq/:name',
        name: 'RfqDetail',
        component: RfqDetail,
        meta: { title: 'RFQ Detay', breadcrumb: 'Detay', section: 'sales', breadcrumbParent: 'RFQ', breadcrumbParentRoute: '/app/rfq-list' },
      },
      {
        path: 'app/product-add',
        name: 'ProductAdd',
        component: ProductAddView,
        meta: { title: 'Yeni Ürün Ekle', breadcrumb: 'Yeni Ürün Ekle', section: 'products' },
      },
      {
        path: 'app/:doctype',
        name: 'DocTypeList',
        component: DocTypeListView,
        meta: { title: 'Liste', breadcrumb: 'Liste', section: 'settings' },
      },
      {
        path: 'app/:doctype/:name',
        name: 'DocTypeForm',
        component: () => import('@/views/doctype/DocTypeFormView.vue'),
        meta: { title: 'Detay', breadcrumb: 'Detay', section: 'settings' },
      },
      {
        path: 'app/report/:report',
        name: 'ReportView',
        component: DocTypeListView,
        meta: { title: 'Rapor', breadcrumb: 'Rapor', section: 'analytics' },
      },
      {
        path: 'messaging/:tab?',
        name: 'Messaging',
        component: PlatformOverview,
        meta: { title: 'Mesajlar', breadcrumb: 'Mesajlar', section: 'messaging' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  if (!auth.isAuthenticated && !to.meta.guest) {
    try { await auth.fetchUser() } catch { }
  }
  if (!to.meta.guest && !auth.isAuthenticated) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }
  if (to.meta.guest && auth.isAuthenticated) {
    return next('/dashboard')
  }
  next()
})

export default router
