/**
 * Manufacturer & Seller Storefront API — TypeScript Interfaces
 * Data types for Manufacturers List and Seller Storefront API responses
 */

// ─── Manufacturers List API ─────────────────────────────

export interface ManufacturerProduct {
  item_image: string;
  price_min: number;
  price_max: number;
  currency: string;
  min_order_qty: number;
  uom: string;
}

export interface Manufacturer {
  seller_id: string;
  storefront_slug: string;
  logo: string;
  display_name: string;
  is_verified: boolean;
  years_active: number;
  employee_count: string;
  factory_area: string;
  annual_revenue: string;
  average_rating: number;
  total_reviews: number;
  response_time_hours: number;
  on_time_delivery_rate: number;
  certificates: string[];
  capabilities: string[];
  top_products: ManufacturerProduct[];
  factory_images: string[];
  chat_url: string;
  contact_url: string;
}

export interface ManufacturersResponse {
  data: Manufacturer[];
  total: number;
  page: number;
  page_size: number;
}

// ─── Seller Storefront API ──────────────────────────────

export interface SellerBadge {
  label: string;
  type: string;
}

export interface SellerInfo {
  seller_id: string;
  display_name: string;
  logo: string;
  is_verified: boolean;
  verification_label: string;
  verified_by: string;
  verified_at: string;
  years_active: number;
  city: string;
  country: string;
  contact_email: string;
  categories: string[];
  badges: SellerBadge[];
}

export interface PerformanceInfo {
  average_rating: number;
  total_reviews: number;
  response_time_hours: number;
  on_time_delivery_rate: number;
  total_orders: number;
}

export interface StorefrontInfo {
  factory_video_url: string;
  factory_images: string[];
  capabilities: string[];
  capability_verified_by: string;
}

export interface TabCounts {
  products_count: number;
  categories_count: number;
  campaigns_count: number;
}

export interface SellerStorefrontData {
  seller: SellerInfo;
  performance: PerformanceInfo;
  storefront: StorefrontInfo;
  tabs: TabCounts;
}
