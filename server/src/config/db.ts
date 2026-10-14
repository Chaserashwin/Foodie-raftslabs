import mongoose from 'mongoose';
import { env } from './env.js';
import { MenuItem } from '../models/menuItem.model.js';
import { Order } from '../models/order.model.js';
import { SEED_MENU_ITEMS, LEGACY_IMAGE_REPLACEMENTS } from '../data/seedMenu.js';

let mongodInstance: any = null;

async function configureMongoMemoryBinary(): Promise<void> {
  const path = await import('path');
  const fs = await import('fs');

  const possibleDirs = [
    path.resolve(process.cwd(), 'server/node_modules/.cache/mongodb-memory-server'),
    path.resolve(process.cwd(), 'node_modules/.cache/mongodb-memory-server'),
  ];
  for (const dir of possibleDirs) {
    if (fs.existsSync(dir)) {
      process.env.MONGOMS_DOWNLOAD_DIR = dir;
      break;
    }
  }
}

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // If in test environment, use MongoMemoryServer for full isolation
  if (env.NODE_ENV === 'test') {
    try {
      await configureMongoMemoryBinary();
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          launchTimeout: 60000,
        },
      });
      const uri = mongodInstance.getUri();
      await mongoose.connect(uri);
      console.log('Connected to isolated in-memory test database');
      await seedDatabaseIfEmpty();
      return;
    } catch {
      throw new Error('Failed to start isolated test database; external database fallback is forbidden');
    }
  }

  // Attempt real MongoDB connection
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log('Connected to MongoDB');
  } catch {
    console.warn('Could not connect to configured MongoDB');

    // If local development and no MongoDB server is running, spin up embedded Mongo server so local dev never breaks
    if (env.NODE_ENV === 'development' && env.USE_MEMORY_DB === 'true') {
      try {
        console.log('Spinning up embedded MongoDB instance for seamless local development...');
        await configureMongoMemoryBinary();
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create({
          instance: {
            launchTimeout: 60000,
          },
        });
        const fallbackUri = mongodInstance.getUri();
        await mongoose.connect(fallbackUri);
        console.warn('Using temporary development database; orders are lost on restart');
        await seedDatabaseIfEmpty();
        return;
      } catch {
        console.error('Failed to start embedded database fallback');
      }
    }

    throw new Error('Database initialization failed');
  }
  // A seed/index failure must fail startup, never switch a connected database.
  await seedDatabaseIfEmpty();
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongodInstance) {
    await mongodInstance.stop();
    mongodInstance = null;
  }
}

export async function seedDatabaseIfEmpty(): Promise<void> {
  try {
    const count = await MenuItem.countDocuments();
    if (count === 0) {
      console.log('Menu collection is empty. Seeding initial menu items...');
      await MenuItem.insertMany(SEED_MENU_ITEMS);
      console.log(`Successfully seeded ${SEED_MENU_ITEMS.length} menu items.`);
    }
    // Ensure unique order/idempotency indexes exist before accepting requests.
    await Order.init();
    for (const [oldUrl, imageUrl] of LEGACY_IMAGE_REPLACEMENTS) {
      await MenuItem.updateMany({ imageUrl: oldUrl }, { $set: { imageUrl } });
    }
  } catch {
    throw new Error('Menu seed failed');
  }
}
