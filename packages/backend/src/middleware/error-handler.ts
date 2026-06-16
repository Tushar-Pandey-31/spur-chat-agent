import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { ZodError } from 'zod';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // Zod validation errors
  if (err instanceof ZodError) {
    const message = err.issues.map((i) => i.message).join('; ');
    logger.warn({ err, path: req.path }, 'Validation error');
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message },
    });
  }

  // Known operational errors
  if (err instanceof AppError) {
    logger.warn({ err, path: req.path, statusCode: err.statusCode }, err.message);
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message },
    });
  }

  // Unknown errors — don't leak internals
  logger.error({ err, path: req.path }, 'Unhandled error');
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again later.',
    },
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'The requested endpoint does not exist.' },
  });
}
