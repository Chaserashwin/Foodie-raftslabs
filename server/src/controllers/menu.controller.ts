import { Request, Response, NextFunction } from 'express';
import { MenuService } from '../services/menu.service.js';
import { getMenuQuerySchema, menuItemIdParamSchema } from '../validators/menu.validator.js';

export class MenuController {
  public static async getMenu(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = getMenuQuerySchema.parse(req.query);
      const items = await MenuService.getMenuItems({
        category: query.category,
        search: query.search,
      });

      res.status(200).json({
        success: true,
        count: items.length,
        data: items,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getMenuItemById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = menuItemIdParamSchema.parse(req.params);
      const item = await MenuService.getMenuItemById(id);

      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (err) {
      next(err);
    }
  }
}
