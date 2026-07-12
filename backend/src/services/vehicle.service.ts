import { Prisma, VehicleStatus, VehicleType } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export class ServiceError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message);
  }
}

interface CreateVehicleInput {
  regNumber: string;
  name: string;
  type: VehicleType;
  maxLoadKg: number;
  odometer: number;
  acquisitionCost: number;
}

interface UpdateVehicleInput {
  regNumber?: string;
  name?: string;
  type?: VehicleType;
  maxLoadKg?: number;
  odometer?: number;
  acquisitionCost?: number;
}

interface VehicleFilters {
  type?: VehicleType;
  status?: VehicleStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export async function createVehicle(data: CreateVehicleInput) {
  const existing = await prisma.vehicle.findUnique({ where: { regNumber: data.regNumber } });
  if (existing) throw new ServiceError('REG_NUMBER_EXISTS', 409, 'Vehicle registration number already exists');

  return prisma.vehicle.create({ data });
}

export async function getVehicles(filters: VehicleFilters) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;

  const where: Prisma.VehicleWhereInput = {
    ...(filters.type && { type: filters.type }),
    ...(filters.status && { status: filters.status }),
    ...(filters.search && {
      OR: [
        { regNumber: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ],
    }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.vehicle.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.vehicle.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function updateVehicle(id: string, data: UpdateVehicleInput) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new ServiceError('NOT_FOUND', 404, 'Vehicle not found');

  const { regNumber, name, type, maxLoadKg, odometer, acquisitionCost } = data;

  return prisma.vehicle.update({
    where: { id },
    data: { regNumber, name, type, maxLoadKg, odometer, acquisitionCost },
  });
}

export async function getAvailableVehicles(cargoWeightKg?: number) {
  return prisma.vehicle.findMany({
    where: {
      status: VehicleStatus.AVAILABLE,
      ...(cargoWeightKg !== undefined && { maxLoadKg: { gte: cargoWeightKg } }),
    },
    orderBy: { maxLoadKg: 'asc' },
  });
}