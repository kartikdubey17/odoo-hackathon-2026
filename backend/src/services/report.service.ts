import { VehicleType, VehicleStatus, TripStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';

interface ReportFilters {
  from?: Date;
  to?: Date;
  vehicleType?: VehicleType;
}

// NOTE: Revenue is not tracked in the schema (design.md §15: "assumed input/estimate
// for hackathon demo"). ROI and monthlyRevenue are therefore computed with revenue=0,
// i.e. ROI reflects -(cost)/acquisitionCost and "monthlyRevenue" reports monthly
// operational cost as a stand-in trend until a revenue field is introduced.

async function resolveVehicleIds(vehicleType?: VehicleType) {
  if (!vehicleType) return undefined;
  const vehicles = await prisma.vehicle.findMany({
    where: { type: vehicleType },
    select: { id: true },
  });
  return vehicles.map((v) => v.id);
}

export async function getReportSummary(filters: ReportFilters) {
  const { from, to } = filters;
  const dateRange = { ...(from && { gte: from }), ...(to && { lte: to }) };
  const vehicleIds = await resolveVehicleIds(filters.vehicleType);

  const vehicleFilter = vehicleIds ? { vehicleId: { in: vehicleIds } } : {};
  const dateFilter = from || to ? { date: dateRange } : {};

  const [fuelLogs, maintenanceLogs, expenses, completedTrips, vehicles] = await Promise.all([
    prisma.fuelLog.findMany({ where: { ...vehicleFilter, ...dateFilter } }),
    prisma.maintenanceLog.findMany({ where: { ...vehicleFilter, ...dateFilter } }),
    prisma.expense.findMany({ where: { ...vehicleFilter, ...dateFilter } }),
    prisma.trip.findMany({
      where: {
        status: TripStatus.COMPLETED,
        ...(vehicleIds && { vehicleId: { in: vehicleIds } }),
        ...(from || to ? { completedAt: dateRange } : {}),
      },
    }),
    prisma.vehicle.findMany({
      where: vehicleIds ? { id: { in: vehicleIds } } : {},
    }),
  ]);

  // Fuel efficiency
  const totalDistance = completedTrips.reduce((sum, t) => sum + (t.actualDistanceKm ?? 0), 0);
  const totalLiters = fuelLogs.reduce((sum, f) => sum + f.liters, 0);
  const fuelEfficiencyKmPerL = totalLiters > 0 ? totalDistance / totalLiters : 0;

  // Fleet utilization (snapshot, not date-scoped)
  const nonRetired = vehicles.filter((v) => v.status !== VehicleStatus.RETIRED);
  const onTrip = nonRetired.filter((v) => v.status === VehicleStatus.ON_TRIP);
  const fleetUtilizationPct = nonRetired.length > 0 ? (onTrip.length / nonRetired.length) * 100 : 0;

  // Operational cost
  const fuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const maintenanceCost = maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);
  const expenseCost = expenses.reduce((sum, e) => sum + e.amount, 0);
  const operationalCost = fuelCost + maintenanceCost + expenseCost;

  // ROI (revenue assumed 0 — see note above)
  const totalAcquisitionCost = vehicles.reduce((sum, v) => sum + v.acquisitionCost, 0);
  const vehicleRoiPct =
    totalAcquisitionCost > 0 ? ((0 - (fuelCost + maintenanceCost)) / totalAcquisitionCost) * 100 : 0;

  // Monthly cost trend (proxy for monthlyRevenue — see note above)
  const monthlyMap = new Map<string, number>();
  const addToMonth = (date: Date, amount: number) => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + amount);
  };
  fuelLogs.forEach((f) => addToMonth(f.date, f.cost));
  maintenanceLogs.forEach((m) => addToMonth(m.date, m.cost));
  expenses.forEach((e) => addToMonth(e.date, e.amount));
  const monthlyRevenue = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, value }));

  // Top costliest vehicles
  const costByVehicle = new Map<string, number>();
  const addCost = (vehicleId: string | null, amount: number) => {
    if (!vehicleId) return;
    costByVehicle.set(vehicleId, (costByVehicle.get(vehicleId) ?? 0) + amount);
  };
  fuelLogs.forEach((f) => addCost(f.vehicleId, f.cost));
  maintenanceLogs.forEach((m) => addCost(m.vehicleId, m.cost));
  expenses.forEach((e) => addCost(e.vehicleId ?? null, e.amount));

  const vehicleById = new Map(vehicles.map((v) => [v.id, v]));
  const topCostliestVehicles = Array.from(costByVehicle.entries())
    .map(([vehicleId, cost]) => ({
      vehicleId,
      regNumber: vehicleById.get(vehicleId)?.regNumber ?? 'UNKNOWN',
      cost,
    }))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  return {
    fuelEfficiencyKmPerL: Number(fuelEfficiencyKmPerL.toFixed(2)),
    fleetUtilizationPct: Number(fleetUtilizationPct.toFixed(2)),
    operationalCost: Number(operationalCost.toFixed(2)),
    vehicleRoiPct: Number(vehicleRoiPct.toFixed(2)),
    monthlyRevenue,
    topCostliestVehicles,
  };
}

export async function getReportCsv(filters: ReportFilters): Promise<string> {
  const summary = await getReportSummary(filters);

  const header = 'vehicleId,regNumber,cost';
  const rows = summary.topCostliestVehicles.map(
    (v) => `${v.vehicleId},${v.regNumber},${v.cost.toFixed(2)}`
  );

  const kpiSection = [
    '',
    'metric,value',
    `fuelEfficiencyKmPerL,${summary.fuelEfficiencyKmPerL}`,
    `fleetUtilizationPct,${summary.fleetUtilizationPct}`,
    `operationalCost,${summary.operationalCost}`,
    `vehicleRoiPct,${summary.vehicleRoiPct}`,
  ];

  return [header, ...rows, ...kpiSection].join('\n');
}
