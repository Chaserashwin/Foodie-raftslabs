import { z } from 'zod';
import mongoose from 'mongoose';
import { ORDER_STATUSES, OrderStatus } from '../models/order.model.js';

// Indian phone number regex: optional +91 or 91 or 0 prefix, followed by 10 digits starting with 6, 7, 8, or 9
const INDIAN_PHONE_REGEX = /^(?:(?:\+|00)91[\s.-]?|0)?[6-9]\d{9}$/;

export const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ID format',
  });

export const createOrderSchema = z.object({
  customer: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters long')
      .max(100, 'Name must not exceed 100 characters'),
    phone: z
      .string()
      .trim()
      .regex(
        INDIAN_PHONE_REGEX,
        'Please enter a valid 10-digit mobile number (e.g. 9876543210 or +91 9876543210)'
      ),
    address: z
      .string()
      .trim()
      .min(5, 'Delivery address must be at least 5 characters long')
      .max(300, 'Delivery address must not exceed 300 characters'),
  }),
  items: z
    .array(
      z.object({
        productId: objectIdSchema,
        quantity: z
          .number({ invalid_type_error: 'Quantity must be a number' })
          .int('Quantity must be an integer')
          .min(1, 'Quantity must be at least 1')
          .max(50, 'Quantity cannot exceed 50 per item'),
      })
    )
    .min(1, 'Order must contain at least one item'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES, {
    errorMap: () => ({
      message: `Status must be one of: ${ORDER_STATUSES.join(', ')}`,
    }),
  }),
  note: z.string().max(200).optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

/**
 * Valid status progression map
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  ORDER_RECEIVED: ['PREPARING'],
  PREPARING: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [], // Terminal status
};

export function isValidStatusTransition(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus
): boolean {
  if (currentStatus === targetStatus) return false;
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  return allowed ? allowed.includes(targetStatus) : false;
}
