import mongoose from 'mongoose';
import { env } from './env.js';
import { MenuItem } from '../models/menuItem.model.js';
import { SEED_MENU_ITEMS } from '../data/seedMenu.js';

let mongodInstance: any = null;

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // If in test environment, use MongoMemoryServer for full isolation
  if (env.NODE_ENV === 'test') {
    try {
      const path = await import('path');
      const fs = await import('fs');

      // Set download directory to where the binary was cached
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

      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const uri = mongodInstance.getUri();
      await mongoose.connect(uri);
      console.log('Connected to isolated in-memory test database');
      await seedDatabaseIfEmpty();
      return;
    } catch (err) {
      console.error('Failed to start in-memory test database, attempting direct URI:', err);
    }
  }

  // Attempt real MongoDB connection
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log(`Connected to MongoDB at ${env.MONGODB_URI}`);
    await seedDatabaseIfEmpty();
  } catch (err: any) {
    console.warn(`Could not connect to external MongoDB: ${err.message}`);

    // If local development and no MongoDB server is running, spin up an in-memory Mongo server so local dev never breaks
    if (env.NODE_ENV === 'development') {
      try {
        console.log('Spinning up embedded MongoDB instance for seamless local development...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const fallbackUri = mongodInstance.getUri();
        await mongoose.connect(fallbackUri);
        console.log('Connected to embedded local development database');
        await seedDatabaseIfEmpty();
        return;
      } catch (fallbackErr) {
        console.error('Failed to start embedded database fallback:', fallbackErr);
      }
    }

    throw err;
  }
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
  } catch (err) {
    console.error('Error during menu seeding:', err);
  }
}
