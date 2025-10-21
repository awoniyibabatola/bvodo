# Corporate Travel Platform - Setup Guide

## Quick Start (5 Minutes)

This guide will help you set up the entire development environment for the Corporate Travel Platform.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** 9+ (comes with Node.js)
- **PostgreSQL** 15+ ([Download](https://www.postgresql.org/download/))
- **Redis** 7+ ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/downloads))
- **Docker & Docker Compose** (Optional but recommended) ([Download](https://www.docker.com/))

## Installation Options

Choose one of the following installation methods:

### Option 1: Docker (Recommended for Beginners)

This is the easiest way to get started.

```bash
# 1. Navigate to project directory
cd corporate-travel-platform

# 2. Start all services with Docker Compose
docker-compose up -d

# 3. Wait for services to be ready (30-60 seconds)
docker-compose logs -f

# 4. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Database Admin: http://localhost:8080 (pgAdmin)
```

That's it! Skip to the "Verify Installation" section.

---

### Option 2: Manual Setup (For Developers)

For more control over the development environment.

#### Step 1: Clone Repository

```bash
git clone <repository-url>
cd corporate-travel-platform
```

#### Step 2: Set Up Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env file with your configuration
# At minimum, update these:
# - DATABASE_URL
# - JWT_SECRET
# - REDIS_URL

# Create database
createdb travel_platform

# Run database migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed

# Start backend server
npm run dev
```

Backend should now be running on `http://localhost:5000`

#### Step 3: Set Up Frontend

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local file
# At minimum, update:
# NEXT_PUBLIC_API_URL=http://localhost:5000

# Start frontend development server
npm run dev
```

Frontend should now be running on `http://localhost:3000`

#### Step 4: Start Redis (Required)

Open a new terminal window:

```bash
# Start Redis server
redis-server

# Or if using Homebrew (macOS)
brew services start redis
```

---

## Environment Configuration

### Backend Environment Variables

Edit `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/travel_platform

# JWT (Change these!)
JWT_SECRET=your-super-secret-key-min-32-characters-long
JWT_EXPIRES_IN=24h

# Redis
REDIS_URL=redis://localhost:6379

# Email (Optional for development)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Payments (Optional for development)
STRIPE_SECRET_KEY=sk_test_your-stripe-key
PAYSTACK_SECRET_KEY=sk_test_your-paystack-key

# APIs (Required for booking features)
AMADEUS_CLIENT_ID=your-amadeus-client-id
AMADEUS_CLIENT_SECRET=your-amadeus-client-secret
BOOKING_COM_API_KEY=your-booking-com-api-key
```

### Frontend Environment Variables

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your-paystack-key
```

---

## Verify Installation

### 1. Check Backend API

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected",
  "redis": "connected"
}
```

### 2. Check Frontend

Open browser to `http://localhost:3000`

You should see the landing page.

### 3. Check Database

```bash
# Using psql
psql -d travel_platform -c "SELECT COUNT(*) FROM organizations;"

# Or using Prisma Studio
cd backend
npx prisma studio
```

---

## Default Accounts (Development Only)

After running `npm run db:seed`, you'll have these test accounts:

### Admin Account
- **Email**: admin@democorp.com
- **Password**: Admin123!
- **Role**: Admin
- **Credits**: 10,000 USD

### Manager Account
- **Email**: manager@democorp.com
- **Password**: Manager123!
- **Role**: Manager

### Traveler Account
- **Email**: traveler@democorp.com
- **Password**: Traveler123!
- **Role**: Traveler
- **Credit Limit**: 5,000 USD

**Organization Subdomain**: democorp

---

## Common Issues & Solutions

### Issue 1: Database Connection Failed

**Error**: `Cannot connect to database`

**Solution**:
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
# macOS (Homebrew)
brew services start postgresql@15

# Linux
sudo systemctl start postgresql

# Windows
# Use Services app to start PostgreSQL service
```

### Issue 2: Redis Connection Failed

**Error**: `Redis connection refused`

**Solution**:
```bash
# Check if Redis is running
redis-cli ping

# Start Redis
# macOS (Homebrew)
brew services start redis

# Linux
sudo systemctl start redis

# Windows
# Use Redis Windows installer or WSL
```

### Issue 3: Port Already in Use

**Error**: `Port 3000 (or 5000) already in use`

**Solution**:
```bash
# Find process using the port
# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change the port in .env files
```

### Issue 4: npm install fails

**Error**: Various npm errors

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue 5: Docker containers won't start

**Solution**:
```bash
# Stop all containers
docker-compose down

# Remove volumes
docker-compose down -v

# Rebuild and restart
docker-compose up -d --build
```

---

## Development Workflow

### Starting Development

```bash
# Using Docker
docker-compose up -d

# Or manually
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Redis (if not using Docker)
redis-server
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# E2E tests
npm run test:e2e
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run type-check
```

### Database Operations

```bash
cd backend

# Create migration
npx prisma migrate dev --name add_new_field

# Apply migrations
npx prisma migrate deploy

# Reset database (development only!)
npx prisma migrate reset

# Open database GUI
npx prisma studio
```

---

## API Documentation

Once the backend is running, access API documentation at:

- **Swagger UI**: http://localhost:5000/api-docs
- **OpenAPI JSON**: http://localhost:5000/api-docs.json

---

## Next Steps

Now that your development environment is set up:

1. **Read the documentation**
   - [Project Structure](./PROJECT_STRUCTURE.md)
   - [MVP Specification](./travel_mvp_spec.md)
   - [Database Schema](./database/README.md)

2. **Explore the codebase**
   - Review the folder structure
   - Check out example components
   - Read code comments

3. **Start developing**
   - Pick a user story from the MVP spec
   - Create a feature branch
   - Implement the feature
   - Write tests
   - Submit a PR

4. **Set up integrations** (when ready)
   - Amadeus API for flights
   - Booking.com API for hotels
   - Stripe for payments
   - SendGrid for emails

---

## Useful Commands

### Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart [service-name]

# Rebuild services
docker-compose up -d --build

# Execute command in container
docker-compose exec backend sh
docker-compose exec frontend sh

# View running containers
docker-compose ps
```

### Database Commands

```bash
# Connect to database
psql -d travel_platform

# Dump database
pg_dump travel_platform > backup.sql

# Restore database
psql travel_platform < backup.sql

# Drop and recreate database
dropdb travel_platform
createdb travel_platform
```

### Git Commands

```bash
# Create feature branch
git checkout -b feature/booking-flow

# Commit changes
git add .
git commit -m "feat: implement flight booking flow"

# Push to remote
git push origin feature/booking-flow

# Pull latest changes
git pull origin main
```

---

## Getting Help

- **Documentation**: Check the `docs/` folder
- **Issues**: Create an issue on GitHub
- **Team Chat**: [Your team communication channel]
- **Email**: dev-support@yourcompany.com

---

## Production Deployment

For production deployment instructions, see:
- [AWS Deployment Guide](./docs/deployment/aws-setup.md)
- [Docker Production Setup](./docs/deployment/docker-setup.md)
- [CI/CD Setup](./docs/deployment/ci-cd.md)

**Note**: Never use development credentials in production!

---

## Summary Checklist

Before you start developing, ensure:

- [ ] All services are running (backend, frontend, database, redis)
- [ ] Database is migrated and seeded
- [ ] Environment variables are configured
- [ ] You can log in with test accounts
- [ ] Tests pass (`npm test`)
- [ ] API documentation is accessible
- [ ] You've read the MVP specification
- [ ] Git is configured with your details

---

Happy coding! 🚀
