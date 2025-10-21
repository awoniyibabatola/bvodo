# 🚀 Corporate Travel Platform - Quick Start Guide

This guide will get you from zero to running in **15 minutes**.

## ✅ What's Already Done

I've set up the complete project structure for you:

### ✨ Project Structure
- Complete folder architecture
- Documentation (README, guides, specs)
- Docker configuration
- Git configuration

### 🗄️ Database (Neon PostgreSQL)
- **Prisma schema** with 4 core tables (organizations, users, bookings, credit_transactions)
- All relationships and indexes defined
- Neon-optimized configuration

### 🔧 Backend Setup
- TypeScript configuration
- Package.json with all dependencies
- Express app structure
- Database client
- Environment validation
- Logger utility
- Error handling middleware
- Server entry point

### 🎨 Frontend Setup
- Next.js 14 package configuration
- Environment template
- Ready for shadcn/ui installation

---

## 🏃 Quick Start (15 Minutes)

### Step 1: Get Neon Database (5 min)

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up for free account
3. Create a new project: "Corporate Travel Platform"
4. Copy the connection string (it looks like this):
   ```
   postgresql://username:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 2: Set Up Backend (5 min)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your Neon connection string
# Replace the DATABASE_URL and DIRECT_URL with your Neon connection string

# Generate a secure JWT secret (run this command)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy the output and paste it as JWT_SECRET in .env

# Generate Prisma client
npx prisma generate

# Push schema to Neon database
npx prisma db push

# Start development server
npm run dev
```

You should see:
```
✅ Database connected successfully
🚀 Server running on port 5000
📝 Environment: development
🔗 API: http://localhost:5000/api/v1
```

### Step 3: Verify Backend (1 min)

Open your browser or use curl:
```bash
curl http://localhost:5000/health
```

You should get:
```json
{
  "status": "ok",
  "timestamp": "2024-10-17T12:00:00.000Z",
  "environment": "development"
}
```

### Step 4: Set Up Frontend (4 min)

Open a **new terminal**:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# No need to edit - defaults are good for development

