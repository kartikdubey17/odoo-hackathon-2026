import { Request, Response, NextFunction } from 'express';
import * as tripService from '../services/trip.service.js';

export async function getTrips(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, page, limit } = req.query;

    const result = await tripService.getTrips({
      status: status as any,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const trip = await tripService.createTrip(req.user!.userId, req.body);
    return res.status(201).json(trip);
  } catch (err) {
    next(err);
  }
}

export async function dispatchTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const trip = await tripService.dispatchTrip(id);
    return res.status(200).json(trip);
  } catch (err) {
    next(err);
  }
}

export async function completeTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const trip = await tripService.completeTrip(id, req.user!, req.body);
    return res.status(200).json(trip);
  } catch (err) {
    next(err);
  }
}

export async function cancelTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const trip = await tripService.cancelTrip(id);
    return res.status(200).json(trip);
  } catch (err) {
    next(err);
  }
}