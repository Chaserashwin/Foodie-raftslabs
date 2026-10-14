import { describe, it, expect } from 'vitest';
import { parseEnvironment } from '../config/env.js';

describe('Environment validation', () => {
  it.each([{ PORT: 'NaN' }, { PORT: '70000' }, { DELIVERY_FEE: '-1' }, { NODE_ENV: 'invalid' }, { MONGODB_URI: 'https://invalid' }, { CORS_ORIGIN: 'https://example.com/path' }])('rejects invalid fields without exposing values', input => {
    expect(() => parseEnvironment(input)).toThrow();
  });
  it('requires explicit production configuration', () => {
    expect(() => parseEnvironment({ NODE_ENV: 'production' })).toThrow();
    const input = { NODE_ENV: 'production', MONGODB_URI: 'mongodb://localhost/test', ADMIN_API_KEY: 'test-only-placeholder-key', CORS_ORIGIN: 'https://example.com' };
    expect(parseEnvironment(input).NODE_ENV).toBe('production');
    expect(() => parseEnvironment({ ...input, CORS_ORIGIN: '*' })).toThrow();
    expect(() => parseEnvironment({ ...input, USE_MEMORY_DB: 'true' })).toThrow();
  });
});
