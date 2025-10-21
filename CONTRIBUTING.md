# Contributing to Corporate Travel Platform

Thank you for your interest in contributing to the Corporate Travel Platform! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

- Be respectful and professional
- Accept constructive criticism gracefully
- Focus on what is best for the project
- Show empathy towards other contributors

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/corporate-travel-platform.git
   cd corporate-travel-platform
   ```
3. **Set up development environment**: Follow [SETUP_GUIDE.md](./SETUP_GUIDE.md)
4. **Create a branch** for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Branch Naming Convention

Use descriptive branch names with prefixes:

- `feature/` - New features (e.g., `feature/flight-booking`)
- `fix/` - Bug fixes (e.g., `fix/login-error`)
- `refactor/` - Code refactoring (e.g., `refactor/api-client`)
- `docs/` - Documentation updates (e.g., `docs/api-guide`)
- `test/` - Test additions/updates (e.g., `test/booking-flow`)
- `chore/` - Maintenance tasks (e.g., `chore/update-deps`)

### Working on Your Feature

```bash
# Make sure you're on your feature branch
git checkout feature/your-feature-name

# Keep your branch up to date with main
git fetch origin
git rebase origin/main

# Make your changes
# ... code, code, code ...

# Add and commit your changes
git add .
git commit -m "feat: add flight search functionality"

# Push to your fork
git push origin feature/your-feature-name
```

## Coding Standards

### TypeScript/JavaScript

- **Use TypeScript** for all new code
- **ESLint**: Follow the project's ESLint configuration
- **Prettier**: Code is auto-formatted on save
- **Type Safety**: Avoid `any` types; use proper interfaces/types

#### Example

```typescript
// Good ✅
interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'traveler';
}

function getUser(id: string): Promise<User> {
  // ...
}

// Bad ❌
function getUser(id: any): any {
  // ...
}
```

### Naming Conventions

- **Files**: Use kebab-case (e.g., `flight-search.tsx`, `user-service.ts`)
- **Components**: Use PascalCase (e.g., `FlightCard`, `BookingForm`)
- **Functions**: Use camelCase (e.g., `getUserById`, `calculateTotal`)
- **Constants**: Use UPPER_SNAKE_CASE (e.g., `MAX_PASSENGERS`, `API_BASE_URL`)
- **Interfaces/Types**: Use PascalCase with descriptive names (e.g., `UserProfile`, `BookingRequest`)

### File Organization

```typescript
// 1. Imports - grouped by external, internal, types
import React from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

import type { User } from '@/types/user';

// 2. Types/Interfaces
interface ComponentProps {
  // ...
}

// 3. Constants
const MAX_ITEMS = 10;

// 4. Component/Function
export function Component({ }: ComponentProps) {
  // ...
}
```

### React Best Practices

- Use **functional components** with hooks
- Use **TypeScript** for props
- Extract **reusable logic** into custom hooks
- Keep components **small and focused**
- Use **proper prop validation**

```typescript
// Good ✅
interface FlightCardProps {
  flight: Flight;
  onSelect: (flight: Flight) => void;
}

export function FlightCard({ flight, onSelect }: FlightCardProps) {
  return (
    <div onClick={() => onSelect(flight)}>
      {/* ... */}
    </div>
  );
}

// Bad ❌
export function FlightCard(props: any) {
  return <div>{/* ... */}</div>;
}
```

### Backend Best Practices

- Follow **MVC pattern** (Models, Views, Controllers)
- Keep **business logic** in services
- Use **middleware** for cross-cutting concerns
- Validate **all inputs** using Joi or Zod
- Handle **errors consistently**

```typescript
// Good ✅
// controller
export async function createBooking(req: Request, res: Response) {
  try {
    const validated = bookingSchema.parse(req.body);
    const booking = await bookingService.create(validated);
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
}

// service
export async function create(data: BookingData) {
  // Business logic here
  const booking = await prisma.booking.create({ data });
  await emailService.sendConfirmation(booking);
  return booking;
}
```

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```bash
# Simple commit
git commit -m "feat: add flight search form"

# With scope
git commit -m "fix(auth): resolve token expiration issue"

# With body
git commit -m "feat(booking): implement approval workflow

- Add approval status to booking model
- Create approval notification emails
- Add manager approval dashboard"

# Breaking change
git commit -m "feat(api)!: change booking endpoint response format

BREAKING CHANGE: Booking response now includes nested passenger array"
```

### Commit Best Practices

- Write in **present tense** ("add feature" not "added feature")
- Keep **subject line under 50 characters**
- Use **imperative mood** ("fix bug" not "fixes bug")
- Separate subject from body with blank line
- Explain **what and why** in the body, not how

## Pull Request Process

### Before Submitting

1. **Update your branch** with latest main:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run all tests** and ensure they pass:
   ```bash
   npm test
   npm run type-check
   npm run lint
   ```

3. **Build the project** successfully:
   ```bash
   npm run build
   ```

4. **Update documentation** if needed

### Creating a Pull Request

1. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a Pull Request** on GitHub

3. **Fill out the PR template** completely:
   - Description of changes
   - Related issue numbers
   - Screenshots (for UI changes)
   - Testing steps
   - Checklist completion

### PR Title Format

Use the same format as commit messages:

```
feat: add flight booking confirmation page
fix: resolve credit calculation error
docs: update API documentation
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Related Issues
Closes #123
Relates to #456

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Screenshots (if applicable)
[Add screenshots here]

## Testing Steps
1. Step 1
2. Step 2
3. Expected result

## Checklist
- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published
```

### Review Process

1. **Automated checks** must pass (CI/CD, tests, linting)
2. **At least 1 approval** required from maintainers
3. **Address feedback** from reviewers
4. **Resolve conflicts** if any
5. **Squash commits** if requested

### Merging

- Use **Squash and Merge** for feature branches
- Use **Rebase and Merge** for minor fixes
- Never merge with failing tests
- Delete branch after merge

## Testing

### Writing Tests

All new features and bug fixes should include tests.

#### Backend Tests (Jest)

```typescript
// user.service.test.ts
describe('UserService', () => {
  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      const user = await userService.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
    });

    it('should throw error for duplicate email', async () => {
      // ...
    });
  });
});
```

#### Frontend Tests (React Testing Library)

```typescript
// FlightCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FlightCard } from './FlightCard';

describe('FlightCard', () => {
  it('renders flight information', () => {
    const flight = { /* mock flight data */ };
    render(<FlightCard flight={flight} onSelect={jest.fn()} />);

    expect(screen.getByText(flight.airline)).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    const flight = { /* mock flight data */ };
    render(<FlightCard flight={flight} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith(flight);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- user.service.test.ts
```

### Test Coverage

Maintain at least **80% code coverage** for:
- All service layer code
- Critical business logic
- API endpoints

## Questions?

If you have questions or need help:

1. Check existing [documentation](./docs/)
2. Search [existing issues](https://github.com/yourorg/corporate-travel-platform/issues)
3. Ask in team chat
4. Create a new issue with the `question` label

Thank you for contributing! 🎉
