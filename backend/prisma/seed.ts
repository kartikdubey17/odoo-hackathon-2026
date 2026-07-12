import "dotenv/config";
import {
  PrismaClient,
  Role,
  VehicleType,
  VehicleStatus,
  DriverStatus,
  TripStatus,
  MaintStatus,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

// Fixed UUIDs for idempotency across re-runs
const IDS = {
  users: {
    manager: '10000000-0000-0000-0000-000000000001',
    driver: '10000000-0000-0000-0000-000000000002',
    safety: '10000000-0000-0000-0000-000000000003',
    finance: '10000000-0000-0000-0000-000000000004',
  },
  vehicles: {
    v1: '20000000-0000-0000-0000-000000000001',
    v2: '20000000-0000-0000-0000-000000000002',
    v3: '20000000-0000-0000-0000-000000000003',
    v4: '20000000-0000-0000-0000-000000000004',
    v5: '20000000-0000-0000-0000-000000000005',
    v6: '20000000-0000-0000-0000-000000000006',
  },
  drivers: {
    d1: '30000000-0000-0000-0000-000000000001',
    d2: '30000000-0000-0000-0000-000000000002',
    d3: '30000000-0000-0000-0000-000000000003',
    d4: '30000000-0000-0000-0000-000000000004',
    d5: '30000000-0000-0000-0000-000000000005',
  },
  trips: {
    t1: '40000000-0000-0000-0000-000000000001',
    t2: '40000000-0000-0000-0000-000000000002',
    t3: '40000000-0000-0000-0000-000000000003',
    t4: '40000000-0000-0000-0000-000000000004',
  },
  maintenance: {
    m1: '50000000-0000-0000-0000-000000000001',
    m2: '50000000-0000-0000-0000-000000000002',
  },
  fuel: {
    f1: '60000000-0000-0000-0000-000000000001',
    f2: '60000000-0000-0000-0000-000000000002',
  },
  expenses: {
    e1: '70000000-0000-0000-0000-000000000001',
    e2: '70000000-0000-0000-0000-000000000002',
  },
};

async function main() {
  const passwordHash = await bcrypt.hash('secret123', 10);

  // ---------- Users ----------
  const manager = await prisma.user.upsert({
    where: { email: 'manager@transitops.in' },
    update: {},
    create: {
      id: IDS.users.manager,
      name: 'Raveen K.',
      email: 'manager@transitops.in',
      passwordHash,
      role: Role.FLEET_MANAGER,
    },
  });

  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@transitops.in' },
    update: {},
    create: {
      id: IDS.users.driver,
      name: 'Alex Menon',
      email: 'driver@transitops.in',
      passwordHash,
      role: Role.DRIVER,
    },
  });

  await prisma.user.upsert({
    where: { email: 'safety@transitops.in' },
    update: {},
    create: {
      id: IDS.users.safety,
      name: 'Priya Nair',
      email: 'safety@transitops.in',
      passwordHash,
      role: Role.SAFETY_OFFICER,
    },
  });

  await prisma.user.upsert({
    where: { email: 'finance@transitops.in' },
    update: {},
    create: {
      id: IDS.users.finance,
      name: 'Sanjay Rao',
      email: 'finance@transitops.in',
      passwordHash,
      role: Role.FINANCIAL_ANALYST,
    },
  });

  // ---------- Vehicles ----------
  const vehicleData = [
    { id: IDS.vehicles.v1, regNumber: 'KA-01-AB-1234', name: 'Van-05', type: VehicleType.VAN, maxLoadKg: 800, odometer: 15230, acquisitionCost: 950000, status: VehicleStatus.AVAILABLE },
    { id: IDS.vehicles.v2, regNumber: 'KA-01-AB-5678', name: 'Truck-11', type: VehicleType.TRUCK, maxLoadKg: 5000, odometer: 42890, acquisitionCost: 2200000, status: VehicleStatus.ON_TRIP },
    { id: IDS.vehicles.v3, regNumber: 'KA-02-CD-1122', name: 'Mini-02', type: VehicleType.MINI, maxLoadKg: 350, odometer: 8100, acquisitionCost: 550000, status: VehicleStatus.AVAILABLE },
    { id: IDS.vehicles.v4, regNumber: 'KA-02-CD-3344', name: 'Truck-07', type: VehicleType.TRUCK, maxLoadKg: 4500, odometer: 67210, acquisitionCost: 2100000, status: VehicleStatus.IN_SHOP },
    { id: IDS.vehicles.v5, regNumber: 'KA-03-EF-9988', name: 'Van-09', type: VehicleType.VAN, maxLoadKg: 900, odometer: 5010, acquisitionCost: 980000, status: VehicleStatus.RETIRED },
    { id: IDS.vehicles.v6, regNumber: 'KA-03-EF-6655', name: 'Mini-04', type: VehicleType.MINI, maxLoadKg: 400, odometer: 12040, acquisitionCost: 570000, status: VehicleStatus.AVAILABLE },
  ];

  for (const v of vehicleData) {
    await prisma.vehicle.upsert({
      where: { regNumber: v.regNumber },
      update: {},
      create: v,
    });
  }

  // ---------- Drivers ----------
  const today = new Date();
  const inDays = (n: number) => new Date(today.getTime() + n * 24 * 60 * 60 * 1000);

  const driverData = [
    { id: IDS.drivers.d1, userId: driverUser.id, name: 'Alex Menon', licenseNumber: 'DL-LMV-00123', licenseCategory: 'LMV', licenseExpiry: inDays(365), contact: '9876500001', safetyScore: 95, status: DriverStatus.AVAILABLE },
    { id: IDS.drivers.d2, userId: null, name: 'John Fernandes', licenseNumber: 'DL-HMV-00456', licenseCategory: 'HMV', licenseExpiry: inDays(-10), contact: '9876500002', safetyScore: 60, status: DriverStatus.SUSPENDED },
    { id: IDS.drivers.d3, userId: null, name: 'Ritu Sharma', licenseNumber: 'DL-LMV-00789', licenseCategory: 'LMV', licenseExpiry: inDays(180), contact: '9876500003', safetyScore: 88, status: DriverStatus.ON_TRIP },
    { id: IDS.drivers.d4, userId: null, name: 'Deepak Yadav', licenseNumber: 'DL-HMV-00987', licenseCategory: 'HMV', licenseExpiry: inDays(5), contact: '9876500004', safetyScore: 100, status: DriverStatus.AVAILABLE },
    { id: IDS.drivers.d5, userId: null, name: 'Meena Iyer', licenseNumber: 'DL-LMV-00654', licenseCategory: 'LMV', licenseExpiry: inDays(300), contact: '9876500005', safetyScore: 90, status: DriverStatus.OFF_DUTY },
  ];

  for (const d of driverData) {
    await prisma.driver.upsert({
      where: { licenseNumber: d.licenseNumber },
      update: {},
      create: d,
    });
  }

  // ---------- Trips ----------
  await prisma.trip.upsert({
    where: { id: IDS.trips.t1 },
    update: {},
    create: {
      id: IDS.trips.t1,
      createdById: manager.id,
      source: 'Bengaluru Hub',
      destination: 'Mysuru Depot',
      vehicleId: IDS.vehicles.v1,
      driverId: IDS.drivers.d4,
      cargoWeightKg: 450,
      plannedDistanceKm: 145,
      status: TripStatus.DRAFT,
    },
  });

  await prisma.trip.upsert({
    where: { id: IDS.trips.t2 },
    update: {},
    create: {
      id: IDS.trips.t2,
      createdById: manager.id,
      source: 'Bengaluru Hub',
      destination: 'Chennai Depot',
      vehicleId: IDS.vehicles.v2,
      driverId: IDS.drivers.d3,
      cargoWeightKg: 4200,
      plannedDistanceKm: 350,
      status: TripStatus.DISPATCHED,
      dispatchedAt: inDays(-1),
    },
  });

  await prisma.trip.upsert({
    where: { id: IDS.trips.t3 },
    update: {},
    create: {
      id: IDS.trips.t3,
      createdById: manager.id,
      source: 'Bengaluru Hub',
      destination: 'Hyderabad Depot',
      vehicleId: IDS.vehicles.v3,
      driverId: IDS.drivers.d1,
      cargoWeightKg: 300,
      plannedDistanceKm: 570,
      actualDistanceKm: 582,
      fuelConsumedL: 48.5,
      status: TripStatus.COMPLETED,
      dispatchedAt: inDays(-5),
      completedAt: inDays(-3),
    },
  });

  await prisma.trip.upsert({
    where: { id: IDS.trips.t4 },
    update: {},
    create: {
      id: IDS.trips.t4,
      createdById: manager.id,
      source: 'Bengaluru Hub',
      destination: 'Coimbatore Depot',
      vehicleId: IDS.vehicles.v6,
      driverId: IDS.drivers.d5,
      cargoWeightKg: 250,
      plannedDistanceKm: 365,
      status: TripStatus.CANCELLED,
    },
  });

  // ---------- Maintenance Logs ----------
  await prisma.maintenanceLog.upsert({
    where: { id: IDS.maintenance.m1 },
    update: {},
    create: {
      id: IDS.maintenance.m1,
      vehicleId: IDS.vehicles.v4,
      serviceType: 'Engine Overhaul',
      cost: 45000,
      date: inDays(-2),
      status: MaintStatus.ACTIVE,
    },
  });

  await prisma.maintenanceLog.upsert({
    where: { id: IDS.maintenance.m2 },
    update: {},
    create: {
      id: IDS.maintenance.m2,
      vehicleId: IDS.vehicles.v1,
      serviceType: 'Oil Change',
      cost: 3500,
      date: inDays(-20),
      status: MaintStatus.COMPLETED,
    },
  });

  // ---------- Fuel Logs ----------
  await prisma.fuelLog.upsert({
    where: { id: IDS.fuel.f1 },
    update: {},
    create: {
      id: IDS.fuel.f1,
      vehicleId: IDS.vehicles.v3,
      tripId: IDS.trips.t3,
      liters: 48.5,
      cost: 4850,
      date: inDays(-3),
    },
  });

  await prisma.fuelLog.upsert({
    where: { id: IDS.fuel.f2 },
    update: {},
    create: {
      id: IDS.fuel.f2,
      vehicleId: IDS.vehicles.v2,
      tripId: null,
      liters: 120,
      cost: 12400,
      date: inDays(-1),
    },
  });

  // ---------- Expenses ----------
  await prisma.expense.upsert({
    where: { id: IDS.expenses.e1 },
    update: {},
    create: {
      id: IDS.expenses.e1,
      vehicleId: IDS.vehicles.v3,
      tripId: IDS.trips.t3,
      type: 'Toll',
      amount: 620,
      date: inDays(-3),
    },
  });

  await prisma.expense.upsert({
    where: { id: IDS.expenses.e2 },
    update: {},
    create: {
      id: IDS.expenses.e2,
      vehicleId: IDS.vehicles.v2,
      tripId: null,
      type: 'Misc',
      amount: 1500,
      date: inDays(-1),
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });