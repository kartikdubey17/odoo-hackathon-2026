import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const createFuelLogSchema = z.object({
  vehicleId: z.string().min(1, 'vehicleId is required'),
  tripId: z.string().min(1, 'tripId is required').optional(),
  liters: z.number().gt(0, 'liters must be greater than 0'),
  cost: z.number().min(0, 'cost must be >= 0'),
  date: z.coerce.date(),
});

export function validateCreateFuelLog(req: Request, res: Response, next: NextFunction) {
  const result = createFuelLogSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors });
  }
  req.body = result.data;
  next();
}
