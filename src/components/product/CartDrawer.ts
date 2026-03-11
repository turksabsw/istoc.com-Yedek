import { getMockProduct } from '../../data/mockProduct';
const mockProduct = getMockProduct();
import type { ProductDetail } from '../../types/product';
import {
  SharedCartDrawer,
  SharedShippingModal,
  initSharedCartDrawer,
  initSharedShippingModal,
  openSharedCartDrawer,
  openSharedShippingModal,
  type CartDrawerColorModel,
  type CartDrawerItemModel,
  type CartDrawerShippingOption,
  type CartDrawerTierModel,
} from '../cart/overlay/SharedCartDrawer';

export interface CartDrawerTier {
  minQty: number;
  maxQty: number | null;
  price: number;
}

export interface CartDrawerContext {
  title?: string;
  priceTiers?: CartDrawerTier[];
  moq?: number;
  unit?: string;
}

const fallbackColorPalette: Array<{ label: string; hex: string }> = [
  { label: 'Altin', hex: '#D4AF37' },
  { label: 'Gumus', hex: '#C0C0C0' },
  { label: 'Rose Gold', hex: '#B76E79' },
  { label: 'Siyah', hex: '#6B7280' },
];

let currentContext: CartDrawerContext | null = null;

function toShippingOptions(product: ProductDetail): CartDrawerShippingOption[] {
  return product.shipping.map((option, index) => {
    const numeric = Number(option.cost.replace(/[^0-9.]/g, '')) || 0;
    return {
      id: `ship-${index + 1}`,
      method: option.method,
      estimatedDays: option.estimatedDays,
      cost: numeric,
      costText: option.cost,
    };
  });
}

function toColors(product: ProductDetail): CartDrawerColorModel[] {
  const colorVariant = product.variants.find((variant) => variant.type === 'color');
  if (!colorVariant || colorVariant.options.length === 0) {
    return fallbackColorPalette.map((entry, index) => ({
      id: `fallback-color-${index + 1}`,
      label: entry.label,
      colorHex: entry.hex,
      imageKind: 'jewelry',
      imageUrl: product.images[0]?.src
    }));
  }

  return colorVariant.options.map((option, index) => ({
    id: option.id || `color-${index + 1}`,
    label: option.label,
    colorHex: option.value,
    imageKind: 'jewelry',
    imageUrl: option.thumbnail || product.images[0]?.src
  }));
}

function toDrawerItem(product: ProductDetail, context?: CartDrawerContext | null): CartDrawerItemModel {
  const unit = context?.unit || product.unit;
  const moq = context?.moq && context.moq > 0 ? context.moq : product.moq;
  const tiers: CartDrawerTierModel[] = (context?.priceTiers && context.priceTiers.length > 0)
    ? context.priceTiers.map((tier) => ({ minQty: tier.minQty, maxQty: tier.maxQty, price: tier.price }))
    : product.priceTiers.map((tier) => ({ minQty: tier.minQty, maxQty: tier.maxQty, price: tier.price }));

  return {
    id: product.id,
    title: context?.title || product.title,
    supplierName: product.supplier.name,
    unit,
    moq,
    imageKind: 'jewelry',
    priceTiers: tiers,
    colors: toColors(product),
    shippingOptions: toShippingOptions(product),
  };
}

function buildActiveItem(): CartDrawerItemModel {
  return toDrawerItem(mockProduct, currentContext);
}

export function setCartDrawerContext(context: CartDrawerContext | null): void {
  currentContext = context;
}

export function openCartDrawer(): void {
  const item = buildActiveItem();
  initSharedCartDrawer([item]);
  openSharedCartDrawer(item.id);
}

export function CartDrawer(): string {
  return SharedCartDrawer();
}

export function initCartDrawer(): void {
  const item = buildActiveItem();
  initSharedCartDrawer([item]);
}

export function ShippingModal(): string {
  return SharedShippingModal();
}

export function initShippingModal(): void {
  initSharedShippingModal();
}

export function openShippingModal(quantity?: number): void {
  openSharedShippingModal(quantity);
}
