/**
 * OrderStore — Merkezi Sipariş State Store
 * CartStore singleton pattern'i ile localStorage persistence.
 */

import type { Order, OrderStatus, OrderStatusColor } from '../../../types/order';

const STORAGE_KEY = 'tradehub_orders';
const SEED_FLAG = 'tradehub_orders_seeded';

const SEED_ORDERS: Order[] = [
  {
    id: 'ord-seed-1',
    orderNumber: '29303B587501029918',
    orderDate: 'Mar 04, 2026, PST',
    total: '118.28',
    currency: 'USD',
    seller: 'Guangzhou Yuanfuyuan Leather Co., Ltd.',
    status: 'Waiting for payment',
    statusColor: 'text-amber-600',
    statusDescription: 'Please complete your payment soon.',
    products: [
      {
        name: 'Custom Retro Waterproof Tote Satchel Camera Shoulder Crossbody Laptop Vintage Bag Waxed Canvas Messenger Bag for Men',
        variation: 'Gray',
        unitPrice: '59.14',
        quantity: 2,
        totalPrice: '118.28',
        image: 'https://placehold.co/80x80/292929/FFF?text=Bag+1',
      },
    ],
    shipping: {
      trackingStatus: 'Pending',
      address: 'Turkey',
      shipFrom: 'China',
      method: 'Standard',
      incoterms: 'DAP',
    },
    payment: {
      status: 'Unpaid',
      hasRecord: false,
      subtotal: '118.28',
      shippingFee: '0.00',
      grandTotal: '118.28',
    },
    supplier: {
      name: 'Guangzhou Yuanfuyuan Leather Co., Ltd.',
      contact: 'Sales Team',
      phone: '+86 123 4567 8900',
      email: 'contact@yuanfuyuan.com',
    },
    paymentMethod: 'bank_transfer',
    createdAt: new Date('2026-03-04T10:00:00').getTime(),
  },
  {
    id: 'ord-seed-2',
    orderNumber: '29303B591501029918',
    orderDate: 'Mar 04, 2026, PST',
    total: '330.80',
    currency: 'USD',
    seller: 'Yiwu Yingzi Leather Co., Ltd.',
    status: 'Waiting for payment',
    statusColor: 'text-amber-600',
    statusDescription: 'Please complete your payment soon.',
    products: [
      {
        name: "Wholesale Custom Handmade Luxury Metallic Handbags Beach Bag Luxury Wedding Evening Clutch Bag Women's Crochet Bag for Women",
        variation: 'Blue, M',
        unitPrice: '30.07',
        quantity: 11,
        totalPrice: '330.80',
        image: 'https://placehold.co/80x80/292929/FFF?text=Bag+2',
      },
    ],
    shipping: {
      trackingStatus: 'Pending',
      address: 'Turkey',
      shipFrom: 'China',
      method: 'Standard',
      incoterms: 'DAP',
    },
    payment: {
      status: 'Unpaid',
      hasRecord: false,
      subtotal: '330.80',
      shippingFee: '0.00',
      grandTotal: '330.80',
    },
    supplier: {
      name: 'Yiwu Yingzi Leather Co., Ltd.',
      contact: 'Sales Team',
      phone: '+86 123 4567 8900',
      email: 'contact@yingzi.com',
    },
    paymentMethod: 'bank_transfer',
    createdAt: new Date('2026-03-04T10:00:00').getTime(),
  },
];

export class OrderStore {
  private orders: Order[] = [];
  private listeners = new Set<() => void>();

  load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Order[];
        if (Array.isArray(parsed)) {
          this.orders = parsed;
        }
      }
    } catch { /* corrupted data — start fresh */ }

    // Seed mock orders on first-ever load
    if (!localStorage.getItem(SEED_FLAG)) {
      this.orders = [...SEED_ORDERS, ...this.orders];
      localStorage.setItem(SEED_FLAG, '1');
      this.save();
    }

    this.notify();
  }

  getOrders(): Order[] {
    return this.orders;
  }

  getOrderByNumber(orderNumber: string): Order | undefined {
    return this.orders.find((o) => o.orderNumber === orderNumber);
  }

  addOrders(newOrders: Order[]): void {
    this.orders = [...newOrders, ...this.orders];
    this.save();
    this.notify();
  }

  updateOrderStatus(
    orderNumber: string,
    status: OrderStatus,
    statusColor: OrderStatusColor,
    statusDescription: string,
  ): void {
    const order = this.getOrderByNumber(orderNumber);
    if (!order) return;
    order.status = status;
    order.statusColor = statusColor;
    order.statusDescription = statusDescription;
    this.save();
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.orders));
    } catch { /* quota exceeded */ }
  }
}

export const orderStore = new OrderStore();
