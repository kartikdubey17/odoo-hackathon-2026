import { Request, Response, NextFunction } from 'express';
import * as reportService from '../services/report.service.js';

function parseFilters(req: Request) {
  const { from, to, vehicleType } = req.query;
  return {
    from: from ? new Date(from as string) : undefined,
    to: to ? new Date(to as string) : undefined,
    vehicleType: vehicleType as any,
  };
}

export async function getReportSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await reportService.getReportSummary(parseFilters(req));
    return res.status(200).json(summary);
  } catch (err) {
    next(err);
  }
}

export async function exportReportCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const csv = await reportService.getReportCsv(parseFilters(req));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
    return res.status(200).send(csv);
  } catch (err) {
    next(err);
  }
}
