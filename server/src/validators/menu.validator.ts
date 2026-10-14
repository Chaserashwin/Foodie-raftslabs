import { z } from 'zod';
import { objectIdSchema } from './order.validator.js';

export const getMenuQuerySchema = z.object({
  category: z.enum(['pizzas', 'burgers', 'sides', 'beverages']).optional(),
  search: z.string().trim().max(120).optional(),
});

export const menuItemIdParamSchema = z.object({
  id: objectIdSchema,
});
