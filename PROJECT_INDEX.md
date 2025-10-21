# Corporate Travel Platform - Project Index

## 📋 Quick Links

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | Project overview and quick start |
| [SETUP_GUIDE.md](./SETUP_GUIDE.md) | Detailed setup instructions |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Complete file structure and architecture |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines |
| [travel_mvp_spec.md](./travel_mvp_spec.md) | MVP specification and user stories |

## 🎯 Project Overview

**Corporate Travel Platform for Africa** - A comprehensive travel booking and management platform for organizations.

- **Target**: African corporate travel market
- **Timeline**: 6-7 months MVP
- **Tech Stack**: Next.js, Node.js, PostgreSQL, Redis
- **Team Size**: 6-7 people

## 📁 Directory Structure

```
corporate-travel-platform/
├── frontend/              # Next.js application
├── backend/               # Express API server
├── database/              # Database schemas and migrations
├── docs/                  # Documentation
├── shared/                # Shared types
├── docker/                # Docker configs
├── scripts/               # Utility scripts
└── .github/               # CI/CD workflows
```

## 🚀 Quick Start

```bash
# Using Docker (Recommended)
docker-compose up -d

# Manual Setup
1. Setup backend: cd backend && npm install && npm run dev
2. Setup frontend: cd frontend && npm install && npm run dev
3. Access app: http://localhost:3000
```

## 📊 MVP Features (297 Story Points)

### Epic 1: Organization & User Management (23 points)
- Organization registration
- User invitation and management
- Role-based access control (Admin, Manager, Traveler)
- Bulk user import

### Epic 2: Travel Credit Management (19 points)
- Organization credit wallet
- Credit allocation to users
- Payment integration (Stripe, Paystack)
- Transaction history

### Epic 3: Flight Booking (68 points)
- Flight search (Amadeus API)
- Search results with filters
- Booking flow
- E-ticket generation

### Epic 4: Hotel Booking (68 points)
- Hotel search (Booking.com API)
- Search results with filters
- Booking flow
- Voucher generation

### Epic 5: Approval Workflow (34 points)
- Configurable approval settings
- Single-level approval
- Approval notifications
- Approval history

### Epic 6: Dashboard & Reporting (58 points)
- Admin dashboard with metrics
- Traveler dashboard
- Manager dashboard
- Booking reports
- Spend analytics

### Epic 7: Support & Help (10 points)
- FAQ page
- Help documentation
- Contact support form

### Epic 8: Authentication & Security (17 points)
- Email/password authentication
- Password reset
- Profile management
- Session management

## 🗄️ Database Schema

### Core Tables
1. **organizations** - Company information and credit balance
2. **users** - User accounts with role-based access
3. **bookings** - Flight and hotel booking records
4. **credit_transactions** - Audit trail for credits

### Relationships
- Organizations → Users (1:N)
- Organizations → Bookings (1:N)
- Users → Bookings (1:N)
- Bookings → Credit Transactions (1:N)

## 🔧 Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **UI**: React 18, Tailwind CSS, shadcn/ui
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **HTTP**: Axios
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+ (via Prisma ORM)
- **Cache**: Redis
- **Auth**: JWT + bcrypt
- **Validation**: Zod

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Hosting**: AWS (EC2, RDS, S3)
- **Monitoring**: Sentry
- **Email**: SendGrid

### Third-Party APIs
- **Flights**: Amadeus Self-Service API
- **Hotels**: Booking.com Affiliate API
- **Payments**: Stripe (International) + Paystack (Africa)
- **Maps**: Google Maps API

## 📖 Documentation

### Architecture
- [System Design](./docs/architecture/system-design.md)
- [Database Schema](./database/README.md)
- [API Design](./docs/api/README.md)

### API Documentation
- [Authentication API](./docs/api/authentication.md)
- [Users API](./docs/api/users.md)
- [Bookings API](./docs/api/bookings.md)
- [Credits API](./docs/api/credits.md)

### Integrations
- [Amadeus Integration](./docs/integrations/amadeus-integration.md)
- [Booking.com Integration](./docs/integrations/booking-com-integration.md)
- [Stripe Integration](./docs/integrations/stripe-integration.md)
- [Paystack Integration](./docs/integrations/paystack-integration.md)

### Deployment
- [AWS Setup](./docs/deployment/aws-setup.md)
- [Docker Setup](./docs/deployment/docker-setup.md)
- [CI/CD Pipeline](./docs/deployment/ci-cd.md)

