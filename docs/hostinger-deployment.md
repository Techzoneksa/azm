# Hostinger Deployment Guide — AZM Flow

## Prerequisites

- Node.js **20 LTS** or **22 LTS** (project tested on v24.x locally)
- npm (project uses `package-lock.json`, **not** pnpm)
- PostgreSQL database (provided by Hostinger or external)
- GitHub account with access to the repository
- Hostinger VPS or Shared Hosting with Node.js support

## Required Environment Variables

Set these in Hostinger's environment configuration or in a `.env` file on the server:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="<generate-a-strong-random-secret>"
NEXT_PUBLIC_APP_NAME="AZM Flow"
NEXT_PUBLIC_APP_URL="https://your-actual-domain.com"
NODE_ENV="production"
```

> `DIRECT_URL` is optional for Hostinger if your plan provides a direct PostgreSQL connection
> without a connection pooler. If unsure, set it to the same value as `DATABASE_URL`.

## Database Setup

1. Create a PostgreSQL database via your Hostinger control panel.
2. Note the host, port, database name, username, and password.
3. Set `DATABASE_URL` and `DIRECT_URL` to match your database.

## GitHub Integration (Auto-Deploy)

1. Go to **Hostinger hPanel → Hosting → Manage → Git**.
2. Connect your GitHub repository: `https://github.com/Techzoneksa/azm.git`
3. Set branch to `master`.
4. Configure auto-deploy on push (optional).

## Manual Deployment via SSH

```bash
# 1. SSH into your Hostinger server
ssh user@your-server

# 2. Clone or pull the repository
git clone https://github.com/Techzoneksa/azm.git
cd azm
git checkout master

# 3. Install dependencies
npm install

# 4. Set environment variables
# Create .env or configure via Hostinger panel
# DATABASE_URL, JWT_SECRET, NEXT_PUBLIC_APP_URL, NODE_ENV

# 5. Generate Prisma client
npx prisma generate

# 6. Run database migrations
npx prisma migrate deploy

# 7. Seed the database (first deployment only)
npm run seed

# 8. Build the application
npm run build

# 9. Start the application
npm run start
```

## Build & Start Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npx prisma generate` | Generate Prisma client |
| `npx prisma migrate deploy` | Apply pending migrations |
| `npm run seed` | Seed initial data |
| `npm run build` | Build Next.js app |
| `npm run start` | Start production server |

## First Deployment Checklist

- [ ] PostgreSQL database created and accessible
- [ ] `DATABASE_URL` and `DIRECT_URL` configured
- [ ] `JWT_SECRET` set to a random secure value
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] `NODE_ENV` set to `"production"`
- [ ] Prisma migrations applied
- [ ] Database seeded
- [ ] Build completed without errors
- [ ] Site accessible via domain

## Post-Deployment Verification

```bash
# Check that the app is running
curl -I https://your-domain.com/ar/login

# Check the API health
curl https://your-domain.com/api/health
```

## Troubleshooting

- **Build fails**: Ensure Node.js version is 20+ and all dependencies are installed.
- **Database connection error**: Verify `DATABASE_URL` is correct and the database is accessible from the server.
- **Prisma migrate fails**: Check that the database user has sufficient permissions (CREATE TABLE, ALTER, etc.).
- **Blank page**: Check the browser console for errors and verify `NEXT_PUBLIC_APP_URL` is correct.

## Production Domain

Replace: `https://your-domain.com`

With your actual domain once available.