# Start development server
npm run dev
```

You should see:
```
ready - started server on 0.0.0.0:3000
```

---

## 🎉 You're Ready!

- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:3000
- **Database**: Your Neon database is connected

---

## 📋 What's Next? Build Your First Feature!

### Option 1: Start with Authentication (Recommended)

Create the auth service to handle user login/register:

```typescript
// backend/src/services/auth.service.ts
import { prisma } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export class AuthService {
  async register(email: string, password: string, organizationId: string) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        organizationId,
        // ... other fields
      },
    });

    return this.generateTokens(user);
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new Error('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  private generateTokens(user: any) {
    const token = jwt.sign(
      { id: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return { token, user };
  }
}

export const authService = new AuthService();
```

### Option 2: Explore the Database

Use Prisma Studio to see your database:

```bash
cd backend
npx prisma studio
```

This opens a GUI at http://localhost:5555 where you can:
- View all tables
- Add test data
- Explore relationships

### Option 3: Create Your First Organization

Use Prisma Client in a script:

```typescript
// backend/src/scripts/seed.ts
import { prisma } from '../config/database';

async function main() {
  const org = await prisma.organization.create({
    data: {
      name: 'Demo Corporation',
      subdomain: 'democorp',
      email: 'admin@democorp.com',
      availableCredits: 10000,
    },
  });

  console.log('Created organization:', org);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run it:
```bash
npx ts-node src/scripts/seed.ts
```

---

## 🛠️ Development Workflow

### Backend Development

```bash
# Watch mode (auto-reload on changes)
npm run dev

# Type checking
npm run type-check

# Lint code
npm run lint

# Run tests (when you add them)
npm test
```

### Frontend Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Database Operations

```bash
# View database in GUI
npx prisma studio

# Create a migration
npx prisma migrate dev --name add_new_feature

# Reset database (careful!)
npx prisma migrate reset

# Pull schema from database
npx prisma db pull
```

---

## 📚 Next Steps - Building Features

Follow this order for fastest MVP:

### Week 1: Authentication & Users
1. **Auth endpoints** (register, login, forgot password)
2. **Auth middleware** (JWT validation)
3. **User CRUD** (create, read, update, delete)
4. **Organization setup**

### Week 2: Credit System
1. **Credit service** (add, deduct, track)
2. **Payment integration** (Stripe basic)
3. **Transaction logging**

### Week 3-4: Flight Booking
1. **Amadeus API integration**
2. **Flight search**
3. **Flight booking**
4. **Booking confirmation**

### Week 5-6: Hotel Booking
1. **Booking.com API integration**
2. **Hotel search**
3. **Hotel booking**
4. **Booking confirmation**

### Week 7-8: Approval Workflow
1. **Approval settings**
2. **Approval notifications**
3. **Approve/reject logic**

### Week 9-12: Frontend
1. **Authentication pages**
2. **Dashboards** (admin, manager, traveler)
3. **Booking flows**
4. **Reports**

---

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check your Neon connection string in `.env`
- Make sure it includes `?sslmode=require` at the end
- Verify your Neon project is active

### "Port 5000 already in use"
- Change PORT in `.env`: `PORT=5001`
- Or kill the process: `lsof -ti:5000 | xargs kill`

### "Module not found"
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then `npm install`

### Prisma errors
- Run `npx prisma generate` again
- Make sure DATABASE_URL is correct
- Try `npx prisma db push` instead of migrate for quick testing

---

## 📦 Essential Packages to Install Next

As you build features, install these as needed:

```bash
# JWT and encryption
npm install jsonwebtoken bcryptjs
npm install -D @types/jsonwebtoken @types/bcryptjs

# Validation
npm install zod

# Email
npm install @sendgrid/mail

# PDF generation
npm install pdfkit
npm install -D @types/pdfkit

# File uploads
npm install multer
npm install -D @types/multer

# Payments
npm install stripe

# Amadeus API
npm install amadeus

# Date handling
npm install date-fns
```

---

## 🎯 MVP Feature Checklist

Use this to track your progress:

### Backend
- [ ] Authentication (register, login, logout)
- [ ] User management (CRUD, invite)
- [ ] Organization setup
- [ ] Credit management (add, deduct, track)
- [ ] Flight search (Amadeus)
- [ ] Flight booking
- [ ] Hotel search (Booking.com)
- [ ] Hotel booking
- [ ] Approval workflow
- [ ] Email notifications
- [ ] PDF generation
- [ ] Reports

### Frontend
- [ ] Login/Register pages
- [ ] Admin dashboard
- [ ] Manager dashboard
- [ ] Traveler dashboard
- [ ] Flight search UI
- [ ] Flight booking UI
- [ ] Hotel search UI
- [ ] Hotel booking UI
- [ ] User management UI
- [ ] Credit management UI
- [ ] Approval UI
- [ ] Reports UI

---

## 🎓 Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Express Docs**: https://expressjs.com
- **Neon Docs**: https://neon.tech/docs
- **Your MVP Spec**: See `travel_mvp_spec.md`

---

## 💡 Pro Tips

1. **Use Prisma Studio** - It's amazing for quick database testing
2. **Test APIs with Thunder Client** (VS Code extension) or Postman
3. **Start simple** - Get one feature fully working before moving to next
4. **Commit often** - Small commits are easier to debug
5. **Read the MVP spec** - It has all 297 story points broken down

---

## 🆘 Need Help?

1. Check `IMPLEMENTATION_STATUS.md` for detailed roadmap
2. Check `SETUP_GUIDE.md` for more setup details
3. Check `travel_mvp_spec.md` for feature requirements
4. Create an issue on GitHub

---

**You're all set! Start building! 🚀**

The foundation is solid. Now it's time to implement the business logic and create an amazing product.

Good luck! 💪
