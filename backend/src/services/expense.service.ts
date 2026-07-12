import { prisma } from '../config/prisma.js';

export class ServiceError extends Error {
  constructor(public code: string, public status: number, message: string) {
    super(message);
  }
}

interface CreateExpenseInput {
  vehicleId?: string;
  tripId: string;
  type: string;
  amount: number;
  date: Date;
}

interface ExpenseFilters {
  page?: number;
  limit?: number;
}

export async function createExpense(data: CreateExpenseInput) {
  const trip = await prisma.trip.findUnique({ where: { id: data.tripId } });
  if (!trip) throw new ServiceError('TRIP_NOT_FOUND', 404, 'Trip not found');

  if (data.vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
    if (!vehicle) throw new ServiceError('VEHICLE_NOT_FOUND', 404, 'Vehicle not found');
  }

  return prisma.expense.create({ data });
}

export async function getExpenses(filters: ExpenseFilters) {
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : 20;

  const [data, total] = await prisma.$transaction([
    prisma.expense.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
      include: { trip: true, vehicle: true },
    }),
    prisma.expense.count(),
  ]);

  return { data, total, page, limit };
}