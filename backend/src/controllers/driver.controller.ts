import { Request, Response, NextFunction } from 'express';
import * as driverService from '../services/driver.service.js';

export async function getDrivers(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, search, page, limit } = req.query;

    const result = await driverService.getDrivers({
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

export async function createDriver(req: Request, res: Response, next: NextFunction) {
  try {
    const driver = await driverService.createDriver(req.body);
    return res.status(201).json(driver);
  } catch (err) {
    next(err);
  }
}

export async function updateDriver(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const driver = await driverService.updateDriver(id, req.body);
    return res.status(200).json(driver);
  } catch (err) {
    next(err);
  }
}

export async function getAvailableDrivers(req: Request, res: Response, next: NextFunction) {
  try {
    const drivers = await driverService.getAvailableDrivers();
    return res.status(200).json(drivers);
  } catch (err) {
    next(err);
  }
}
