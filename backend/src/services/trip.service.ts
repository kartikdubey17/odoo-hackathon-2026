import { Prisma, TripStatus, VehicleStatus, DriverStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export class ServiceError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message);
  }
}

interface CreateTripInput {
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeightKg: number;
  plannedDistanceKm: number;
}

interface TripFilters {
  status?: TripStatus;
  page?: number;
  limit?: number;
}

export async function createTrip(createdById: string, data: CreateTripInput) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle) throw new ServiceError('VEHICLE_NOT_FOUND', 404, 'Vehicle not found');

  const driver = await prisma.driver.findUnique({ where: { id: data.driverId } });
  if (!driver) throw new ServiceError('DRIVER_NOT_FOUND', 404, 'Driver not found');

  if (data.cargoWeightKg > vehicle.maxLoadKg) {
    throw new ServiceError('CARGO_EXCEEDS_CAPACITY', 400, 'Cargo weight exceeds vehicle max load');
  }

  return prisma.trip.create({
    data: {
      ...data,
      createdById,
      status: TripStatus.DRAFT,
    },
  });
}

export async function getTrips(filters: TripFilters) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;

  const where: Prisma.TripWhereInput = {
    ...(filters.status && { status: filters.status }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.trip.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.trip.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function dispatchTrip(tripId: string) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new ServiceError('NOT_FOUND', 404, 'Trip not found');

  if (trip.status !== TripStatus.DRAFT) {
    throw new ServiceError('INVALID_STATE', 400, 'Trip must be in DRAFT status to dispatch');
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: trip.vehicleId } });
  if (!vehicle) throw new ServiceError('VEHICLE_NOT_FOUND', 404, 'Vehicle not found');

  const driver = await prisma.driver.findUnique({ where: { id: trip.driverId } });
  if (!driver) throw new ServiceError('DRIVER_NOT_FOUND', 404, 'Driver not found');

  if (vehicle.status !== VehicleStatus.AVAILABLE) {
    throw new ServiceError('ALREADY_ASSIGNED', 409, 'Vehicle is not available');
  }

  if (driver.status === DriverStatus.SUSPENDED) {
    throw new ServiceError('DRIVER_INELIGIBLE', 422, 'Driver is suspended');
  }

  if (driver.licenseExpiry <= new Date()) {
    throw new ServiceError('DRIVER_INELIGIBLE', 422, 'Driver license has expired');
  }

  if (driver.status !== DriverStatus.AVAILABLE) {
    throw new ServiceError('ALREADY_ASSIGNED', 409, 'Driver is not available');
  }

  if (trip.cargoWeightKg > vehicle.maxLoadKg) {
    throw new ServiceError('CAPACITY_EXCEEDED', 422, 'Cargo weight exceeds vehicle max load');
  }

  const [updatedTrip] = await prisma.$transaction([
    prisma.trip.update({
      where: { id: tripId },
      data: { status: TripStatus.DISPATCHED, dispatchedAt: new Date() },
    }),
    prisma.vehicle.update({
      where: { id: vehicle.id },
      data: { status: VehicleStatus.ON_TRIP },
    }),
    prisma.driver.update({
      where: { id: driver.id },
      data: { status: DriverStatus.ON_TRIP },
    }),
  ]);

  return updatedTrip;
}

export async function cancelTrip(tripId: string) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new ServiceError('NOT_FOUND', 404, 'Trip not found');

  if (trip.status === TripStatus.COMPLETED || trip.status === TripStatus.CANCELLED) {
    throw new ServiceError('INVALID_STATE', 400, 'Trip is already completed or cancelled');
  }

  if (trip.status === TripStatus.DISPATCHED) {
    const [updatedTrip] = await prisma.$transaction([
      prisma.trip.update({
        where: { id: tripId },
        data: { status: TripStatus.CANCELLED },
      }),
      prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: VehicleStatus.AVAILABLE },
      }),
      prisma.driver.update({
        where: { id: trip.driverId },
        data: { status: DriverStatus.AVAILABLE },
      }),
    ]);
    return updatedTrip;
  }

  return prisma.trip.update({
    where: { id: tripId },
    data: { status: TripStatus.CANCELLED },
  });
}

interface CompleteTripInput {
  actualDistanceKm: number;
  fuelConsumedL: number;
}

interface RequestingUser {
  userId: string;
  role: string;
  driverId?: string | null;
}

export async function completeTrip(tripId: string, requester: RequestingUser, data: CompleteTripInput) {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new ServiceError('NOT_FOUND', 404, 'Trip not found');

  if (requester.role === 'DRIVER' && trip.driverId !== requester.driverId) {
    throw new ServiceError('FORBIDDEN', 403, 'Drivers may only complete their own trip');
  }

  if (trip.status !== TripStatus.DISPATCHED) {
    throw new ServiceError('INVALID_STATE', 400, 'Trip must be in DISPATCHED status to complete');
  }

  const [updatedTrip] = await prisma.$transaction([
    prisma.trip.update({
      where: { id: tripId },
      data: {
        status: TripStatus.COMPLETED,
        completedAt: new Date(),
        actualDistanceKm: data.actualDistanceKm,
        fuelConsumedL: data.fuelConsumedL,
      },
    }),
    prisma.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: VehicleStatus.AVAILABLE },
    }),
    prisma.driver.update({
      where: { id: trip.driverId },
      data: { status: DriverStatus.AVAILABLE },
    }),
  ]);

  return updatedTrip;
}