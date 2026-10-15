import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { MenuItem } from '../models/menuItem.model.js';
import { Order } from '../models/order.model.js';
import { SEED_MENU_ITEMS, LEGACY_IMAGE_REPLACEMENTS, SeedMenuItem } from '../data/seedMenu.js';

export interface SeedResult {
  success: boolean;
  databaseName: string;
  totalAuthoritative: number;
  initialCount: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  finalCount: number;
  ordersPreserved: number;
  error?: string;
}

/**
 * Validates a single seed record against required schema constraints before writing.
 */
export function validateSeedItem(item: SeedMenuItem): { valid: boolean; reason?: string } {
  if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
    return { valid: false, reason: 'Name is required and must be a non-empty string' };
  }
  if (!item.description || typeof item.description !== 'string') {
    return { valid: false, reason: 'Description is required' };
  }
  if (typeof item.price !== 'number' || item.price < 0 || !Number.isFinite(item.price)) {
    return { valid: false, reason: 'Price must be a finite non-negative number' };
  }
  const validCategories = ['pizzas', 'burgers', 'sides', 'beverages'];
  if (!validCategories.includes(item.category)) {
    return { valid: false, reason: `Category must be one of: ${validCategories.join(', ')}` };
  }
  if (!item.imageUrl || typeof item.imageUrl !== 'string' || !item.imageUrl.startsWith('http')) {
    return { valid: false, reason: 'ImageUrl must be a valid HTTP/HTTPS URL' };
  }
  return { valid: true };
}

/**
 * Safely masks a MongoDB connection string for logging without exposing credentials.
 */
export function maskMongoUri(uri: string): string {
  try {
    const parsed = new URL(uri);
    const authPart = parsed.username ? '****:****@' : '';
    return `${parsed.protocol}//${authPart}${parsed.host}${parsed.pathname}`;
  } catch {
    return 'mongodb+srv://[masked]';
  }
}

/**
 * Idempotent, non-destructive database seeder.
 * Upserts authoritative menu records by stable unique key ({ name, category }).
 * Preserves all existing orders and unrelated collections.
 */
