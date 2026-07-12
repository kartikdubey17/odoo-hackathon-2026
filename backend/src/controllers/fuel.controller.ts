import { Request, Response, NextFunction } from 'express';
import * as fuelService from '../services/fuel.service.js';

export async function getFuelLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query;

    const result = await fuelService.getFuelLogs({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createFuelLog(req: Request, res: Response, next: NextFunction) {
  try {
    const log = await fuelService.createFuelLog(req.body);
    return res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}
