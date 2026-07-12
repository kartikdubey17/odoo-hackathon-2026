import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import driverRoutes from './routes/driver.routes.js';
import tripRoutes from './routes/trip.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import fuelRoutes from './routes/fuel.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import reportRoutes from './routes/report.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(helmet({ contentSecurityPolicy: false })); // CSP off for the simple inline-script frontend below
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

// Serve the frontend — drop index.html into backend/public/
app.use(express.static(path.join(__dirname, '..', 'public')));

// Global error handler — every module's ServiceError/AuthError (each service
// defines its own class, but all share the same { code, status, message }
// shape) is duck-typed here rather than checked via instanceof, since
// instanceof would only match one module's class.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (typeof err?.status === 'number' && err?.code) {
    return res.status(err.status).json({ error: err.code, message: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Something went wrong' });
});

export default app;