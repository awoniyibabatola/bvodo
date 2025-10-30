# Role-Based Booking Policies - Implementation Plan

## Overview
This document outlines the complete implementation plan for role-based booking policies in the corporate travel management platform.

## Feature Requirements
- Each company has specific booking policies
- Policies are role-based (employee, manager, admin, etc. have different limits)
- Policies define maximum values for:
  - Hotel bookings (per night or total)
  - Flight bookings (per trip)
- Admins can create/edit these policies
- These policies filter what hotels and flights users can see during search

## Tech Stack
- Frontend: Next.js with TypeScript, Tailwind CSS
- Backend: Node.js/Express with TypeScript
- Database: PostgreSQL with Prisma ORM
- Current roles: employee, manager, admin, company_admin, super_admin

---

## 1. DATABASE SCHEMA CHANGES

### New Tables

#### BookingPolicy
Stores organizational booking policies with role-based limits.

**Key Fields:**
- `id`, `organizationId`, `name`, `description`
- `role` - Target role for this policy
- `policyType` - 'per_night', 'per_trip', 'per_booking', 'monthly_limit', 'annual_limit'
- `flightMaxAmount` - Maximum flight booking amount
- `hotelMaxAmountPerNight` - Maximum hotel cost per night
- `hotelMaxAmountTotal` - Maximum total hotel booking cost
- `monthlyLimit`, `annualLimit` - Periodic spending limits
- `allowedFlightClasses` - JSON array of allowed cabin classes
- `requiresApprovalAbove` - Amount requiring manager approval
- `autoApproveBelow` - Auto-approve threshold
- `allowManagerOverride` - Allow manager to approve violations
- `allowExceptions` - Allow policy exceptions
- `advanceBookingDays` - Minimum days before travel
- `maxTripDuration` - Maximum trip length
- `isActive`, `priority`, `effectiveFrom`, `effectiveTo`

#### PolicyException
Handles policy overrides for specific users or bookings.

**Key Fields:**
- `id`, `policyId`, `organizationId`, `userId`, `bookingId`
- `exceptionType` - 'user_permanent', 'user_temporary', 'booking_one_time', 'department'
- Override limits (flightMaxAmount, hotelMaxAmountPerNight, hotelMaxAmountTotal)
- `reason`, `approvedBy`, `approvedAt`
- `validFrom`, `validTo`, `isActive`

#### PolicyUsageLog
Audit trail for policy applications and violations.

**Key Fields:**
- `id`, `policyId`, `organizationId`, `userId`, `bookingId`
- `eventType` - 'policy_applied', 'policy_violated', 'exception_granted', 'override_used', 'limit_exceeded'
- `policySnapshot` - JSON snapshot of policy at time of event
- `bookingType`, `requestedAmount`, `policyLimit`, `currency`
- `wasAllowed`, `requiresApproval`
- `details`, `metadata`

### Update Existing Models

**Organization:** Add relations for bookingPolicies, policyExceptions, policyUsageLogs

**User:** Add relations for createdPolicies, policyExceptions, approvedExceptions, policyUsageLogs

**Booking:** Add fields:
- `appliedPolicyId` - Reference to applied policy
- `policyExceptionId` - Reference to exception if used
- `policyViolation` - Boolean flag
- `policyOverrideBy`, `policyOverrideReason` - Override tracking

---

## 2. BACKEND API DESIGN

### Policy Management Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/policies` | List all policies | Admin, Company Admin |
| GET | `/api/policies/:id` | Get policy by ID | Admin, Company Admin |
| POST | `/api/policies` | Create new policy | Admin, Company Admin |
| PUT | `/api/policies/:id` | Update policy | Admin, Company Admin |
| DELETE | `/api/policies/:id` | Delete policy | Admin, Company Admin |
| GET | `/api/policies/my-policy` | Get effective policy for current user | All authenticated |
| POST | `/api/policies/check` | Check booking compliance | All authenticated |
| POST | `/api/policies/:id/exceptions` | Create policy exception | Manager, Admin |
| GET | `/api/policies/usage-logs` | Get policy usage logs | Admin |

