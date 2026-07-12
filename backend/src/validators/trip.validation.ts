import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const createTripSchema = z.object({
  source: z.string().min(1, 'source is required'),
  destination: z.string().min(1, 'destination is required'),
  vehicleId: z.string().uuid('vehicleId must be a valid id'),
  driverId: z.string().uuid('driverId must be a valid id'),
  cargoWeightKg: z.number().gt(0, 'cargoWeightKg must be greater than 0'),
  plannedDistanceKm: z.number().gt(0, 'plannedDistanceKm must be greater than 0'),
});

export function validateCreateTrip(req: Request, res: Response, next: NextFunction) {
  const result = createTripSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors });
  }
  req.body = result.data;
  next();
}

const completeTripSchema = z.object({
  actualDistanceKm: z.number().gt(0, 'actualDistanceKm must be greater than 0'),
  fuelConsumedL: z.number().gt(0, 'fuelConsumedL must be greater than 0'),
});

export function validateCompleteTrip(req: Request, res: Response, next: NextFunction) {
  const result = completeTripSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors });
  }
  req.body = result.data;
  next();
}