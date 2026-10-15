import mongoose from 'mongoose';
import { randomBytes, createHash } from 'node:crypto';
import { Order, IOrder, OrderStatus, IOrderItem } from '../models/order.model.js';
import { MenuItem } from '../models/menuItem.model.js';
import { AppError } from '../middleware/errorHandler.middleware.js';
import { env } from '../config/env.js';
import {
  CreateOrderInput,
  isValidStatusTransition,
  ALLOWED_STATUS_TRANSITIONS,
} from '../validators/order.validator.js';

export class OrderService {
  /**
   * Helper to generate unique human-readable order number e.g. FD-20261013-8472
   */
  private static generateOrderNumber(): string {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = randomBytes(12).toString('hex').toUpperCase();
    return `FD-${dateStr}-${randomHex}`;
  }

  /**
   * Create order calculating prices securely on the server
   */
  public static async createOrder(data: CreateOrderInput, idempotencyKey?: string): Promise<IOrder> {
    const requestHash = createHash('sha256').update(JSON.stringify(data)).digest('hex');
    if (idempotencyKey) {
      const existing = await Order.findOne({ idempotencyKey });
      if (existing) {
        if (existing.requestHash !== requestHash) throw new AppError('Idempotency key already used for a different order', 409);
        return existing;
      }
    }
    const { customer, items: requestedItems } = data;

    if (!requestedItems || requestedItems.length === 0) {
      throw new AppError('An order must contain at least one item', 400);
    }

    // Extract unique product IDs
    const productIds = requestedItems.map((item) => item.productId.toLowerCase());

    // Fetch all products from DB using trusted records
    const menuItems = await MenuItem.find({
      _id: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) },
    });

    const menuItemMap = new Map(menuItems.map((item) => [item._id.toString(), item]));

    // Check for missing / nonexistent products
    const missingIds = productIds.filter((id) => !menuItemMap.has(id));
    if (missingIds.length > 0) {
      throw new AppError(
        `One or more requested products do not exist: ${missingIds.join(', ')}`,
        400
      );
    }

    // Check availability and calculate subtotal
    let subtotal = 0;
    const orderItems: IOrderItem[] = [];

    for (const reqItem of requestedItems) {
      const dbProduct = menuItemMap.get(reqItem.productId.toLowerCase())!;

      if (!dbProduct.isAvailable) {
        throw new AppError(`Product "${dbProduct.name}" is currently unavailable`, 400);
      }

      const itemSubtotal = Math.round(dbProduct.price * 100) * reqItem.quantity / 100;
      subtotal += itemSubtotal;

      // Create immutable item snapshot
      orderItems.push({
        productId: dbProduct._id,
        name: dbProduct.name,
        price: dbProduct.price,
        quantity: reqItem.quantity,
        subtotal: itemSubtotal,
      });
    }

    const deliveryFee = env.DELIVERY_FEE;
    subtotal = Math.round(subtotal * 100) / 100;
    const total = Math.round((subtotal + deliveryFee) * 100) / 100;
    const orderNumber = this.generateOrderNumber();

    const order = new Order({
      ...(idempotencyKey && { idempotencyKey, requestHash }),
      orderNumber,
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        address: customer.address.trim(),
      },
      items: orderItems,
      subtotal,
      deliveryFee,
      total,
      status: 'ORDER_RECEIVED',
      timeline: [
        {
          status: 'ORDER_RECEIVED',
          timestamp: new Date(),
          note: 'Order successfully placed and verified',
        },
      ],
    });

    try {
      await order.save();
    } catch (err: any) {
      if (err.code === 11000 && idempotencyKey) {
        const existing = await Order.findOne({ idempotencyKey });
        if (existing && existing.requestHash === requestHash) return existing;
        throw new AppError('Idempotency key conflict', 409);
      }
      throw err;
    }
    return order;
  }

  /**
   * Retrieve order by ID (either MongoDB _id or orderNumber like FD-...)
   */
  public static async getOrderById(idOrNumber: string): Promise<IOrder> {
    let order: IOrder | null = null;

    if (mongoose.Types.ObjectId.isValid(idOrNumber)) {
      order = await Order.findById(idOrNumber);
    }

    if (!order) {
      order = await Order.findOne({ orderNumber: idOrNumber.trim().toUpperCase() });
    }

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  }

  /**
   * Admin: Get all orders (paginated / sorted)
   */
  public static async getAllOrders(limit = 50, skip = 0): Promise<{ orders: IOrder[]; total: number }> {
    const [orders, total] = await Promise.all([
      Order.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(),
    ]);

    return { orders, total };
  }

  /**
   * Update order status with transition validation
   */
  public static async updateOrderStatus(
    orderId: string,
    targetStatus: OrderStatus,
    note?: string
  ): Promise<IOrder> {
    const order = await this.getOrderById(orderId);

    if (order.status === targetStatus) {
      return order; // idempotent if already in target state
    }

    if (!isValidStatusTransition(order.status, targetStatus)) {
      const allowedNext = ALLOWED_STATUS_TRANSITIONS[order.status];
      const allowedStr = allowedNext && allowedNext.length > 0 ? allowedNext.join(', ') : 'none (already delivered)';
      throw new AppError(
        `Invalid status transition: Cannot move order from "${order.status}" to "${targetStatus}". Allowed next status: ${allowedStr}`,
        400
      );
    }

    const updated = await Order.findOneAndUpdate(
      { _id: order._id, status: order.status },
      { $set: { status: targetStatus }, $push: { timeline: {
        status: targetStatus, timestamp: new Date(), note: note || `Order status updated to ${targetStatus}`,
      } } },
      { new: true, runValidators: true }
    );
    if (!updated) {
      const current = await this.getOrderById(orderId);
      if (current.status === targetStatus) return current;
      throw new AppError('Order status changed concurrently; refresh and retry', 409);
    }
    return updated;
  }

  /**
   * Advance to the next logical status in simulation / testing
   */
  public static async advanceToNextStatus(orderId: string): Promise<IOrder> {
    const order = await this.getOrderById(orderId);
    const allowed = ALLOWED_STATUS_TRANSITIONS[order.status];

    if (!allowed || allowed.length === 0) {
      throw new AppError(`Order has already reached final status: ${order.status}`, 400);
    }

    const nextStatus = allowed[0];
    return this.updateOrderStatus(orderId, nextStatus, `Automatic progression to ${nextStatus}`);
  }
}