### Modified Search Endpoints

**GET `/api/flights/search`**
- Now filters results by user's flight policy limits
- Returns policy info in response

**GET `/api/hotels/search`**
- Now filters results by user's hotel policy limits (per-night and total)
- Returns policy info in response

### Policy Service

**File:** `backend/src/services/policy.service.ts`

Key Methods:
- `getPolicyForUser(userId, organizationId)` - Get effective policy with exceptions
- `checkPolicyCompliance(userId, organizationId, bookingDetails)` - Validate booking
- `getMonthlySpending(userId, organizationId)` - Calculate current month spend
- `getAnnualSpending(userId, organizationId)` - Calculate current year spend
- `logPolicyUsage(data)` - Create audit log entry

---

## 3. FRONTEND CHANGES

### A. Admin Policy Management UI

**New Page:** `/dashboard/policies`

**Components:**
- `PoliciesPage.tsx` - Main policies list and management
- `PolicyModal.tsx` - Create/edit policy form
- `PolicyCard.tsx` - Individual policy display card

**Features:**
- Grid layout of all policies
- Filter by role
- Create/edit/delete operations
- Priority ordering
- Active/inactive toggle
- Exception management

**Policy Form Fields:**
- Name and description
- Role selector
- Currency selector
- Flight max amount
- Hotel per-night limit
- Hotel total limit
- Monthly/Annual limits
- Allowed flight classes (checkboxes)
- Approval thresholds
- Manager override toggle
- Advance booking days
- Max trip duration
- Effective date range
- Priority selector

### B. User Policy Display

**Component:** `PolicyLimitsBanner.tsx`

Shows user their current policy limits:
- Flight max amount
- Hotel per-night limit
- Hotel total limit
- Monthly/Annual spending and remaining budget

Display on:
- Flight search page
- Hotel search page
- Dashboard

### C. Search Page Integration

**Flight Search (`/dashboard/flights/search`):**
- Add PolicyLimitsBanner at top
- Show policy filter message if results filtered
- Display "No results match your policy" when applicable
- Show "Requires Approval" badges for near-limit options

**Hotel Search (`/dashboard/hotels/search`):**
- Same as flight search
- Filter by per-night AND total limits

### D. Booking Flow Integration

**Pre-Booking Policy Check:**
- Call `/api/policies/check` before booking creation
- Show policy violation modal if limits exceeded
- Display approval requirement if applicable
- Allow "Request Exception" flow
- Block booking if hard limit exceeded

---

## 4. EDGE CASES & SOLUTIONS

### No Policy Defined
**Solution:** Allow all bookings, log warning, prompt admin to create policies

### Policy Changes with Active Bookings
**Solution:** Store policy snapshot, don't affect existing bookings, show "Policy changed" notice

### Multi-Role Scenarios
**Solution:** Use priority system, one role per user, exceptions override base policy

### Policy Overrides/Exceptions
**Solution:** Create PolicyException record with approval, time-limited, audit trail

### Manager Approval Flow
**Solution:** Flag booking as pending_approval, notify manager, track approval in booking

### Empty Search Results
**Solution:** Clear message, show limits, offer exception request, show near-limit options

### Currency Conversion
**Solution:** Convert to policy currency before checking, log conversion rate

---

## 5. IMPLEMENTATION ORDER

### Phase 1: Database & Backend Core (Week 1)
1. Create Prisma migrations for new tables
2. Update existing models with policy relations
3. Create PolicyService with core logic
4. Create policy.controller.ts with CRUD endpoints
5. Add policy routes to Express app
6. Write unit tests for policy service

### Phase 2: Search Integration (Week 2)
1. Modify flight.controller.ts to fetch and apply policies
2. Modify hotel.controller.ts to fetch and apply policies
3. Add /policies/check endpoint
4. Add /policies/my-policy endpoint
5. Test policy filtering in search results

