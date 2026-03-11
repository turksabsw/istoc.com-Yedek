import { getBaseUrl } from './url'

const BASE_URL = import.meta.env.VITE_API_URL || ''

export async function api<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('tradehub_auth')

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  if (res.status === 401) {
    localStorage.removeItem('tradehub_auth')
    window.location.href = `${getBaseUrl()}pages/auth/login.html`
    throw new Error('Unauthorized')
  }

  if (!res.ok) throw new Error(await res.text())

  return res.json()
}

// ─── Frappe API Response Wrapper ─────────────────────────
interface FrappeResponse<T> {
  message: T
}

// ─── Seller Storefront API Response Types ────────────────
export interface SellerBadge {
  label: string
  type: string
}

export interface SellerInfo {
  seller_id: string
  display_name: string
  logo: string
  is_verified: boolean
  verification_label: string
  verified_by: string
  verified_at: string
  years_active: number
  city: string
  country: string
  contact_email: string
  categories: string[]
  badges: SellerBadge[]
}

export interface PerformanceInfo {
  average_rating: number
  total_reviews: number
  response_time_hours: number
  on_time_delivery_rate: number
  total_orders: number
}

export interface StorefrontInfo {
  factory_video_url: string
  factory_images: string[]
  capabilities: string[]
  capability_verified_by: string
}

export interface TabCounts {
  products_count: number
  categories_count: number
  campaigns_count: number
}

export interface SellerStorefrontApiData {
  seller: SellerInfo
  performance: PerformanceInfo
  storefront: StorefrontInfo
  tabs: TabCounts
}

// ─── Manufacturers API Response Types ────────────────────
export interface ManufacturerProduct {
  item_image: string
  price_min: number
  price_max: number
  currency: string
  min_order_qty: number
  uom: string
}

export interface Manufacturer {
  seller_id: string
  storefront_slug: string
  logo: string
  display_name: string
  is_verified: boolean
  years_active: number
  employee_count: string
  factory_area: string
  annual_revenue: string
  average_rating: number
  total_reviews: number
  response_time_hours: number
  on_time_delivery_rate: number
  certificates: string[]
  capabilities: string[]
  top_products: ManufacturerProduct[]
  factory_images: string[]
  chat_url: string
  contact_url: string
}

export interface ManufacturersResponse {
  data: Manufacturer[]
  total: number
  page: number
  page_size: number
}

// ─── Manufacturers API Params ────────────────────────────
export interface ManufacturersParams {
  category?: string
  filters?: string
  sort_by?: string
  page?: number
  page_size?: number
}

// ─── API Wrapper Functions ───────────────────────────────

/**
 * Load seller storefront data by slug.
 * Calls GET /api/method/tr_tradehub.api.v1.seller.get_seller_storefront_data
 * and unwraps the Frappe response.message wrapper.
 */
export async function loadStorefrontData(
  slug: string
): Promise<SellerStorefrontApiData> {
  const response = await api<FrappeResponse<SellerStorefrontApiData>>(
    `/api/method/tr_tradehub.api.v1.seller.get_seller_storefront_data?storefront_slug=${encodeURIComponent(slug)}`
  )
  return response.message
}

/**
 * Load paginated manufacturers list with optional filtering and sorting.
 * Calls GET /api/method/tr_tradehub.api.v1.seller.get_manufacturers_list
 * and unwraps the Frappe response.message wrapper.
 */
export async function loadManufacturers(
  params: ManufacturersParams = {}
): Promise<ManufacturersResponse> {
  const searchParams = new URLSearchParams()
  if (params.category) searchParams.set('category', params.category)
  if (params.filters) searchParams.set('filters', params.filters)
  if (params.sort_by) searchParams.set('sort_by', params.sort_by)
  if (params.page !== undefined) searchParams.set('page', String(params.page))
  if (params.page_size !== undefined)
    searchParams.set('page_size', String(params.page_size))

  const query = searchParams.toString()
  const response = await api<FrappeResponse<ManufacturersResponse>>(
    `/api/method/tr_tradehub.api.v1.seller.get_manufacturers_list${query ? '?' + query : ''}`
  )
  return response.message
}

/**
 * Calculate years active from a joined_at date string.
 * Returns the difference in full calendar years.
 */
export function yearsActive(joinedAt: string): number {
  return new Date().getFullYear() - new Date(joinedAt).getFullYear()
}
