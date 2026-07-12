import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const createMaintenanceSchema = z.object({
  vehicleId: z.string().uuid('vehicleId must be a valid id'),
  serviceType: z.string().min(1, 'serviceType is required'),
  cost: z.number().min(0, 'cost must be >= 0'),
  date: z.coerce.date(),
});

export function validateCreateMaintenance(req: Request, res: Response, next: NextFunction) {
  const result = createMaintenanceSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors });
  }
  req.body = result.data;
  next();
}
