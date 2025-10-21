# Corporate Travel Platform - Project Structure

## Root Directory Layout

```
corporate-travel-platform/
├── frontend/                      # Next.js/React application
├── backend/                       # Node.js/Express API
├── database/                      # Database schemas and migrations
├── docs/                          # Project documentation
├── shared/                        # Shared types and utilities
├── docker/                        # Docker configuration files
├── .github/                       # GitHub Actions workflows
├── scripts/                       # Utility scripts
├── docker-compose.yml             # Docker compose configuration
├── .gitignore                     # Git ignore file
├── README.md                      # Project README
└── travel_mvp_spec.md            # MVP specification (existing)
```

## Frontend Structure (`/frontend`)

```
frontend/
├── public/                        # Static assets
│   ├── images/
│   ├── icons/
│   └── favicon.ico
├── src/
│   ├── app/                       # Next.js 14+ app directory
│   │   ├── (auth)/               # Authentication routes group
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── reset-password/
│   │   ├── (dashboard)/          # Main application routes
│   │   │   ├── admin/            # Admin dashboard
│   │   │   │   ├── dashboard/
│   │   │   │   ├── users/
│   │   │   │   ├── credits/
│   │   │   │   ├── bookings/
│   │   │   │   └── reports/
│   │   │   ├── manager/          # Manager dashboard
│   │   │   │   ├── dashboard/
│   │   │   │   ├── approvals/
│   │   │   │   └── team-bookings/
│   │   │   ├── traveler/         # Traveler dashboard
│   │   │   │   ├── dashboard/
│   │   │   │   ├── my-trips/
│   │   │   │   └── profile/
│   │   │   ├── flights/          # Flight booking flow
│   │   │   │   ├── search/
│   │   │   │   ├── results/
│   │   │   │   ├── details/[id]/
│   │   │   │   └── booking/[id]/
│   │   │   └── hotels/           # Hotel booking flow
│   │   │       ├── search/
│   │   │       ├── results/
│   │   │       ├── details/[id]/
│   │   │       └── booking/[id]/
│   │   ├── help/                 # Help center
│   │   ├── api/                  # API routes (if needed)
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Landing page
│   ├── components/               # Reusable components
│   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   └── ...
│   │   ├── layout/               # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   ├── auth/                 # Authentication components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── bookings/             # Booking-related components
│   │   │   ├── FlightSearchForm.tsx
│   │   │   ├── FlightCard.tsx
│   │   │   ├── HotelSearchForm.tsx
│   │   │   ├── HotelCard.tsx
│   │   │   ├── PassengerForm.tsx
│   │   │   └── BookingConfirmation.tsx
│   │   ├── dashboard/            # Dashboard components
│   │   │   ├── MetricCard.tsx
│   │   │   ├── RecentBookings.tsx
│   │   │   ├── SpendChart.tsx
│   │   │   └── CreditBalance.tsx
│   │   └── common/               # Common components
│   │       ├── DatePicker.tsx
│   │       ├── AirportSelector.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── ErrorBoundary.tsx
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useBooking.ts
│   │   ├── useCredits.ts
│   │   └── useDebounce.ts
│   ├── lib/                      # Utility libraries
│   │   ├── api.ts               # API client
│   │   ├── auth.ts              # Auth utilities
│   │   ├── utils.ts             # General utilities
│   │   └── validators.ts        # Form validators
│   ├── store/                    # State management (Zustand)
│   │   ├── authStore.ts
│   │   ├── bookingStore.ts
│   │   ├── creditStore.ts
│   │   └── userStore.ts
│   ├── types/                    # TypeScript types
│   │   ├── user.ts
│   │   ├── booking.ts
│   │   ├── flight.ts
│   │   ├── hotel.ts
│   │   └── credit.ts
│   ├── constants/                # Constants and configs
│   │   ├── routes.ts
│   │   ├── roles.ts
│   │   └── config.ts
│   └── styles/                   # Global styles
│       └── globals.css
├── .env.local                    # Environment variables (local)
├── .env.example                  # Example environment variables
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies
```

## Backend Structure (`/backend`)