### User Guides
- [Admin Guide](./docs/user-guides/admin-guide.md)
- [Manager Guide](./docs/user-guides/manager-guide.md)
- [Traveler Guide](./docs/user-guides/traveler-guide.md)

## 🛠️ Development Workflow

### Local Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Testing
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# E2E tests
npm run test:e2e
```

### Code Quality
```bash
# Lint
npm run lint

# Format
npm run format

# Type check
npm run type-check
```

### Database Operations
```bash
cd backend

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

## 🌐 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
REDIS_URL=redis://...
AMADEUS_CLIENT_ID=...
STRIPE_SECRET_KEY=...
PAYSTACK_SECRET_KEY=...
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=...
```

## 📅 Development Timeline

### Month 1: Foundation
- [x] Project setup
- [ ] Authentication system
- [ ] Organization management
- [ ] User management
- [ ] Credit wallet

### Month 2-3: Core Booking
- [ ] Flight search & booking
- [ ] Hotel search & booking
- [ ] Amadeus integration
- [ ] Booking.com integration
- [ ] PDF generation

### Month 4: Workflows & Reports
- [ ] Approval workflow
- [ ] Email notifications
- [ ] Reporting dashboard
- [ ] Payment integration

### Month 5-6: Testing & Launch
- [ ] Comprehensive testing
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Beta testing
- [ ] Public launch

## 🎯 Success Metrics

### Before Launch
- [ ] 5 test organizations
- [ ] 50+ successful test bookings
- [ ] Zero critical bugs
- [ ] Payment processing tested

### After Launch (First 3 Months)
- [ ] 20+ paying organizations
- [ ] $50,000+ in booking volume
- [ ] 200+ bookings completed
- [ ] 90%+ booking success rate
- [ ] Customer satisfaction >4/5

## 👥 Team Roles

- **Product Manager** - Product strategy and roadmap
- **UI/UX Designer** - User interface and experience
- **3 Full-stack Developers** - Feature development
- **QA Engineer** - Testing and quality assurance
- **DevOps Engineer** (part-time) - Infrastructure and deployment

## 📝 Key Files Reference

### Configuration Files
- `docker-compose.yml` - Docker services configuration
- `backend/package.json` - Backend dependencies
- `frontend/package.json` - Frontend dependencies
- `backend/.env.example` - Backend environment template
- `frontend/.env.example` - Frontend environment template
- `.gitignore` - Git ignore patterns

### Database Files
- `database/init.sql` - Database initialization
- `database/schemas/` - Individual table schemas
- `database/migrations/` - Database migrations
- `database/seeds/` - Seed data

### Documentation Files
- `README.md` - Project overview
- `SETUP_GUIDE.md` - Setup instructions
- `PROJECT_STRUCTURE.md` - File structure
- `CONTRIBUTING.md` - Contribution guide
- `travel_mvp_spec.md` - MVP specification

## 🔗 Useful Links

- **Repository**: [GitHub Repo URL]
- **Project Board**: [Project Management Tool]
- **Design Files**: [Figma/Design Tool]
- **API Docs**: http://localhost:5000/api-docs (when running)
- **Staging Environment**: [Staging URL]
- **Production**: [Production URL]

## 💡 Common Tasks

### Create a new feature branch
```bash
git checkout -b feature/feature-name
```

### Run database migrations
```bash
cd backend
npm run db:migrate
```

### Generate Prisma client
```bash
cd backend
npx prisma generate
```

### Build for production
```bash
npm run build
```

### Deploy to staging
```bash
npm run deploy:staging
```

## 🐛 Troubleshooting

### Database connection issues
```bash
# Check PostgreSQL status
pg_isready

# Restart PostgreSQL
docker-compose restart postgres
```

### Redis connection issues
```bash
# Check Redis status
redis-cli ping

# Restart Redis
docker-compose restart redis
```

### Port conflicts
```bash
# Check port usage
lsof -i :3000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### Clean install
```bash
# Remove all dependencies
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

## 📞 Support

- **Issues**: Create issue on GitHub
- **Email**: dev-support@yourcompany.com
- **Slack**: #corporate-travel-dev
- **Documentation**: [Docs URL]

## 📄 License

Proprietary and Confidential

---

**Last Updated**: 2024-01-15
**Project Status**: Setup Complete ✅
**Next Phase**: Begin Development Sprint 1
