# AZM Flow

Operations management platform for AZM last-mile delivery, covering partner onboarding, contract management, dispatch operations, and shipment tracking.

## Completed Phases

- **Phase 1** — Authentication, RBAC, user management, company profile, compliance readiness (government entities, licenses, documents)
- **Phase 2** — Partner onboarding (e-commerce stores, contacts, integration settings), operational contracts, coverage areas, requirements, activity log, readiness scoring
- **Phase 3** — Shipment management, dispatch, delivery attempts, proof of delivery, returns, import batches, operations reporting
- **Brand Identity Update** — Logo, Droid Sans Arabic font, orange/dark blue brand colors applied system-wide

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm
- PostgreSQL 15+ (running locally or via Docker)

## Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/Techzoneksa/azm.git
cd azm

# 2. Install dependencies
npm install

# 3. Set up PostgreSQL and create a database named 'azm_flow'
#    Then configure .env:
cp .env.example .env
# Edit .env with your local PostgreSQL credentials

# 4. Generate Prisma client
npm run db:generate

# 5. Create and apply migrations
npm run db:migrate:dev

# 6. (Optional) Seed the database
npm run seed

# 7. Start development server
npm run dev
```

## Available Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type check |
| `npm run format` | Format code with Prettier |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Apply pending migrations (production) |
| `npm run db:migrate:dev` | Create and apply migrations (development) |
| `npm run db:push` | Push schema directly (quick dev) |
| `npm run seed` | Seed database with initial data |

## Environment Variables

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="replace-with-strong-random-secret"
NEXT_PUBLIC_APP_NAME="AZM Flow"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NODE_ENV="production"
```

> **IMPORTANT**: Never commit `.env` to Git. Use `.env.example` as a template.

## Test Credentials

After seeding, the following accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@azm.com` | `admin123` |
| Operations | `ops@azm.com` | `ops123` |
| Read-only | `readonly@azm.com` | `readonly123` |

## Production Notes

- Database: PostgreSQL (SQLite is **not** used in production)
- Deployment: See `docs/hostinger-deployment.md` for Hostinger setup
- The application uses **npm** as the package manager (not pnpm)

## GitHub Repository

[https://github.com/Techzoneksa/azm](https://github.com/Techzoneksa/azm)
