import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from '../validators/order.validator.js';

export class OrderController {
  public static async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedData = createOrderSchema.parse(req.body);
      const order = await OrderService.createOrder(validatedData);

      res.status(201).json({
        success: true,
        message: 'Order placed successfully',
        data: order,
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
        data: order,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getAllOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt((req.query.limit as string) || '50', 10);
      const skip = parseInt((req.query.skip as string) || '0', 10);

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
