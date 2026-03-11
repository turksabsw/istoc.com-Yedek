/**
 * Shopping Cart Page — TypeScript Interfaces
 * Types for cart items, suppliers, summary, and assurance data.
 */

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

export interface CartSku {
  id: string;
  skuImage: string;
  variantText: string;
  unitPrice: number;
  currency: string;
  unit: string;
  quantity: number;
  minQty: number;
  maxQty: number;
  selected: boolean;
}

export interface CartProduct {
  id: string;
  title: string;
  href: string;
  tags: CartProductTag[];
  moqLabel: string;
  favoriteIcon: string;
  deleteIcon: string;
  skus: CartSku[];
  selected: boolean;
}

export interface CartProductTag {
  type: 'DELIVERY_GUARANTEE' | 'PROMOTION';
  text: string;
  color: string;
  bgColor: string;
}

export interface CartSupplier {
  id: string;
  name: string;
  href: string;
  selected: boolean;
  products: CartProduct[];
  paymentMethods?: PaymentMethod[];
}

export interface CartSummaryData {
  selectedCount: number;
  items: CartSummaryItem[];
  productSubtotal: number;
  discount: number;
  shippingFee: number;
  subtotal: number;
  currency: string;
}

export interface CartSummaryItem {
  image: string;
  quantity: number;
}

export interface AssuranceItem {
  icon: string;
  title: string;
  description: string;
  logos?: string[];
}
