import { t } from '../../i18n';
import type { ProductImageKind, ProductListingCard } from '../../types/productListing';
import {
  SharedCartDrawer,
  initSharedCartDrawer,
  type CartDrawerItemModel,
  type CartDrawerTierModel,
  type CartDrawerColorModel,
  type CartDrawerShippingOption,
} from '../cart/overlay/SharedCartDrawer';

/** Unsplash e-commerce product images per category for color variant thumbnails */
const categoryVariantImages: Record<ProductImageKind, string[]> = {
  jewelry: [
    'https://images.unsplash.com/photo-1515562141589-67f0d569b6f5?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=800&h=800&fit=crop&q=80',
  ],
  electronics: [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&h=800&fit=crop&q=80',
  ],
  label: [
    'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1568702846914-96b305d2ead1?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=800&h=800&fit=crop&q=80',
  ],
  crafts: [
    'https://images.unsplash.com/photo-1513364776144-60967b0f800c?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1452860606245-08f97f4c8657?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1596455607563-ad6193f76b17?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1595436810223-7dbab2f3bc56?w=800&h=800&fit=crop&q=80',
  ],
  accessory: [
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1622560480654-d96214fddae9?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=800&fit=crop&q=80',
  ],
  clothing: [
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1434389677669-e08b4cda3f96?w=800&h=800&fit=crop&q=80',
  ],
  tools: [
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1426927308491-6380b6a9936f?w=800&h=800&fit=crop&q=80',
  ],
  packaging: [
    'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=800&fit=crop&q=80',
    'https://images.unsplash.com/photo-1576867757603-05b134ebc379?w=800&h=800&fit=crop&q=80',
  ],
};

const categoryColorMap: Record<ProductImageKind, Array<{ label: string; hex: string }>> = {
  jewelry: [
    { label: 'Altin', hex: '#D4AF37' },
    { label: 'Gumus', hex: '#C0C0C0' },
    { label: 'Rose Gold', hex: '#B76E79' },
    { label: 'Siyah', hex: '#6B7280' },
    { label: 'Beyaz', hex: '#F3F4F6' },
  ],
  electronics: [
    { label: 'Siyah', hex: '#1a1a1a' },
    { label: 'Beyaz', hex: '#F3F4F6' },
    { label: 'Mavi', hex: '#3B82F6' },
    { label: 'Gumus', hex: '#C0C0C0' },
  ],
  label: [
    { label: 'Beyaz', hex: '#F5F5F5' },
    { label: 'Kraft', hex: '#C4A35A' },
    { label: 'Seffaf', hex: '#E0E7EE' },
    { label: 'Siyah', hex: '#1a1a1a' },
  ],
  crafts: [
    { label: 'Dogal', hex: '#DEB887' },
    { label: 'Beyaz', hex: '#F5F5F5' },
    { label: 'Pembe', hex: '#F9A8D4' },
    { label: 'Mavi', hex: '#93C5FD' },
  ],
  accessory: [
    { label: 'Siyah', hex: '#1a1a1a' },
    { label: 'Kahverengi', hex: '#8B4513' },
    { label: 'Taba', hex: '#D2691E' },
    { label: 'Lacivert', hex: '#1E3A5F' },
  ],
  clothing: [
    { label: 'Siyah', hex: '#1a1a1a' },
    { label: 'Beyaz', hex: '#F5F5F5' },
    { label: 'Gri', hex: '#9CA3AF' },
    { label: 'Lacivert', hex: '#1E3A5F' },
    { label: 'Kirmizi', hex: '#DC2626' },
  ],
  tools: [
    { label: 'Gumus', hex: '#C0C0C0' },
    { label: 'Siyah', hex: '#1a1a1a' },
    { label: 'Kirmizi', hex: '#DC2626' },
    { label: 'Sari', hex: '#EAB308' },
  ],
  packaging: [
    { label: 'Kraft', hex: '#C4A35A' },
    { label: 'Beyaz', hex: '#F5F5F5' },
    { label: 'Siyah', hex: '#1a1a1a' },
    { label: 'Kahverengi', hex: '#8B4513' },
  ],
};

const defaultShipping: CartDrawerShippingOption[] = [
  { id: 'dhl', method: 'DHL Express', estimatedDays: t('products.businessDays', { days: '5-8' }), cost: 45, costText: '$45.00' },
  { id: 'air', method: t('products.airCargo'), estimatedDays: t('products.businessDays', { days: '10-15' }), cost: 28, costText: '$28.00' },
  { id: 'sea', method: t('products.seaFreight'), estimatedDays: t('products.businessDays', { days: '25-35' }), cost: 12, costText: '$12.00' },
];

function parsePriceRange(priceText: string): { low: number; high: number } {
  const matches = priceText.match(/[\d.]+/g);
  if (!matches || matches.length === 0) return { low: 0, high: 0 };
  if (matches.length === 1) {
    const value = Number(matches[0]);
    return { low: value, high: value };
  }

  const a = Number(matches[0]);
  const b = Number(matches[1]);
  return { low: Math.min(a, b), high: Math.max(a, b) };
}

function parseMoq(moqText: string): number {
  const found = moqText.match(/(\d+)/);
  return found ? Number(found[1]) : 1;
}

function buildPriceTiers(priceText: string, moqText: string): CartDrawerTierModel[] {
  const { low, high } = parsePriceRange(priceText);
  const moq = parseMoq(moqText);
  const mid = Math.round(((low + high) / 2) * 100) / 100;

  if (moq >= 500) {
    return [
      { minQty: moq, maxQty: moq * 2 - 1, price: high },
      { minQty: moq * 2, maxQty: moq * 4 - 1, price: mid },
      { minQty: moq * 4, maxQty: null, price: low },
    ];
  }

  if (moq >= 100) {
    return [
      { minQty: moq, maxQty: 499, price: high },
      { minQty: 500, maxQty: 999, price: mid },
      { minQty: 1000, maxQty: null, price: low },
    ];
  }

  return [
    { minQty: Math.max(1, moq), maxQty: 49, price: high },
    { minQty: 50, maxQty: 199, price: mid },
    { minQty: 200, maxQty: null, price: low },
  ];
}

function buildColors(kind: ProductImageKind, productId?: string): CartDrawerColorModel[] {
  const palette = categoryColorMap[kind] ?? categoryColorMap.jewelry;
  const images = categoryVariantImages[kind] ?? categoryVariantImages.jewelry;
  const idOffset = productId ? productId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) : 0;
  return palette.map((entry, index) => ({
    id: `${kind}-color-${index + 1}`,
    label: entry.label,
    colorHex: entry.hex,
    imageKind: kind,
    imageUrl: images[(idOffset + index) % images.length],
  }));
}

function toDrawerItem(product: ProductListingCard): CartDrawerItemModel {
  const moq = parseMoq(product.moq);
  return {
    id: product.id,
    title: product.name,
    supplierName: product.supplierName || 'Supplier',
    unit: t('cart.unit'),
    moq,
    imageKind: product.imageKind,
    priceTiers: buildPriceTiers(product.price, product.moq),
    colors: buildColors(product.imageKind, product.id),
    shippingOptions: defaultShipping,
  };
}

export function ListingCartDrawer(): string {
  return SharedCartDrawer();
}

export function initListingCartDrawer(products: ProductListingCard[]): void {
  const drawerItems = products.map(toDrawerItem);
  initSharedCartDrawer(drawerItems);
}
