import dotenv from 'dotenv';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';

// Load .env if present
dotenv.config();

export interface EnvConfig {
  PORT: number;
  MONGODB_URI: string;
  NODE_ENV: 'development' | 'production' | 'test';
  CORS_ORIGIN: string;
  ADMIN_API_KEY: string;
  DELIVERY_FEE: number;
  USE_MEMORY_DB: 'true' | 'false';
}

export function parseEnvironment(input: Record<string, string | undefined>): EnvConfig {
  const result = z.object({
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),
    MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\//).default('mongodb://127.0.0.1:27017/foodie'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    ADMIN_API_KEY: z.string().min(16).optional(),
    DELIVERY_FEE: z.coerce.number().finite().min(0).default(40),
    USE_MEMORY_DB: z.enum(['true', 'false']).default('false'),
  }).safeParse(input);
  if (!result.success) throw new Error(`Invalid environment fields: ${result.error.issues.map(i => i.path.join('.')).join(', ')}`);
  const config = result.data;
  if (config.CORS_ORIGIN !== '*') {
    for (const origin of config.CORS_ORIGIN.split(',')) {
      try {
        const url = new URL(origin.trim());
        if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin.trim()) throw new Error();
      } catch { throw new Error('CORS_ORIGIN must contain exact HTTP(S) origins'); }
    }
  }
  if (config.NODE_ENV === 'production' && (!input.MONGODB_URI || !config.ADMIN_API_KEY || !input.CORS_ORIGIN || config.CORS_ORIGIN === '*' || config.USE_MEMORY_DB === 'true')) {
    throw new Error('Production requires MONGODB_URI, ADMIN_API_KEY, explicit CORS_ORIGIN and persistent database');
  }
  return { ...config, ADMIN_API_KEY: config.ADMIN_API_KEY ?? randomBytes(32).toString('hex') };
}
export const env = parseEnvironment(process.env);
