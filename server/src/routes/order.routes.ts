import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { requireAdminAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Public customer endpoints
router.post('/', OrderController.createOrder);
router.get('/:id', OrderController.getOrderById);

// Simulation endpoint (convenient for interview / live demo)
router.post('/:id/simulate', requireAdminAuth, OrderController.simulateProgression);

// Protected admin endpoints
router.get('/', requireAdminAuth, OrderController.getAllOrders);
router.patch('/:id/status', requireAdminAuth, OrderController.updateOrderStatus);

export default router;