```
backend/
├── src/
│   ├── config/                   # Configuration
│   │   ├── database.ts
│   │   ├── env.ts
│   │   ├── amadeus.ts
│   │   ├── stripe.ts
│   │   └── email.ts
│   ├── controllers/              # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── organization.controller.ts
│   │   ├── credit.controller.ts
│   │   ├── flight.controller.ts
│   │   ├── hotel.controller.ts
│   │   ├── booking.controller.ts
│   │   ├── approval.controller.ts
│   │   └── report.controller.ts
│   ├── routes/                   # API routes
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── organization.routes.ts
│   │   ├── credit.routes.ts
│   │   ├── flight.routes.ts
│   │   ├── hotel.routes.ts
│   │   ├── booking.routes.ts
│   │   ├── approval.routes.ts
│   │   ├── report.routes.ts
│   │   └── index.ts
│   ├── models/                   # Database models (TypeORM/Prisma)
│   │   ├── User.model.ts
│   │   ├── Organization.model.ts
│   │   ├── Credit.model.ts
│   │   ├── Booking.model.ts
│   │   ├── Flight.model.ts
│   │   ├── Hotel.model.ts
│   │   ├── Approval.model.ts
│   │   └── Transaction.model.ts
│   ├── services/                 # Business logic
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── organization.service.ts
│   │   ├── credit.service.ts
│   │   ├── flight.service.ts
│   │   ├── hotel.service.ts
│   │   ├── booking.service.ts
│   │   ├── approval.service.ts
│   │   ├── email.service.ts
│   │   ├── pdf.service.ts
│   │   └── report.service.ts
│   ├── integrations/             # Third-party integrations
│   │   ├── amadeus/
│   │   │   ├── amadeus.client.ts
│   │   │   ├── flight.search.ts
│   │   │   └── flight.booking.ts
│   │   ├── booking-com/
│   │   │   ├── booking.client.ts
│   │   │   ├── hotel.search.ts
│   │   │   └── hotel.booking.ts
│   │   ├── stripe/
│   │   │   ├── stripe.client.ts
│   │   │   └── payment.handler.ts
│   │   ├── paystack/
│   │   │   ├── paystack.client.ts
│   │   │   └── payment.handler.ts
│   │   └── sendgrid/
│   │       ├── email.client.ts
│   │       └── templates/
│   ├── middleware/               # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── rate-limit.middleware.ts
│   ├── validators/               # Request validators
│   │   ├── auth.validator.ts
│   │   ├── user.validator.ts
│   │   ├── booking.validator.ts
│   │   └── credit.validator.ts
│   ├── utils/                    # Utility functions
│   │   ├── logger.ts
│   │   ├── jwt.ts
│   │   ├── encryption.ts
│   │   ├── helpers.ts
│   │   └── constants.ts
│   ├── types/                    # TypeScript types
│   │   ├── express.d.ts
│   │   ├── user.types.ts
│   │   ├── booking.types.ts
│   │   └── api.types.ts
│   ├── jobs/                     # Background jobs
│   │   ├── email.job.ts
│   │   ├── booking-confirmation.job.ts
│   │   └── low-balance-alert.job.ts
│   ├── database/                 # Database related
│   │   ├── migrations/
│   │   ├── seeders/
│   │   └── connection.ts
│   ├── app.ts                    # Express app setup
│   └── server.ts                 # Server entry point
├── tests/                        # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env                          # Environment variables
├── .env.example                  # Example environment variables
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies
└── nodemon.json                  # Nodemon configuration
```

## Database Structure (`/database`)

```
database/
├── schemas/
│   ├── organizations.sql
│   ├── users.sql
│   ├── credits.sql
│   ├── bookings.sql
│   ├── flights.sql
│   ├── hotels.sql
│   ├── approvals.sql
│   └── transactions.sql
├── migrations/
│   ├── 001_create_organizations.sql
│   ├── 002_create_users.sql
│   ├── 003_create_credits.sql
│   ├── 004_create_bookings.sql
│   └── ...
├── seeds/
│   ├── organizations.seed.sql
│   ├── users.seed.sql
│   └── test-data.seed.sql
├── erd/
│   └── database-diagram.png
└── README.md
```

## Shared Types (`/shared`)

```
shared/
├── types/
│   ├── user.types.ts
│   ├── organization.types.ts
│   ├── booking.types.ts
│   ├── flight.types.ts
│   ├── hotel.types.ts
│   ├── credit.types.ts
│   └── api.types.ts
├── constants/
│   ├── roles.ts
│   ├── statuses.ts
│   └── enums.ts
└── utils/
    ├── validation.ts
    └── formatting.ts
```

## Documentation (`/docs`)

```
docs/
├── api/
│   ├── README.md
│   ├── authentication.md
│   ├── users.md
│   ├── bookings.md
│   ├── flights.md
│   ├── hotels.md
│   └── credits.md
├── architecture/
│   ├── system-design.md
│   ├── database-schema.md
│   ├── api-design.md
│   └── security.md
├── deployment/
│   ├── aws-setup.md
│   ├── docker-setup.md
│   └── ci-cd.md
├── integrations/
│   ├── amadeus-integration.md
│   ├── booking-com-integration.md
│   ├── stripe-integration.md
│   └── paystack-integration.md
├── user-guides/
│   ├── admin-guide.md
│   ├── manager-guide.md
│   └── traveler-guide.md
└── development/
    ├── getting-started.md
    ├── coding-standards.md
    └── testing-guide.md
```

