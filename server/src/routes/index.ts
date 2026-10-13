import { Router } from 'express';
import healthRoutes from './health.routes.js';
import menuRoutes from './menu.routes.js';
import orderRoutes from './order.routes.js';

const router = Router();

router.use('/', healthRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);

export default router;
