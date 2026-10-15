import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { MenuItem } from '../models/menuItem.model.js';
import { Order } from '../models/order.model.js';
import {
  seedDatabase,
  validateSeedItem,
  maskMongoUri,
} from '../scripts/seed.js';
import { SEED_MENU_ITEMS, SeedMenuItem } from '../data/seedMenu.js';

describe('Database Seeding & Idempotency Test Suite (Isolated In-Memory)', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await connectDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  describe('1. Seed Item Validation', () => {
    it('should validate all authoritative seed items in the project catalog', () => {
      for (const item of SEED_MENU_ITEMS) {
        const result = validateSeedItem(item);
        expect(result.valid).toBe(true);
        expect(result.reason).toBeUndefined();
      }
    });

    it('should reject seed items missing name or with empty name', () => {
      const invalid = { ...SEED_MENU_ITEMS[0], name: '' };
      const result = validateSeedItem(invalid as SeedMenuItem);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Name is required');
    });

    it('should reject seed items with invalid categories', () => {
      const invalid = { ...SEED_MENU_ITEMS[0], category: 'desserts' as any };
      const result = validateSeedItem(invalid as SeedMenuItem);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Category must be one of');
    });

    it('should reject seed items with negative or non-numeric price', () => {
      const negative = { ...SEED_MENU_ITEMS[0], price: -50 };
      expect(validateSeedItem(negative as SeedMenuItem).valid).toBe(false);

      const nonNumber = { ...SEED_MENU_ITEMS[0], price: NaN };
      expect(validateSeedItem(nonNumber as SeedMenuItem).valid).toBe(false);
    });

    it('should reject seed items with non-HTTP image URLs', () => {
      const invalidUrl = { ...SEED_MENU_ITEMS[0], imageUrl: 'ftp://example.com/pic.jpg' };
      expect(validateSeedItem(invalidUrl as SeedMenuItem).valid).toBe(false);
    });
  });

  describe('2. Connection String Masking', () => {
    it('should mask username and password from mongo URIs', () => {
      const rawUri = 'mongodb+srv://admin_user:SuperSecretPassword123@cluster0.kjkz4su.mongodb.net/foodie?retryWrites=true&w=majority';
      const masked = maskMongoUri(rawUri);

      expect(masked).not.toContain('admin_user');
      expect(masked).not.toContain('SuperSecretPassword123');
      expect(masked).toContain('cluster0.kjkz4su.mongodb.net');
      expect(masked).toContain('/foodie');
    });
  });

  describe('3. Idempotency & Safety', () => {
    it('should be idempotent: subsequent seed runs must not duplicate records', async () => {
      // Run seed first time
      const run1 = await seedDatabase({ verbose: false, closeConnectionAfter: false });
      expect(run1.success).toBe(true);
      expect(run1.failed).toBe(0);
      expect(run1.finalCount).toBe(SEED_MENU_ITEMS.length);

      // Run seed second time immediately on same database
      const run2 = await seedDatabase({ verbose: false, closeConnectionAfter: false });
      expect(run2.success).toBe(true);
      expect(run2.inserted).toBe(0);
      expect(run2.skipped).toBe(SEED_MENU_ITEMS.length);
      expect(run2.failed).toBe(0);
      expect(run2.finalCount).toBe(SEED_MENU_ITEMS.length);

      // Verify directly from MenuItem collection that count matches exactly
      const actualCount = await MenuItem.countDocuments();
      expect(actualCount).toBe(SEED_MENU_ITEMS.length);
    });

    it('should preserve unrelated collections (Order) completely intact during seed', async () => {
      // Find a sample item to create a real order
      const sampleItem = await MenuItem.findOne();
      expect(sampleItem).not.toBeNull();

      // Create a test order
      const testOrder = await Order.create({
        orderNumber: 'FD-TEST-SEEDED-9999',
        customer: {
          name: 'Preserved Customer',
          phone: '9876543210',
          address: '123 Safe Street',
        },
        items: [
          {
            productId: sampleItem!._id,
            name: sampleItem!.name,
            price: sampleItem!.price,
            quantity: 2,
            subtotal: sampleItem!.price * 2,
          },
        ],
        subtotal: sampleItem!.price * 2,
        deliveryFee: 40,
        total: sampleItem!.price * 2 + 40,
        status: 'ORDER_RECEIVED',
        timeline: [
          {
            status: 'ORDER_RECEIVED',
            timestamp: new Date(),
            note: 'Order placed prior to seed',
          },
        ],
      });

      const orderCountBefore = await Order.countDocuments();
      expect(orderCountBefore).toBeGreaterThanOrEqual(1);

      // Execute seedDatabase
      const seedResult = await seedDatabase({ verbose: false, closeConnectionAfter: false });
      expect(seedResult.success).toBe(true);

      // Verify that the order still exists and is completely unchanged
      const orderAfter = await Order.findById(testOrder._id);
      expect(orderAfter).not.toBeNull();
      expect(orderAfter?.orderNumber).toBe('FD-TEST-SEEDED-9999');
      expect(orderAfter?.customer.name).toBe('Preserved Customer');

      const orderCountAfter = await Order.countDocuments();
      expect(orderCountAfter).toBe(orderCountBefore);
    });

    it('should safely update modified records back to authoritative specification without changing _id', async () => {
      // Intentionally modify an item in DB
      const itemToAlter = await MenuItem.findOne({ name: 'Margherita Fresca Pizza' });
      expect(itemToAlter).not.toBeNull();
      const originalId = itemToAlter!._id.toString();

      await MenuItem.updateOne(
        { _id: itemToAlter!._id },
        { $set: { description: 'Temporarily altered description' } }
      );

      // Run seed
      const run = await seedDatabase({ verbose: false, closeConnectionAfter: false });
      expect(run.success).toBe(true);
      expect(run.updated).toBeGreaterThanOrEqual(1);

      // Verify the item has authoritative description restored, and its _id was preserved
      const restored = await MenuItem.findById(originalId);
      expect(restored).not.toBeNull();
      expect(restored?._id.toString()).toBe(originalId);
      expect(restored?.description).toContain('San Marzano tomato sauce');
    });
  });
});
