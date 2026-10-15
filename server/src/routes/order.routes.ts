import { Router } from 'express';
import { OrderController } from '../controllers/order.controller.js';
import { requireAdminAuth } from '../middleware/auth.middleware.js';

const router = Router();

// Neither public tracking nor private dispatch data should be cached by browsers/CDNs.
router.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Public customer endpoints
router.post('/', OrderController.createOrder);
router.get('/:id', OrderController.getOrderById);

// Simulation endpoint (convenient for interview / live demo)
router.post('/:id/simulate', requireAdminAuth, OrderController.simulateProgression);

// Protected admin endpoints
router.get('/', requireAdminAuth, OrderController.getAllOrders);
router.patch('/:id/status', requireAdminAuth, OrderController.updateOrderStatus);

export default router;
