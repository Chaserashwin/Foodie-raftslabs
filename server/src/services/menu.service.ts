import { FilterQuery } from 'mongoose';
import { MenuItem, IMenuItem, MenuCategory } from '../models/menuItem.model.js';
import { AppError } from '../middleware/errorHandler.middleware.js';

export class MenuService {
  public static async getMenuItems(filters: {
    category?: MenuCategory;
    search?: string;
  }): Promise<IMenuItem[]> {
    const query: FilterQuery<IMenuItem> = { isAvailable: true };

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: searchRegex }, { description: searchRegex }];
    }

    return MenuItem.find(query).sort({ category: 1, name: 1 });
  }

  public static async getMenuItemById(id: string): Promise<IMenuItem> {
    const item = await MenuItem.findById(id);
    if (!item) {
      throw new AppError(`Menu item with ID "${id}" was not found`, 404);
    }
    return item;
  }
}
