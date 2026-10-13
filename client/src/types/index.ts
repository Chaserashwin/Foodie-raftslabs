export type MenuCategory = 'pizzas' | 'burgers' | 'sides' | 'beverages';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  imageUrl: string;
  isAvailable: boolean;
  rating: number;
  prepTime: string;
  isVeg: boolean;
}

export interface CartItem {
  product: MenuItem;
  quantity: number;
}

export type OrderStatus =
  | 'ORDER_RECEIVED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED';

export interface OrderCustomer {
  name: string;
  phone: string;
  address: string;
}

export interface OrderSnapshotItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderTimelineItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: OrderCustomer;
  items: OrderSnapshotItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  timeline: OrderTimelineItem[];
  createdAt: string;
  updatedAt: string;
}