### Phase 3: Admin UI (Week 3)
1. Create policy management page
2. Create PolicyModal component
3. Add policy list, filter, sort functionality
4. Add delete confirmation
5. Add exception management UI
6. Test all CRUD operations

### Phase 4: User-Facing Features (Week 4)
1. Create PolicyLimitsBanner component
2. Integrate banner in search pages
3. Add policy compliance check in booking flow
4. Add "Request Exception" functionality
5. Show policy violation messages
6. Add "Requires Approval" badges

### Phase 5: Approval Workflow (Week 5)
1. Add manager notification system
2. Create approval UI in bookings page
3. Handle approval/rejection flows
4. Update booking status after approval
5. Send confirmation to traveler

### Phase 6: Testing & Refinement (Week 6)
1. End-to-end testing all scenarios
2. Test edge cases
3. Performance testing
4. Mobile responsiveness testing
5. Fix bugs and optimize
6. Write documentation

---

## 6. TESTING STRATEGY

### Unit Tests
- PolicyService methods
- Policy filtering logic
- Spending calculations
- Exception handling
- Edge case scenarios

### Integration Tests
- Policy CRUD operations
- Search with policy filtering
- Booking creation with policy check
- Approval workflow
- Exception creation

### E2E Tests (Playwright/Cypress)
- Create policy via admin UI
- User search with policy
- Booking within policy
- Booking exceeding policy
- Request exception
- Manager approval
- Complete booking

---

## 7. POTENTIAL CHALLENGES & SOLUTIONS

| Challenge | Solution |
|-----------|----------|
| Performance with complex policies | Index fields, cache policies (Redis 5min TTL), pre-calculate spending |
| Real-time policy updates | WebSockets/SSE, invalidate cache, notify users, auto-refresh results |
| Mobile UX for violations | Bottom sheet, simplified forms, clear badges, one-tap contact |
| Multi-currency handling | Store single currency, convert before check, daily rate updates |
| Audit & compliance | Detailed logging, export functionality, compliance dashboard, alerts |

---

## 8. FUTURE ENHANCEMENTS

1. **AI-Powered Policy Suggestions** - Analyze patterns, suggest optimal limits
2. **Dynamic Policies** - Seasonal adjustments, department overrides, project policies
3. **Policy Templates** - Pre-built templates, industry-specific, one-click setup
4. **Advanced Analytics** - Compliance dashboard, savings reports, violation trends
5. **HR Integration** - Auto-update based on employee level, org chart sync

---

## API ROUTES SUMMARY

```
POST   /api/policies                  - Create policy (admin)
GET    /api/policies                  - List policies
GET    /api/policies/:id              - Get policy
PUT    /api/policies/:id              - Update policy (admin)
DELETE /api/policies/:id              - Delete policy (admin)
GET    /api/policies/my-policy        - Get current user's effective policy
POST   /api/policies/check            - Check booking compliance
POST   /api/policies/:id/exceptions   - Create exception (manager/admin)
GET    /api/policies/:id/exceptions   - List exceptions for policy
GET    /api/policies/usage-logs       - Get policy usage logs (admin)

// Modified existing endpoints
GET    /api/flights/search            - Now filters by policy
GET    /api/hotels/search             - Now filters by policy
POST   /api/bookings                  - Now checks policy before creating
```

---

## Key Features

✅ Complete database schema with 3 new tables
✅ 14 new API endpoints for policy management
✅ Policy filtering integrated into search flows
✅ Admin UI for policy CRUD operations
✅ User-facing components showing limits and violations
✅ Exception/override system with approval workflow
✅ Audit logging for compliance
✅ Edge case handling for all scenarios
✅ 6-week implementation timeline
✅ Comprehensive testing strategy
✅ Mobile-first design throughout

## Design Principles

- **Flexible:** Supports multiple policy types and exceptions
- **Scalable:** Efficient queries with proper indexing
- **User-friendly:** Clear messaging and intuitive UX
- **Auditable:** Complete logging for compliance
- **Maintainable:** Clean separation of concerns
