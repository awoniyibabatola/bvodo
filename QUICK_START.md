# Quick Start Guide - Environment Setup

## For Developers (Local Development)

### First Time Setup

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up development environment:**
   ```bash
   # Copy development environment file
   npm run env:use-dev

   # Or manually:
   cp .env.development .env
   ```

3. **Initialize database:**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Run migrations
   npm run db:migrate:dev

   # (Optional) Seed with test data
   npm run db:seed:dev
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Start frontend (in a new terminal):**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Daily Development Workflow

```bash
# Start backend (Terminal 1)
cd backend
npm run dev

# Start frontend (Terminal 2)
cd frontend
npm run dev
```

Access the app at: http://localhost:3000

---

## For DevOps/Deployment (Production)

### Prerequisites

1. Create a new production database on Neon: https://neon.tech
2. Get all production API keys ready
3. Generate secure secrets: `openssl rand -base64 64`

### Production Setup

1. **Update production environment file:**
   ```bash
   cd backend
   # Edit .env.production with your production credentials
   ```

2. **Set production environment:**
   ```bash
   npm run env:use-prod
   ```

3. **Run production migrations:**
   ```bash
   npm run db:migrate:production
   ```

4. **Build the application:**
   ```bash
   npm run build
   ```

5. **Start production server:**
   ```bash
   npm start
   ```

---

## Useful NPM Scripts

### Environment Management

| Command | Description |
|---------|-------------|
| `npm run env:use-dev` | Switch to development environment |
| `npm run env:use-prod` | Switch to production environment |

### Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (uses current .env) |
| `npm run dev:prod-env` | Test with production env locally |

### Database - Development

| Command | Description |
|---------|-------------|
| `npm run db:migrate:dev` | Create and apply new migration (dev) |
| `npm run db:push:dev` | Push schema changes without migration (dev) |
| `npm run db:seed:dev` | Seed development database with test data |
| `npm run db:studio:dev` | Open Prisma Studio for dev database |

### Database - Production

| Command | Description |
|---------|-------------|
| `npm run db:migrate:production` | Apply migrations to production database |
| `npm run db:push:prod` | Push schema to production (use with caution!) |
| `npm run db:seed:prod` | Seed production database |
| `npm run db:studio:prod` | Open Prisma Studio for production database |

### General Database

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:studio` | Open Prisma Studio (uses current .env) |

---

## Environment Files Overview

- **`.env.development`** - Development/testing database and API keys
- **`.env.production`** - Production database and live API keys
- **`.env`** - Active environment (DO NOT commit to Git)
- **`.env.example`** - Template for new developers

---

## Switching Between Environments

### To Development:
```bash
cd backend
npm run env:use-dev
npm run dev
```

### To Production (for testing):
```bash
cd backend
npm run env:use-prod
npm run dev:prod-env
```

---

## Database Migration Workflow

### Creating a New Migration (Development)

1. **Make changes to `prisma/schema.prisma`**

2. **Create migration:**
   ```bash
   npm run db:migrate:dev
   # Enter migration name when prompted (e.g., "add_user_preferences")
   ```

3. **Test thoroughly in development**

4. **Commit migration files to Git:**
   ```bash
   git add prisma/migrations
   git commit -m "Add migration: add_user_preferences"
   ```

### Applying Migrations to Production

1. **Switch to production environment:**
   ```bash
   npm run env:use-prod
   ```

2. **Apply migrations:**
   ```bash
   npm run db:migrate:production
   ```

3. **Verify in Prisma Studio:**
   ```bash
   npm run db:studio:prod
   ```

---

## Troubleshooting

### "Cannot find module .env"
**Solution:** Run `npm run env:use-dev` to copy the development environment file.

### "Prisma schema and database are out of sync"
**Solution:**
```bash
npm run db:migrate:dev
```

### "Environment variable not found"
**Solution:** Check that `.env` exists and all required variables are set. Compare with `.env.example`.

### Wrong database showing up
**Solution:**
```bash
# Verify which environment is active
cat .env | grep DATABASE_URL

# Switch to correct environment
npm run env:use-dev  # or env:use-prod
```

---

## Security Checklist

- [ ] `.env`, `.env.development`, and `.env.production` are in `.gitignore`
- [ ] Never commit API keys or secrets to Git
- [ ] Use different API keys for development and production
- [ ] Production JWT secrets are cryptographically random
- [ ] Production database has separate credentials from development
- [ ] CORS is configured to only allow your production domain
- [ ] Rate limiting is enabled and appropriate for environment

---

## Getting Help

- **Full documentation:** See `DATABASE_SETUP.md`
- **Environment variables:** Check `.env.example` for all options
- **Database issues:** See Neon dashboard at https://neon.tech
- **Prisma issues:** https://www.prisma.io/docs

---

## Common Tasks

### View Database Data
```bash
# Development
npm run db:studio:dev

# Production
npm run db:studio:prod
```

### Reset Development Database
```bash
npm run env:use-dev
npx prisma migrate reset
npm run db:seed:dev
```

### Check Current Environment
```bash
cat .env | grep NODE_ENV
cat .env | grep DATABASE_URL
```

### Generate New JWT Secret
```bash
openssl rand -base64 64
```

---

## Next Steps

1. Read `DATABASE_SETUP.md` for comprehensive database management guide
2. Configure your hosting platform environment variables
3. Set up CI/CD pipeline
4. Configure production monitoring and logging
