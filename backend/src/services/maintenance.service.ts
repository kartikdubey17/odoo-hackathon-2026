import { MaintStatus, VehicleStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export class ServiceError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message);
  }
}

interface CreateMaintenanceInput {
  vehicleId: string;
  serviceType: string;
  cost: number;
  date: Date;
}

export async function getMaintenanceLogs() {
  return prisma.maintenanceLog.findMany({
    include: { vehicle: true },
    orderBy: { date: 'desc' },
  });
}

export async function createMaintenanceLog(data: CreateMaintenanceInput) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle) throw new ServiceError('VEHICLE_NOT_FOUND', 404, 'Vehicle not found');

  if (vehicle.status === VehicleStatus.IN_SHOP) {
    throw new ServiceError('VEHICLE_IN_SHOP', 409, 'Vehicle is already in shop');
  }

  if (vehicle.status === VehicleStatus.RETIRED) {
    throw new ServiceError('VEHICLE_RETIRED', 409, 'Vehicle is retired');
  }

  const [log] = await prisma.$transaction([
    prisma.maintenanceLog.create({
      data: { ...data, status: MaintStatus.ACTIVE },
    }),
    prisma.vehicle.update({
      where: { id: data.vehicleId },
      data: { status: VehicleStatus.IN_SHOP },
    }),
  ]);

  return log;
}

export async function closeMaintenanceLog(id: string) {
  const log = await prisma.maintenanceLog.findUnique({ where: { id } });
  if (!log) throw new ServiceError('NOT_FOUND', 404, 'Maintenance log not found');

  if (log.status !== MaintStatus.ACTIVE) {
    throw new ServiceError('INVALID_STATE', 400, 'Maintenance log is not active');
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: log.vehicleId } });
  if (!vehicle) throw new ServiceError('VEHICLE_NOT_FOUND', 404, 'Vehicle not found');

  const [updatedLog] = await prisma.$transaction([
    prisma.maintenanceLog.update({
      where: { id },
      data: { status: MaintStatus.COMPLETED },
    }),
    ...(vehicle.status !== VehicleStatus.RETIRED
      ? [prisma.vehicle.update({ where: { id: vehicle.id }, data: { status: VehicleStatus.AVAILABLE } })]
      : []),
  ]);

  return updatedLog;
}
