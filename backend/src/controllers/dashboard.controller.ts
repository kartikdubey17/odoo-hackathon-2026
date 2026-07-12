import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service.js';

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const kpis = await dashboardService.getDashboardKpis();
    return res.status(200).json(kpis);
  } catch (err) {
    next(err);
  }
}
