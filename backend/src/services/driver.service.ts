import { Prisma, DriverStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export class ServiceError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message);
  }
}

interface CreateDriverInput {
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: Date;
  contact: string;
  userId?: string | null;
}

interface UpdateDriverInput {
  name?: string;
  licenseNumber?: string;
  licenseCategory?: string;
  licenseExpiry?: Date;
  contact?: string;
}

interface DriverFilters {
  status?: DriverStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export async function createDriver(data: CreateDriverInput) {
  const existing = await prisma.driver.findUnique({ where: { licenseNumber: data.licenseNumber } });
  if (existing) throw new ServiceError('LICENSE_EXISTS', 409, 'License number already exists');

  return prisma.driver.create({ data });
}

export async function getDrivers(filters: DriverFilters) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;

  const where: Prisma.DriverWhereInput = {
    ...(filters.status && { status: filters.status }),
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { licenseNumber: { contains: filters.search, mode: 'insensitive' } },
      ],
    }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.driver.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.driver.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function updateDriver(id: string, data: UpdateDriverInput) {
  const driver = await prisma.driver.findUnique({ where: { id } });
  if (!driver) throw new ServiceError('NOT_FOUND', 404, 'Driver not found');

  if (data.licenseNumber && data.licenseNumber !== driver.licenseNumber) {
    const existing = await prisma.driver.findUnique({ where: { licenseNumber: data.licenseNumber } });
    if (existing) throw new ServiceError('LICENSE_EXISTS', 409, 'License number already exists');
  }

  return prisma.driver.update({ where: { id }, data });
}

export async function getAvailableDrivers() {
  return prisma.driver.findMany({
    where: {
      status: DriverStatus.AVAILABLE,
      licenseExpiry: { gt: new Date() },
    },
    orderBy: { name: 'asc' },
  });
}
