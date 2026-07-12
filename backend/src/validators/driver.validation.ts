import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const createDriverSchema = z.object({
  name: z.string().min(1, 'name is required'),
  licenseNumber: z.string().min(1, 'licenseNumber is required'),
  licenseCategory: z.string().min(1, 'licenseCategory is required'),
  licenseExpiry: z.coerce.date(),
  contact: z.string().min(1, 'contact is required'),
  userId: z.string().uuid().optional().nullable(),
});

const updateDriverSchema = z.object({
  name: z.string().min(1).optional(),
  licenseNumber: z.string().min(1).optional(),
  licenseCategory: z.string().min(1).optional(),
  licenseExpiry: z.coerce.date().optional(),
  contact: z.string().min(1).optional(),
});

export function validateCreateDriver(req: Request, res: Response, next: NextFunction) {
  const result = createDriverSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors });
  }
  req.body = result.data;
  next();
}

export function validateUpdateDriver(req: Request, res: Response, next: NextFunction) {
  const result = updateDriverSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors });
  }
  req.body = result.data;
  next();
}
