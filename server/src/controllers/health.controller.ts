import { Request, Response } from 'express';
import mongoose from 'mongoose';

export class HealthController {
  public static checkHealth(_req: Request, res: Response): void {
    const dbStateMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    const dbStatus = dbStateMap[mongoose.connection.readyState] || 'unknown';

    const healthy = mongoose.connection.readyState === 1;
    res.status(healthy ? 200 : 503).json({
      success: healthy,
      status: healthy ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        readyState: mongoose.connection.readyState,
      },
    });
  }
}
