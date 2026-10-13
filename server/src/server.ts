import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/db.js';

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      console.log(`Foodie backend server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
      console.log(`Health check available at http://localhost:${env.PORT}/api/health`);
    });

    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start Foodie server:', error);
    process.exit(1);
  }
}

startServer();
