import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export class AppError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number = 400, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    res.status(err.type === 'entity.too.large' ? 413 : 400).json({ success: false, error: err.type === 'entity.too.large' ? 'Request body too large' : 'Malformed JSON body' });
    return;
  }
  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: formattedErrors,
    });
    return;
  }

  // 2. Mongoose CastError (e.g. invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      error: `Invalid ${err.path}: ${err.value}`,
    });
    return;
  }

  // 3. Mongoose ValidationError
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      error: 'Database Validation Error',
      details,
    });
    return;
  }

  // 4. Custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.details && { details: err.details }),
    });
    return;
  }

  // 5. Unhandled / Server Errors
  console.error('Unhandled server error');

  const responseMessage = 'An unexpected internal server error occurred.';

  res.status(500).json({
    success: false,
    error: responseMessage,
  });
}
