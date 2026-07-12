import { prisma } from '../config/prisma.js';

export class ServiceError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message);
  }
}

interface CreateFuelLogInput {
  vehicleId: string;
  tripId: string;
  liters: number;
  cost: number;
  date: Date;
}

interface FuelLogFilters {
  page?: number;
  limit?: number;
}

export async function createFuelLog(data: CreateFuelLogInput) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle) throw new ServiceError('VEHICLE_NOT_FOUND', 404, 'Vehicle not found');

  const trip = await prisma.trip.findUnique({ where: { id: data.tripId } });
  if (!trip) throw new ServiceError('TRIP_NOT_FOUND', 404, 'Trip not found');

  return prisma.fuelLog.create({ data });
}

export async function getFuelLogs(filters: FuelLogFilters) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;

  const [data, total] = await prisma.$transaction([
    prisma.fuelLog.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
      include: { vehicle: true },
    }),
    prisma.fuelLog.count(),
  ]);

  return { data, total, page, limit };
}