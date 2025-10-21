# Database Documentation

## Overview

This directory contains all database-related files for the Corporate Travel Platform.

## Database: PostgreSQL 15+

## Structure

```
database/
├── schemas/              # Individual table schemas
├── migrations/           # Database migrations
├── seeds/               # Seed data for development
├── init.sql             # Initial database setup
└── README.md            # This file
```

## Tables

### 1. Organizations
Stores company/organization information including credit balance and approval settings.

**Key Fields:**
- `id` - UUID primary key
- `subdomain` - Unique subdomain (e.g., acmecorp)
- `available_credits` - Current credit balance
- `approval_threshold` - Amount requiring approval

### 2. Users
User accounts with role-based access control.

**Roles:**
- `admin` - Full access to organization
- `manager` - Can approve bookings
- `traveler` - Can book travel

**Key Fields:**
- `id` - UUID primary key
- `organization_id` - Foreign key to organizations
- `role` - User role (admin/manager/traveler)
- `credit_limit` - Individual credit allocation
- `approver_id` - Manager who approves bookings

### 3. Bookings
Flight and hotel booking records.

**Booking Types:**
- `flight` - Flight bookings
- `hotel` - Hotel bookings

**Status Flow:**
```
pending → pending_approval → approved → confirmed → completed
                           ↓
                        rejected
                           ↓
                       cancelled
```

**Key Fields:**
- `id` - UUID primary key
- `booking_reference` - Unique booking ref
- `booking_type` - flight or hotel
- `status` - Current booking status
- `passenger_details` - JSONB passenger info

### 4. Credit Transactions
Audit trail for all credit movements.

**Transaction Types:**
- `credit_added` - Credits added to organization
- `credit_deducted` - Credits used for booking
- `credit_held` - Credits on hold (pending approval)
- `credit_released` - Held credits released
- `credit_allocated` - Credits allocated to user
- `credit_refunded` - Credits refunded

## Relationships

```
organizations (1) ─→ (N) users
organizations (1) ─→ (N) bookings
organizations (1) ─→ (N) credit_transactions

users (1) ─→ (N) bookings
users (1) ─→ (N) credit_transactions
users (1) ─→ (N) users (approver relationship)

bookings (1) ─→ (N) credit_transactions
```

## Entity Relationship Diagram

```
┌─────────────────┐
│  Organizations  │
│  ─────────────  │
│  id (PK)        │
│  subdomain      │
│  credits        │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────┴────────────────┐
    │                     │
┌───▼─────────┐      ┌───▼──────────────┐
│   Users     │      │    Bookings      │
│  ─────────  │      │  ──────────────  │
│  id (PK)    │──┐   │  id (PK)         │
│  org_id     │  │   │  org_id (FK)     │
│  role       │  │   │  user_id (FK)    │
│  credits    │  │   │  booking_type    │
└─────────────┘  │   │  status          │
                 │   └──────────────────┘
                 │
                 │ approver
                 └──────┐
                        │
              ┌─────────▼──────────┐
              │ Credit Transactions│
              │  ────────────────  │
              │  id (PK)           │
              │  org_id (FK)       │
              │  user_id (FK)      │
              │  booking_id (FK)   │
              │  type              │
              │  amount            │
              └────────────────────┘
```

## Setup Instructions

### 1. Using Docker (Recommended)

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# The init.sql will run automatically
```

### 2. Manual Setup

```bash
# Create database
createdb travel_platform

# Run initialization script
psql -d travel_platform -f database/init.sql

# Verify tables
psql -d travel_platform -c "\dt"
```

### 3. Using Prisma (For Backend)

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database
npx prisma db seed

# Open Prisma Studio
npx prisma studio
```

## Migrations

Migrations are managed using Prisma Migrate:

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

## Seeding

Sample data for development:

```bash
cd backend
npm run db:seed
```

This creates:
- 1 demo organization
- 3 users (admin, manager, traveler)
- Sample bookings
- Credit transactions

## Backup & Restore

### Backup
```bash
pg_dump -U postgres travel_platform > backup.sql
```

### Restore
```bash
psql -U postgres travel_platform < backup.sql
```

## Indexes

Key indexes for performance:

- `organizations.subdomain` - For subdomain lookup
- `users.email` - For authentication
- `users.organization_id` - For org queries
- `bookings.booking_reference` - For booking lookup
- `bookings.status` - For status filtering
- `bookings.user_id` - For user bookings
- `credit_transactions.organization_id` - For transaction history

## Constraints

### Check Constraints
- Credits must be non-negative
- Booking dates must be valid (future dates)
- Passenger count: 1-9
- Prices must be non-negative

### Foreign Key Constraints
- Users belong to organizations (CASCADE delete)
- Bookings belong to users and organizations
- Transactions reference bookings and users

## JSONB Fields

### bookings.passenger_details
```json
[
  {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1985-05-15",
    "passportNumber": "A12345678",
    "nationality": "Nigerian",
    "email": "john@example.com",
    "phone": "+234123456789"
  }
]
```

### bookings.booking_data
```json
{
  "flight": {
    "airline": "Ethiopian Airlines",
    "flightNumber": "ET901",
    "class": "economy",
    "baggage": "23kg",
    "segments": [...]
  },
  "hotel": {
    "hotelName": "Radisson Blu",
    "roomType": "Deluxe Room",
    "amenities": ["wifi", "breakfast"],
    "checkInTime": "14:00"
  }
}
```

## Performance Considerations

1. **Use indexes** for frequently queried columns
2. **JSONB indexes** for passenger_details and booking_data if needed
3. **Partitioning** for bookings table (by date) when data grows
4. **Archiving** old completed bookings after 2 years
5. **Query optimization** using EXPLAIN ANALYZE

## Security

1. **Row Level Security (RLS)** - Consider implementing for multi-tenancy
2. **Encrypted fields** - Passport numbers should be encrypted
3. **Audit logging** - Track all data changes
4. **Backup strategy** - Daily backups, 30-day retention

## Monitoring

Key metrics to monitor:

- Database size growth
- Query performance (slow query log)
- Connection pool usage
- Index usage statistics
- Lock contention

## Future Enhancements

- [ ] Implement database triggers for credit deduction
- [ ] Add full-text search indexes
- [ ] Implement soft deletes across all tables
- [ ] Add audit log table
- [ ] Implement database-level encryption
- [ ] Add materialized views for reporting
