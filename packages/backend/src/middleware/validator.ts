import type { Request, Response, NextFunction } from 'express';
import { type ZodSchema, ZodError } from 'zod';

/**
 * Middleware factory: validates req.body against a Zod schema.
 * Replaces req.body with the parsed (and stripped) data.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message },
        });
      }
      next(err);
    }
  };
}
