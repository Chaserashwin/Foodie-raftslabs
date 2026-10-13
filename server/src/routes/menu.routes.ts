import { Router } from 'express';
import { MenuController } from '../controllers/menu.controller.js';

const router = Router();

router.get('/', MenuController.getMenu);
router.get('/:id', MenuController.getMenuItemById);

export default router;
