# Corporate Travel Platform for Africa

A comprehensive corporate travel booking and management platform designed specifically for African organizations.

## Overview

This platform enables organizations to:
- Book flights and hotels using pre-loaded travel credits
- Manage team members and their travel allowances
- Implement approval workflows for bookings
- Track and report on travel expenses
- Streamline corporate travel management

## Target Launch

3-4 months MVP (realistic: 6-7 months for full feature set)

## Key Features

### MVP (Version 1.0)
- ✅ User authentication and role-based access (Admin, Manager, Traveler)
- ✅ Organization setup and management
- ✅ Travel credit wallet system (USD)
- ✅ Flight search and booking (Amadeus API)
- ✅ Hotel search and booking (Booking.com API)
- ✅ Single-level approval workflow
- ✅ Dashboard for all user roles
- ✅ Basic reporting and analytics
- ✅ Email notifications
- ✅ PDF generation for tickets and vouchers

### Post-MVP Features
- Mobile native applications
- Multi-currency support
- Ground transportation
- Expense management
- Advanced analytics
- SSO integration
- API access for third parties

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ with App Router
- **UI Library**: React 18+
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Language**: TypeScript

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Authentication**: JWT
- **Caching**: Redis

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Cloud**: AWS (EC2, RDS, S3)
- **Monitoring**: Sentry
- **Email**: SendGrid

### Third-Party Integrations
- **Flights**: Amadeus Self-Service API
- **Hotels**: Booking.com Affiliate API
- **Payments**: Stripe (International) + Paystack (Africa)
- **Maps**: Google Maps API

## Project Structure

```
corporate-travel-platform/
├── frontend/          # Next.js application
├── backend/           # Express API server
├── database/          # Database schemas and migrations
├── docs/              # Documentation
├── shared/            # Shared types and utilities
├── docker/            # Docker configurations
├── scripts/           # Utility scripts
└── .github/           # CI/CD workflows
```

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed structure.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Redis 7+
- Docker and Docker Compose (optional but recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd corporate-travel-platform
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration

   # Frontend
   cp frontend/.env.example frontend/.env.local
   # Edit frontend/.env.local with your configuration
   ```

4. **Set up database**
   ```bash
   cd backend
   npm run db:migrate
   npm run db:seed
   ```

5. **Start development servers**
   ```bash
   # Using Docker Compose (recommended)
   docker-compose up -d

   # Or manually
   # Terminal 1: Backend
   cd backend
   npm run dev

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Docs: http://localhost:5000/api-docs

### Using Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

## Development Workflow

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

# Format code
npm run format

# Type check
npm run type-check
```

### Database Migrations

```bash
cd backend

# Create a new migration
npm run migration:create -- --name=migration_name

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## API Documentation

API documentation is available at `/api-docs` when running the backend server.

For detailed API documentation, see [docs/api/README.md](./docs/api/README.md)

## Deployment

### Staging
```bash
npm run deploy:staging
```

### Production
```bash
npm run deploy:prod
```

See [docs/deployment/](./docs/deployment/) for detailed deployment guides.

## Project Roadmap

### Phase 1: Foundation (Month 1)
- [x] Project setup and structure
- [ ] Authentication system
- [ ] Organization management
- [ ] User management
- [ ] Credit wallet system

### Phase 2: Core Booking (Month 2-3)
- [ ] Flight search and booking
- [ ] Hotel search and booking
- [ ] Amadeus API integration
- [ ] Booking.com API integration
- [ ] PDF generation

### Phase 3: Workflows & Reports (Month 4)
- [ ] Approval workflow
- [ ] Email notifications
- [ ] Reporting dashboard
- [ ] Payment integration (Stripe + Paystack)

### Phase 4: Testing & Launch (Month 5-6)
- [ ] Comprehensive testing
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Beta testing with pilot customers
- [ ] Public launch

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Team

- Product Manager
- UI/UX Designer
- 3 Full-stack Developers
- QA Engineer
- DevOps Engineer (part-time)

## License

This project is proprietary and confidential.

## Support

For support, email support@yourplatform.com or create an issue in this repository.

## Resources

- [MVP Specification](./travel_mvp_spec.md)
- [Project Structure](./PROJECT_STRUCTURE.md)
- [API Documentation](./docs/api/README.md)
- [Architecture Design](./docs/architecture/system-design.md)
- [User Guides](./docs/user-guides/)

## Acknowledgments

- Built for corporate travel in Africa
- Focusing on major African routes and payment methods
- Designed for easy onboarding and use
