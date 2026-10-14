import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';

export const app = express();

// Security Headers
app.use(helmet());

// CORS configuration
const allowedOrigins = env.CORS_ORIGIN === '*'
  ? '*'
  : env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key', 'Idempotency-Key'],
    credentials: false,
  })
);

// Basic abuse prevention / rate limiting (100 requests per 15 minutes per IP)
if (env.NODE_ENV !== 'test') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again after 15 minutes',
    },
  });
  const readLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, max: 1000,
    standardHeaders: true, legacyHeaders: false,
    message: { success: false, error: 'Too many reads; please try again later' },
  });
  app.use('/api', (req, res, next) => {
    if (req.path === '/health') return next();
    return req.method === 'GET' ? readLimiter(req, res, next) : limiter(req, res, next);
  });
}

// Request logging (cleaner, omit tokens/secrets)
if (env.NODE_ENV !== 'test') {
  app.use(morgan(':method :status :res[content-length] - :response-time ms'));
}

// Body parsing with size limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Mount API routes
app.get('/api/config', (_req, res) => res.json({ success: true, data: { deliveryFee: env.DELIVERY_FEE } }));
app.use('/api', apiRoutes);

// Catch-all for unmatched routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Centralized error handling
app.use(errorHandler);
