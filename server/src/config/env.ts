import dotenv from 'dotenv';
import path from 'path';

// Load .env if present
dotenv.config();

export interface EnvConfig {
  PORT: number;
  MONGODB_URI: string;
  NODE_ENV: 'development' | 'production' | 'test';
  CORS_ORIGIN: string;
  ADMIN_API_KEY: string;
  DELIVERY_FEE: number;
}

export const env: EnvConfig = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/foodie',
  NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  ADMIN_API_KEY: process.env.ADMIN_API_KEY || 'raftlabs-admin-secret-key-2026',
  DELIVERY_FEE: parseFloat(process.env.DELIVERY_FEE || '40'),
};
