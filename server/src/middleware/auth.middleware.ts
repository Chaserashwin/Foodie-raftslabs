import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const adminKeyHeader = req.headers['x-admin-key'];
  const authHeader = req.headers['authorization'];

  let token = '';
  if (typeof adminKeyHeader === 'string') {
    token = adminKeyHeader.trim();
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  if (!token || token !== env.ADMIN_API_KEY) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Valid Admin API key is required to perform this action.',
    });
    return;
  }

  next();
}
