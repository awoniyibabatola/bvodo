# Database Environment Separation Guide

## Overview

This guide explains how to set up and manage separate databases for **development/testing** and **production** environments in the bvodo travel platform.

## Current Setup

### Development Database
- **Provider:** Neon (PostgreSQL)
- **Database Name:** `neondb`
- **Purpose:** Local development and testing
- **Location:** Already configured in `.env.development`
- **Status:** ✅ Currently in use

### Production Database
- **Provider:** Neon (PostgreSQL) - Recommended
- **Database Name:** `bvodo_production` (to be created)
- **Purpose:** Live production data
- **Location:** Configured in `.env.production` (placeholders)
- **Status:** ⚠️ Needs to be created

---

## Step-by-Step Setup

### 1. Create Production Database

#### Option A: Using Neon (Recommended)

1. **Go to Neon Dashboard:** https://neon.tech
2. **Create New Project:**
   - Click "New Project"
   - Name: `bvodo-production`
   - Region: Choose closest to your users (e.g., US East, EU West)
   - PostgreSQL version: 15 or latest
3. **Get Connection Strings:**
   - After creation, copy the **Pooled connection string** (for DATABASE_URL)
   - Copy the **Direct connection string** (for DIRECT_URL)
4. **Update `.env.production`:**
   ```bash
   DATABASE_URL=postgresql://[user]:[password]@[host]/bvodo_production?sslmode=require&channel_binding=require
   DIRECT_URL=postgresql://[user]:[password]@[host]/bvodo_production?sslmode=require&channel_binding=require
   ```

#### Option B: Using Other PostgreSQL Providers

**Alternatives:**
- **Railway:** https://railway.app
- **Supabase:** https://supabase.com
- **AWS RDS:** https://aws.amazon.com/rds/postgresql/
- **Heroku Postgres:** https://www.heroku.com/postgres
- **DigitalOcean Managed Databases:** https://www.digitalocean.com/products/managed-databases

Follow their documentation to get connection strings.

---

### 2. Run Database Migrations

#### For Development (Local Testing)

```bash
# Navigate to backend
cd backend

# Use development environment
cp .env.development .env

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed with test data
npm run seed
```

#### For Production (First Time Setup)

```bash
# Navigate to backend
cd backend

# Use production environment
cp .env.production .env

# IMPORTANT: Update .env with actual production database credentials!

# Generate Prisma Client
npx prisma generate

# Run migrations to create tables
npx prisma migrate deploy

# Create initial super admin user
npm run create-admin
```

---

### 3. Environment File Management

#### Development Workflow

```bash
# Use this for local development
cp backend/.env.development backend/.env
```

#### Production Deployment

```bash
# Use this when deploying to production
cp backend/.env.production backend/.env
```

**⚠️ CRITICAL SECURITY NOTES:**
- **NEVER** commit `.env`, `.env.production`, or `.env.development` to Git
- Add them to `.gitignore` (already done)
- Use environment variables in your hosting platform (Vercel, Railway, AWS, etc.)
- Rotate all secrets regularly

---

## Database Migration Strategy

### Development to Production Migration

When you're ready to deploy to production for the first time:

1. **Backup Development Data (Optional):**
   ```bash
   # Export development data if needed
   npx prisma db pull
   ```

2. **Apply Schema to Production:**
   ```bash
   # Switch to production environment
   cp .env.production .env

   # Run migrations
   npx prisma migrate deploy
   ```

3. **Create Initial Admin User:**
   ```bash
   npm run create-admin
   ```

4. **Verify Tables:**
   ```bash
   npx prisma studio
   ```
   This opens a GUI to view your production database.

---

## Ongoing Development Workflow

### Making Schema Changes

1. **Always develop on the development database first:**
   ```bash
   cp .env.development .env
   ```

2. **Create migration:**
   ```bash
   npx prisma migrate dev --name descriptive_migration_name
   ```

3. **Test thoroughly in development**

4. **Deploy to production:**
   ```bash
   # Switch to production
   cp .env.production .env

   # Apply migration
   npx prisma migrate deploy
   ```

---

## NPM Scripts for Environment Management

### Updated package.json Scripts

