import { Request, Response, NextFunction } from 'express';
import * as maintenanceService from '../services/maintenance.service.js';

export async function getMaintenanceLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const logs = await maintenanceService.getMaintenanceLogs();
    return res.status(200).json(logs);
  } catch (err) {
    next(err);
  }
}

export async function createMaintenanceLog(req: Request, res: Response, next: NextFunction) {
  try {
    const log = await maintenanceService.createMaintenanceLog(req.body);
    return res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}

export async function closeMaintenanceLog(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const log = await maintenanceService.closeMaintenanceLog(id);
    return res.status(200).json(log);
  } catch (err) {
    next(err);
  }
}
