import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { VehicleType } from '@prisma/client';

const vehicleTypeEnum = z.nativeEnum(VehicleType);

const createVehicleSchema = z.object({
  regNumber: z.string().min(1, 'regNumber is required'),
  name: z.string().min(1, 'name is required'),
  type: vehicleTypeEnum,
  maxLoadKg: z.number().gt(0, 'maxLoadKg must be greater than 0'),
  odometer: z.number().min(0, 'odometer must be >= 0'),
  acquisitionCost: z.number().min(0, 'acquisitionCost must be >= 0'),
});

const updateVehicleSchema = z.object({
  regNumber: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  type: vehicleTypeEnum.optional(),
  maxLoadKg: z.number().gt(0, 'maxLoadKg must be greater than 0').optional(),
  odometer: z.number().min(0, 'odometer must be >= 0').optional(),
  acquisitionCost: z.number().min(0, 'acquisitionCost must be >= 0').optional(),
});

export function validateCreateVehicle(req: Request, res: Response, next: NextFunction) {
  const result = createVehicleSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors });
  }
  req.body = result.data;
  next();
}

export function validateUpdateVehicle(req: Request, res: Response, next: NextFunction) {
  const result = updateVehicleSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors });
  }
  req.body = result.data;
  next();
}