```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "dev:prod-env": "NODE_ENV=production nodemon src/server.ts",

    "build": "tsc",
    "start": "node dist/server.js",

    "migrate:dev": "dotenv -e .env.development -- npx prisma migrate dev",
    "migrate:prod": "dotenv -e .env.production -- npx prisma migrate deploy",

    "db:push:dev": "dotenv -e .env.development -- npx prisma db push",
    "db:push:prod": "dotenv -e .env.production -- npx prisma db push",

    "prisma:generate": "npx prisma generate",
    "prisma:studio:dev": "dotenv -e .env.development -- npx prisma studio",
    "prisma:studio:prod": "dotenv -e .env.production -- npx prisma studio",

    "seed:dev": "dotenv -e .env.development -- ts-node prisma/seed.ts",
    "seed:prod": "dotenv -e .env.production -- ts-node prisma/seed.ts"
  }
}
```

**Note:** You'll need to install `dotenv-cli`:
```bash
npm install --save-dev dotenv-cli
```

---

## Security Checklist for Production

### Before Going Live:

- [ ] Create new production database on Neon
- [ ] Generate new JWT secrets using: `openssl rand -base64 64`
- [ ] Update all API keys to production versions:
  - [ ] Stripe (change from `sk_test_` to `sk_live_`)
  - [ ] Paystack (change from `sk_test_` to `sk_live_`)
  - [ ] SendGrid (production API key)
  - [ ] Amadeus (verify production credentials)
  - [ ] Google Maps (production key with domain restrictions)
  - [ ] AWS S3 (separate production bucket)
- [ ] Set up production Redis (Redis Cloud, Upstash, AWS ElastiCache)
- [ ] Configure Sentry for error tracking
- [ ] Update CORS_ORIGIN to production domain
- [ ] Update FRONTEND_URL and BACKEND_URL to production domains
- [ ] Enable SSL/TLS for database connections
- [ ] Set up automated database backups on Neon
- [ ] Test all API integrations in production

---

## Monitoring & Backups

### Neon Database Backups

Neon provides:
- **Automatic backups:** Point-in-time recovery up to 7 days (free tier) or 30 days (paid)
- **Manual backups:** Can create branches for testing

### Recommended Backup Strategy

1. **Enable automatic backups on Neon (default)**
2. **Create weekly manual backups:**
   ```bash
   # Export schema and data
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```
3. **Store backups in S3 or similar**

---

## Troubleshooting

### Issue: "Can't reach database server"

**Solution:**
- Verify DATABASE_URL is correct
- Check if IP is whitelisted (Neon allows all by default)
- Ensure `sslmode=require` is in connection string

### Issue: "Prisma schema and database are out of sync"

**Solution:**
```bash
npx prisma migrate deploy
```

### Issue: "Environment variable not found"

**Solution:**
- Verify `.env` file exists in `backend/` directory
- Check all required variables are set
- Restart the server after changes

---

## Quick Reference

### Switch to Development
```bash
cd backend
cp .env.development .env
npm run dev
```

### Switch to Production (Local Testing)
```bash
cd backend
cp .env.production .env
npm run dev:prod-env
```

### View Database Data
```bash
# Development
npm run prisma:studio:dev

# Production
npm run prisma:studio:prod
```

---

## Environment Variables Summary

| Variable | Development | Production |
|----------|-------------|------------|
| NODE_ENV | development | production |
| DATABASE_URL | Neon dev database | Neon production database |
| JWT_SECRET | Test secret | Secure random string |
| STRIPE_SECRET_KEY | sk_test_... | sk_live_... |
| PAYSTACK_SECRET_KEY | sk_test_... | sk_live_... |
| FRONTEND_URL | http://localhost:3000 | https://app.bvodo.com |
| BACKEND_URL | http://localhost:5000 | https://api.bvodo.com |
| LOG_LEVEL | debug | info |
| RATE_LIMIT_MAX_REQUESTS | 1000 | 100 |

---

## Next Steps

1. ✅ Environment files created (`.env.development`, `.env.production`)
2. ⏳ Create production database on Neon
3. ⏳ Update `.env.production` with real credentials
4. ⏳ Install `dotenv-cli` for NPM scripts
5. ⏳ Update `package.json` with environment-specific scripts
6. ⏳ Run production migrations
7. ⏳ Test production environment locally
8. ⏳ Deploy to hosting platform (Vercel, Railway, AWS, etc.)

---

## Support

For issues or questions:
- **Neon Documentation:** https://neon.tech/docs
- **Prisma Documentation:** https://www.prisma.io/docs
- **Project Issues:** Contact your team lead
