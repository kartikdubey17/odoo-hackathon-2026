import { VehicleStatus, DriverStatus, TripStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export async function getDashboardKpis() {
  const [vehicleGroups, driverGroups, tripGroups] = await Promise.all([
    prisma.vehicle.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.driver.groupBy({ by: ['status'], _count: { status: true } }),
    prisma.trip.groupBy({ by: ['status'], _count: { status: true } }),
  ]);

  const vehicleCount = (status: VehicleStatus) =>
    vehicleGroups.find((g) => g.status === status)?._count.status ?? 0;
  const driverCount = (status: DriverStatus) =>
    driverGroups.find((g) => g.status === status)?._count.status ?? 0;
  const tripCount = (status: TripStatus) =>
    tripGroups.find((g) => g.status === status)?._count.status ?? 0;

  const retiredVehicles = vehicleCount(VehicleStatus.RETIRED);
  const totalVehicles = vehicleGroups.reduce((sum, g) => sum + g._count.status, 0);
  const activeVehicles = totalVehicles - retiredVehicles;
  const onTripVehicles = vehicleCount(VehicleStatus.ON_TRIP);

  const fleetUtilizationPct = activeVehicles > 0 ? (onTripVehicles / activeVehicles) * 100 : 0;

  return {
    activeVehicles,
    availableVehicles: vehicleCount(VehicleStatus.AVAILABLE),
    vehiclesInMaintenance: vehicleCount(VehicleStatus.IN_SHOP),
    activeTrips: tripCount(TripStatus.DISPATCHED),
    pendingTrips: tripCount(TripStatus.DRAFT),
    driversOnDuty: driverCount(DriverStatus.AVAILABLE) + driverCount(DriverStatus.ON_TRIP),
    fleetUtilizationPct: Number(fleetUtilizationPct.toFixed(2)),
  };
}