export async function seedDatabase(options: {
  connectionUri?: string;
  closeConnectionAfter?: boolean;
  verbose?: boolean;
} = {}): Promise<SeedResult> {
  const uri = options.connectionUri || env.MONGODB_URI;
  const verbose = options.verbose ?? true;
  let shouldCloseConnection = options.closeConnectionAfter ?? false;

  // Ensure database connection
  if (mongoose.connection.readyState !== 1) {
    shouldCloseConnection = options.closeConnectionAfter ?? true;
    if (verbose) {
      console.log(`Connecting to MongoDB at ${maskMongoUri(uri)}...`);
    }
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
  }

  const db = mongoose.connection.db;
  const dbName = db?.databaseName || 'unknown';

  if (verbose) {
    console.log(`Connected to database: "${dbName}"`);
    console.log(`Starting safe, idempotent seed of ${SEED_MENU_ITEMS.length} authoritative menu items...`);
  }

  // Pre-seed state verification
  const initialCount = await MenuItem.countDocuments();
  const initialOrderCount = await Order.countDocuments();

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  try {
    // 1. Process each authoritative seed item
    for (const seedItem of SEED_MENU_ITEMS) {
      // Validate record before any write
      const validation = validateSeedItem(seedItem);
      if (!validation.valid) {
        if (verbose) console.warn(`Validation failed for "${seedItem.name}": ${validation.reason}`);
        failed++;
        continue;
      }

      // Check for existing record by canonical unique compound key (name + category)
      const existing = await MenuItem.findOne({
        name: seedItem.name.trim(),
        category: seedItem.category,
      });

      if (!existing) {
        // Insert new item
        await MenuItem.create({
          name: seedItem.name.trim(),
          description: seedItem.description.trim(),
          price: seedItem.price,
          category: seedItem.category,
          imageUrl: seedItem.imageUrl.trim(),
          isAvailable: seedItem.isAvailable ?? true,
          rating: seedItem.rating ?? 4.5,
          prepTime: seedItem.prepTime ?? '15-20 min',
          isVeg: seedItem.isVeg ?? false,
        });
        inserted++;
      } else {
        // Check if existing item needs updates (e.g., corrected description, price, or updated image URL)
        let needsUpdate = false;
        const updatePayload: Record<string, any> = {};

        if (existing.description !== seedItem.description.trim()) {
          updatePayload.description = seedItem.description.trim();
          needsUpdate = true;
        }
        if (existing.price !== seedItem.price) {
          updatePayload.price = seedItem.price;
          needsUpdate = true;
        }
        if (existing.imageUrl !== seedItem.imageUrl.trim()) {
          updatePayload.imageUrl = seedItem.imageUrl.trim();
          needsUpdate = true;
        }
        if (existing.isAvailable !== (seedItem.isAvailable ?? true)) {
          updatePayload.isAvailable = seedItem.isAvailable ?? true;
          needsUpdate = true;
        }
        if (existing.rating !== (seedItem.rating ?? 4.5)) {
          updatePayload.rating = seedItem.rating ?? 4.5;
          needsUpdate = true;
        }
        if (existing.prepTime !== (seedItem.prepTime ?? '15-20 min')) {
          updatePayload.prepTime = seedItem.prepTime ?? '15-20 min';
          needsUpdate = true;
        }
        if (existing.isVeg !== (seedItem.isVeg ?? false)) {
          updatePayload.isVeg = seedItem.isVeg ?? false;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await MenuItem.updateOne({ _id: existing._id }, { $set: updatePayload });
          updated++;
        } else {
          skipped++;
        }
      }
    }

    // 2. Perform narrow legacy image repair if old broken URLs persist in database
    for (const [oldUrl, newUrl] of LEGACY_IMAGE_REPLACEMENTS) {
      await MenuItem.updateMany({ imageUrl: oldUrl }, { $set: { imageUrl: newUrl } });
    }

    // 3. Ensure schema indexes exist
    await MenuItem.init();
    await Order.init();

    // 4. Verify post-seed state
    const finalCount = await MenuItem.countDocuments();
    const finalOrderCount = await Order.countDocuments();

    // Safety verification: Ensure order collection was completely untouched
    if (finalOrderCount !== initialOrderCount) {
      throw new Error(`CRITICAL INTEGRITY FAILURE: Order count changed during menu seed (${initialOrderCount} -> ${finalOrderCount})`);
    }

    const result: SeedResult = {
      success: failed === 0,
      databaseName: dbName,
      totalAuthoritative: SEED_MENU_ITEMS.length,
      initialCount,
      inserted,
      updated,
      skipped,
      failed,
      finalCount,
      ordersPreserved: finalOrderCount,
    };

    if (verbose) {
      console.log('----------------------------------------------------');
      console.log('SEED EXECUTION SUMMARY:');
      console.log(`  Target Database    : ${result.databaseName}`);
      console.log(`  Authoritative Items: ${result.totalAuthoritative}`);
      console.log(`  Initial Items      : ${result.initialCount}`);
      console.log(`  Items Inserted     : ${result.inserted}`);
      console.log(`  Items Updated      : ${result.updated}`);
      console.log(`  Items Skipped      : ${result.skipped}`);
      console.log(`  Items Failed       : ${result.failed}`);
      console.log(`  Final Menu Count   : ${result.finalCount}`);
      console.log(`  Orders Preserved   : ${result.ordersPreserved}`);
      console.log('----------------------------------------------------');
    }

    return result;
  } catch (err: any) {
    if (verbose) console.error('Error during database seed:', err.message);
    return {
      success: false,
      databaseName: dbName,
      totalAuthoritative: SEED_MENU_ITEMS.length,
      initialCount,
      inserted,
      updated,
      skipped,
      failed: failed + 1,
      finalCount: await MenuItem.countDocuments().catch(() => initialCount),
      ordersPreserved: initialOrderCount,
      error: err.message,
    };
  } finally {
    if (shouldCloseConnection && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      if (verbose) console.log('Database connection closed cleanly.');
    }
  }
}

// Execute directly if run as a CLI script
if (process.argv[1] && /scripts\/seed\.[tj]s$/.test(process.argv[1].replace(/\\/g, '/'))) {
  seedDatabase({ closeConnectionAfter: true, verbose: true })
    .then((res) => {
      if (!res.success) {
        console.error('Seed operation completed with failures.');
        process.exit(1);
      }
      console.log('Seed completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal seed error:', err.message);
      process.exit(1);
    });
}
