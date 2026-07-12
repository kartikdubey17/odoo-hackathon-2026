# TransitOps — Smart Transport Operations Platform

Fleet management system built for Odoo Hackathon 2026. Tracks vehicles, drivers, trips, maintenance, fuel, and expenses with role-based access control.

## Tech Stack

- **Backend:** Node.js, Express 5, TypeScript, Prisma 7 (PostgreSQL driver adapter), PostgreSQL
- **Auth:** JWT + bcrypt
- **Validation:** Zod 4
- **Frontend:** Vanilla HTML/CSS/JS (served as a static file by the same Express server)

## Team

| Person | Responsibility |
|---|---|
| Kartik | Backend — Express, Prisma, PostgreSQL, REST APIs, auth, business logic |
| Priyanshi | Frontend — React, Tailwind CSS, UI, API integration |

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma        # data model (7 models, RBAC enums, cascade rules)
│   └── seed.ts               # idempotent demo data (4 users, 6 vehicles, 5 drivers, 4 trips...)
├── prisma.config.ts           # Prisma 7 CLI config (loads .env)
├── public/
│   └── index.html             # frontend, served statically by Express
├── src/
│   ├── config/prisma.ts       # Prisma client singleton (pg driver adapter)
│   ├── middleware/
│   │   ├── auth.ts            # JWT verification, attaches req.user
│   │   └── rbac.ts            # authorize(...roles) route guard
│   ├── controllers/           # thin request/response layer, one per module
│   ├── services/              # all business logic, one per module
│   ├── routes/                # one router per module, mounted under /api
│   ├── utils/ & validators/   # Zod request validators, JWT helpers
│   ├── app.ts                 # Express app: middleware, routes, static frontend, error handler
│   └── server.ts              # entrypoint: loads .env, starts the app
├── tsconfig.json
└── package.json
```

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Create `.env` in the project root:
```dotenv
DATABASE_URL="postgresql://user:pass@localhost:5432/your_db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=5000
```

### 3. Generate Prisma client
```bash
npx prisma generate
```

### 4. Run migrations and seed the database
```bash
npx prisma migrate dev
npx prisma db seed
```

### 5. Start the app
```bash
npm run dev
```

Open **http://localhost:5000** — the frontend is served from the same server, so there's nothing else to run.

## Demo Accounts

All seeded with password `secret123`.

| Role | Email |
|---|---|
| Fleet Manager | `manager@transitops.in` |
| Driver | `driver@transitops.in` |
| Safety Officer | `safety@transitops.in` |
| Financial Analyst | `finance@transitops.in` |

## Data Model

7 core models: `User`, `Vehicle`, `Driver`, `Trip`, `MaintenanceLog`, `FuelLog`, `Expense`. Every table has a UUID primary key and an auto-managed `updatedAt`. Key state machines:

- **Vehicle:** `AVAILABLE → ON_TRIP → AVAILABLE` (via trip dispatch/complete/cancel) or `AVAILABLE ⇄ IN_SHOP` (via maintenance open/close). `RETIRED` is terminal.
- **Driver:** mirrors vehicle for `AVAILABLE`/`ON_TRIP`; `SUSPENDED` blocks dispatch eligibility.
- **Trip:** `DRAFT → DISPATCHED → COMPLETED`, or cancellable from `DRAFT`/`DISPATCHED` → `CANCELLED`.
- **MaintenanceLog:** `ACTIVE → COMPLETED`.

## API Reference

All routes are prefixed with `/api` and require `Authorization: Bearer <token>` except `/auth/login`.

| Method | Route | Roles | Notes |
|---|---|---|---|
| POST | `/auth/login` | — | returns `{ token, user }` |
| GET | `/dashboard` | all | fleet-wide KPI snapshot |
| GET | `/vehicles` | FM, SO, FA | search/status/type filters, paginated |
| GET | `/vehicles/available` | FM | filterable by `cargoWeightKg` |
| POST | `/vehicles` | FM | unique `regNumber` enforced |
| PATCH | `/vehicles/:id` | FM | partial update, status not editable here |
| GET | `/drivers` | FM, SO, FA, Driver | search/status filters, paginated |
| GET | `/drivers/available` | FM | excludes expired license / suspended |
| POST | `/drivers` | FM, SO | unique `licenseNumber` enforced |
| PATCH | `/drivers/:id` | FM, SO | partial update |
| GET | `/trips` | FM, SO, FA, Driver | status filter, paginated |
| POST | `/trips` | FM | creates as `DRAFT`, validates cargo ≤ vehicle capacity |
| POST | `/trips/:id/dispatch` | FM | atomic: trip→DISPATCHED, vehicle/driver→ON_TRIP |
| POST | `/trips/:id/complete` | FM, Driver (own trip only) | atomic: trip→COMPLETED, vehicle/driver→AVAILABLE |
| POST | `/trips/:id/cancel` | FM | atomic if trip was DISPATCHED; direct update if DRAFT |
| GET | `/maintenance` | FM, SO, FA | includes vehicle relation |
| POST | `/maintenance` | FM | atomic: log ACTIVE + vehicle→IN_SHOP |
| PATCH | `/maintenance/:id/close` | FM | atomic: log COMPLETED + vehicle→AVAILABLE (unless RETIRED) |
| GET | `/fuel` | FM, SO, FA | paginated, includes vehicle relation |
| POST | `/fuel` | FM | requires valid trip + vehicle |
| GET | `/expenses` | FM, SO, FA | paginated, includes trip + vehicle relations |
| POST | `/expenses` | FM | requires valid trip |
| GET | `/reports/summary` | FM, FA | fuel efficiency, utilization, cost, ROI, cost trend, top-cost vehicles |
| GET | `/reports/export.csv` | FM, FA | CSV download of the same summary |

## Known Trade-offs / Assumptions

- **Revenue is not tracked** in the schema. `vehicleRoiPct` and `monthlyRevenue` in `/reports/summary` are computed with revenue = 0 as a placeholder (documented in `report.service.ts`) — `monthlyRevenue` currently reports a monthly *cost* trend, not real revenue.
- **`GET /trips` is not scoped server-side by driver.** The frontend filters a driver's own trips client-side; the API itself currently returns all trips to any authenticated Driver. Fine for a hackathon demo, but should move to a server-side `where: { driverId }` filter before any real deployment.
- **Trip completion ownership check** relies on `req.user.driverId`, resolved in the auth middleware by matching `Driver.userId` to the logged-in user — only works for drivers who have a linked `User` account (the seed only links one driver this way).

## Frontend Integration

The bundled `public/index.html` is a working reference frontend (not the final Priyanshi build) that exercises every endpoint above. It expects `API_BASE = '/api'` (relative), which works because it's served from the same Express instance — no CORS configuration needed in this mode.