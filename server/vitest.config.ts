import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: { NODE_ENV: 'test', CORS_ORIGIN: 'http://localhost:5173', ADMIN_API_KEY: 'test-only-placeholder-key' },
    testTimeout: 180000,
    hookTimeout: 180000,
  },
});
