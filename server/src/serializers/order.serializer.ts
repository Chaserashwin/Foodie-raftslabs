import { IOrder } from '../models/order.model.js';

/** Public tracking allowlist: never serialize customer data or free-form staff notes. */
export function toPublicOrder(order: IOrder) {
  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    items: order.items.map(item => ({
      productId: item.productId.toString(),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    status: order.status,
    timeline: order.timeline.map(entry => ({ status: entry.status, timestamp: entry.timestamp })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
