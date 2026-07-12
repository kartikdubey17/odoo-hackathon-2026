import { Request, Response, NextFunction } from 'express';
import * as vehicleService from '../services/vehicle.service.js';

export async function getVehicles(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, status, search, page, limit } = req.query;

    const result = await vehicleService.getVehicles({
      type: type as any,
      status: status as any,
      search: search as string | undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const vehicle = await vehicleService.createVehicle(req.body);
    return res.status(201).json(vehicle);
  } catch (err) {
    next(err);
  }
}

export async function updateVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const vehicle = await vehicleService.updateVehicle(id, req.body);
    return res.status(200).json(vehicle);
  } catch (err) {
    next(err);
  }
}

export async function getAvailableVehicles(req: Request, res: Response, next: NextFunction) {
  try {
    const { cargoWeightKg } = req.query;
    const vehicles = await vehicleService.getAvailableVehicles(
      cargoWeightKg ? Number(cargoWeightKg) : undefined
    );
    return res.status(200).json(vehicles);
  } catch (err) {
    next(err);
  }
}