## Docker Configuration (`/docker`)

```
docker/
├── frontend/
│   └── Dockerfile
├── backend/
│   └── Dockerfile
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf
└── postgres/
    └── init.sql
```

## Scripts (`/scripts`)

```
scripts/
├── setup/
│   ├── install-deps.sh
│   └── setup-env.sh
├── database/
│   ├── migrate.sh
│   ├── seed.sh
│   └── backup.sh
├── deployment/
│   ├── deploy-dev.sh
│   ├── deploy-staging.sh
│   └── deploy-prod.sh
└── utils/
    ├── generate-types.sh
    └── clean.sh
```

## GitHub Actions (`.github/workflows`)

```
.github/
├── workflows/
│   ├── ci.yml                   # Continuous Integration
│   ├── cd.yml                   # Continuous Deployment
│   ├── tests.yml                # Run tests
│   └── lint.yml                 # Linting
└── ISSUE_TEMPLATE/
    ├── bug_report.md
    └── feature_request.md
```

## Root Configuration Files

```
corporate-travel-platform/
├── docker-compose.yml           # Docker services orchestration
├── docker-compose.dev.yml       # Development override
├── docker-compose.prod.yml      # Production override
├── .gitignore                   # Git ignore patterns
├── .prettierrc                  # Prettier configuration
├── .eslintrc.json              # ESLint configuration
├── README.md                    # Project overview
├── LICENSE                      # License file
└── CONTRIBUTING.md             # Contribution guidelines
```

## Environment Variables

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Backend (`.env`)
```
# Server
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/travel_platform
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=travel_platform
DATABASE_USER=postgres
DATABASE_PASSWORD=password

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Amadeus API
AMADEUS_CLIENT_ID=your-client-id
AMADEUS_CLIENT_SECRET=your-client-secret
AMADEUS_API_URL=https://test.api.amadeus.com

# Booking.com API
BOOKING_COM_API_KEY=your-api-key
BOOKING_COM_API_URL=https://api.booking.com

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Paystack
PAYSTACK_SECRET_KEY=sk_test_xxx
PAYSTACK_PUBLIC_KEY=pk_test_xxx

# Email (SendGrid)
SENDGRID_API_KEY=your-api-key
FROM_EMAIL=noreply@yourdomain.com

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=travel-platform-uploads

# Redis (for caching/sessions)
REDIS_URL=redis://localhost:6379

# Sentry
SENTRY_DSN=https://xxx@sentry.io/xxx

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

## Technology Stack Summary

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **UI Library**: React 18+
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Date Handling**: date-fns
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **ORM**: Prisma or TypeORM
- **Validation**: Joi or Zod
- **Authentication**: JWT + bcrypt
- **File Upload**: Multer
- **PDF Generation**: PDFKit or Puppeteer
- **Job Queue**: Bull (Redis-based)

### Database
- **Primary DB**: PostgreSQL 15+
- **Caching**: Redis
- **Search**: PostgreSQL Full-Text Search (or Elasticsearch later)

### DevOps
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Hosting**: AWS (EC2, RDS, S3) or Digital Ocean
- **Monitoring**: Sentry + CloudWatch
- **Email**: SendGrid
- **CDN**: CloudFlare

### Third-Party APIs
- **Flights**: Amadeus Self-Service API
- **Hotels**: Booking.com Affiliate API or Expedia
- **Payments**: Stripe + Paystack
- **Maps**: Google Maps API

## Development Workflow

1. **Local Development**
   ```bash
   # Clone repository
   git clone <repo-url>
   cd corporate-travel-platform

   # Install dependencies
   npm run install:all

   # Setup environment variables
   cp frontend/.env.example frontend/.env.local
   cp backend/.env.example backend/.env

   # Start services with Docker
   docker-compose up -d

   # Run migrations
   npm run db:migrate

   # Seed database
   npm run db:seed

   # Start development servers
   npm run dev
   ```

2. **Testing**
   ```bash
   # Run all tests
   npm run test

   # Run frontend tests
   npm run test:frontend

   # Run backend tests
   npm run test:backend

   # E2E tests
   npm run test:e2e
   ```

3. **Deployment**
   ```bash
   # Build for production
   npm run build

   # Deploy to staging
   npm run deploy:staging

   # Deploy to production
   npm run deploy:prod
   ```

## Next Steps

1. Initialize Git repository
2. Set up frontend with Next.js
3. Set up backend with Express
4. Configure Docker development environment
5. Create database schemas and migrations
6. Implement authentication system
7. Build first feature (Organization Setup)
8. Set up CI/CD pipeline
