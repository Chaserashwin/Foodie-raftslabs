import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { OrderService } from '../services/order.service.js';
import { toPublicOrder } from '../serializers/order.serializer.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from '../validators/order.validator.js';

export class OrderController {
  public static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createOrderSchema.parse(req.body);
      const keyHeader = req.get('Idempotency-Key');
      const key = keyHeader === undefined ? undefined : z.string().min(16).max(100).regex(/^[a-zA-Z0-9-]+$/).parse(keyHeader);
      const order = await OrderService.createOrder(validatedData, key);

      res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: toPublicOrder(order),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const order = await OrderService.getOrderById(id);

      res.status(200).json({
        success: true,
        data: toPublicOrder(order),
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getAllOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { limit, skip } = z.object({
        limit: z.coerce.number().int().min(1).max(100).default(50),
        skip: z.coerce.number().int().min(0).max(100000).default(0),
      }).parse(req.query);

      const result = await OrderService.getAllOrders(limit, skip);

      res.status(200).json({
        success: true,
        count: result.orders.length,
        total: result.total,
        data: result.orders,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status, note } = updateOrderStatusSchema.parse(req.body);

      const updatedOrder = await OrderService.updateOrderStatus(id, status, note);

      res.status(200).json({
        success: true,
        message: `Order status successfully updated to ${status}`,
        data: updatedOrder,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async simulateProgression(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updatedOrder = await OrderService.advanceToNextStatus(id);

      res.status(200).json({
        success: true,
        message: `Order automatically advanced to ${updatedOrder.status}`,
        data: updatedOrder,
      });
    } catch (err) {
      next(err);
    }
  }
}
