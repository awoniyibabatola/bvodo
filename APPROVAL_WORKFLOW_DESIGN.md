# Approval Workflow Design

## Current System Analysis

### Existing Schema Fields

**Organization Level:**
- `requireApprovalAll`: Boolean - Require approval for all bookings
- `approvalThreshold`: Decimal - Amount threshold that triggers approval

**User Level:**
- `approverId`: String - Who approves this user's bookings
- `autoApprove`: Boolean - Skip approval for this user

**Booking Level:**
- `requiresApproval`: Boolean - Does this booking need approval
- `approverId`: String - Who needs to approve
- `approvedAt`: DateTime - When approved
- `approvalNotes`: String - Notes from approver
- `rejectionReason`: String - Why rejected
- `status`: String - pending, pending_approval, approved, rejected, etc.

---

## Proposed Approval Workflow Options

### Option 1: Simple Hierarchical Approval (Recommended for MVP)

**How it works:**
1. Each user has ONE approver (manager)
2. Bookings go to that approver for approval
3. Approval triggers based on:
   - Organization setting (`requireApprovalAll`)
   - Price threshold (`approvalThreshold`)
   - User setting (`autoApprove` = false)

**Workflow:**
```
Traveler creates booking
    ↓
Check if approval needed:
  - Is requireApprovalAll = true? OR
  - Is totalPrice >= approvalThreshold? OR
  - Is user.autoApprove = false?
    ↓
YES → Status = "pending_approval" → Send to approver
NO  → Status = "confirmed" → Book immediately
```

**Pros:**
- Simple to implement
- Easy for users to understand
- Works for most corporate structures
- Already supported by current schema

**Cons:**
- Only one level of approval
- No delegation/escalation

---

### Option 2: Multi-Level Approval Chain

**How it works:**
1. Define approval chains (e.g., Manager → Director → VP)
2. Bookings escalate based on amount
3. Each level approves and passes up if needed

**Example:**
- $0-$1,000: Manager approval only
- $1,000-$5,000: Manager + Director
- $5,000+: Manager + Director + VP

**Schema Changes Needed:**
```prisma
model ApprovalLevel {
  id             String @id @default(uuid())
  organizationId String
  minAmount      Decimal
  maxAmount      Decimal
  approverRole   String // manager, director, vp, cfo
  order          Int    // 1, 2, 3 (sequence)
}

model BookingApproval {
  id          String @id @default(uuid())
  bookingId   String
  approverId  String
  level       Int
  status      String // pending, approved, rejected
  approvedAt  DateTime?
  notes       String?
}
```

**Pros:**
- More control for large organizations
- Better audit trail
- Flexible approval chains

**Cons:**
- More complex to implement
- Requires schema changes
- Slower approval process

---

### Option 3: Conditional Approval Rules

**How it works:**
1. Define rules in organization settings
2. Rules determine if/who approves based on multiple factors

**Example Rules:**
```json
{
  "approvalRules": [
    {
      "condition": "price > 5000",
      "requiresApproval": true,
      "approverRole": "cfo"
    },
    {
      "condition": "destination = 'International'",
      "requiresApproval": true,
      "approverRole": "director"
    },
    {
      "condition": "isGroupBooking = true AND travelers > 5",
      "requiresApproval": true,
      "approverRole": "vp"
    }
  ]
}
```

**Pros:**
- Very flexible
- Can handle complex business logic
- No schema changes (uses JSON)

**Cons:**
- Complex to implement
- Hard for users to configure
- Performance overhead

---

## Recommended Implementation: Option 1 (Enhanced)

### Phase 1: Basic Approval (Use existing schema)

**Implementation Steps:**

1. **Booking Creation Logic**
```typescript
// When creating booking
const needsApproval =
  organization.requireApprovalAll ||
  totalPrice >= organization.approvalThreshold ||
  !user.autoApprove;

const booking = {
  status: needsApproval ? 'pending_approval' : 'pending',
  requiresApproval: needsApproval,
  approverId: needsApproval ? user.approverId : null,
};
```

2. **Approval Actions**
- Approver receives notification
- Approver can: Approve, Reject, Request More Info
- On Approve: Status → "confirmed", book with provider
- On Reject: Status → "rejected", release credits

3. **User Roles & Permissions**
- Travelers: Create bookings
- Managers: Approve travelers' bookings
- Company Admin: Set approval rules, assign approvers
- Admin: All of above

### Phase 2: Enhanced Features

1. **Approval Dashboard**
   - List of pending approvals
   - Quick approve/reject
   - Bulk actions
   - Filters (by amount, date, user)

2. **Notifications**
   - Email when approval needed
   - Reminder if pending > 24hrs
   - Notification to traveler when approved/rejected

3. **Delegation**
   - Approver can delegate to another user
   - Temporary delegation (date range)

4. **Approval History**
   - Who approved what when
   - Rejection reasons
   - Audit trail

---

## User Stories

### As a Traveler:
1. I book a flight
2. System checks if approval needed
3. If yes: I see "Pending Approval" status
4. I receive notification when approved/rejected
5. If approved: Booking is confirmed
6. If rejected: I see reason and can rebook

### As a Manager:
1. I receive notification of pending approvals
2. I go to approval dashboard
3. I see booking details (price, destination, dates, reason)
4. I approve or reject with notes
5. Traveler is notified of my decision

### As a Company Admin:
1. I set approval threshold ($5,000)
2. I enable "requireApprovalAll" for strict control
3. I assign approvers to users
4. I mark VIPs with "autoApprove" = true
5. I view approval analytics

---

## Technical Implementation Plan

### Backend API Endpoints

```typescript
// Get pending approvals for current user
GET /api/v1/approvals/pending

// Get approval by ID
GET /api/v1/approvals/:id

// Approve booking
POST /api/v1/approvals/:bookingId/approve
Body: { notes?: string }

// Reject booking
POST /api/v1/approvals/:bookingId/reject
Body: { reason: string }

// Get user's approval history
GET /api/v1/approvals/history

// Delegate approver (future)
POST /api/v1/approvals/delegate
Body: { delegateToUserId: string, startDate: date, endDate: date }
```

### Frontend Pages

1. **Approval Dashboard** (`/dashboard/approvals`)
   - List pending approvals
   - Filter/sort options
   - Quick action buttons

2. **Booking Detail Modal**
   - Full booking details
   - Traveler info
   - Trip purpose
   - Approve/Reject buttons

3. **My Bookings** (Enhanced)
   - Show approval status
   - "Awaiting approval from [Manager Name]"
   - Show rejection reason if rejected

---

## Notification Strategy

### Email Notifications

1. **To Approver** (when booking created)
   - Subject: "Approval Needed: [Traveler] - [Destination]"
   - Details: Amount, dates, reason
   - Quick action links: Approve | Reject | View Details

2. **To Traveler** (when approved)
   - Subject: "Booking Approved: [Destination]"
   - Details: Confirmation, next steps

3. **To Traveler** (when rejected)
   - Subject: "Booking Declined: [Destination]"
   - Details: Reason, what to do next

### In-App Notifications
- Bell icon with count
- Real-time updates
- Notification center

---

## Business Rules

### When to Require Approval:
1. Organization has `requireApprovalAll = true`
2. Booking amount >= `approvalThreshold`
3. User has `autoApprove = false`
4. User has an assigned `approverId`

### When to Auto-Approve:
1. User has `autoApprove = true`
2. Booking amount < `approvalThreshold` AND `requireApprovalAll = false`
3. User has no `approverId` assigned

### Credit Handling:
- **On Booking**: Credits are held (not deducted)
- **On Approval**: Credits deducted, booking confirmed
- **On Rejection**: Credits released back to user

---

## Data Flow

```
1. Create Booking
   ↓
2. Calculate needsApproval
   ↓
3. If YES:
   - Hold credits
   - Set status = "pending_approval"
   - Set approverId
   - Send notification to approver
   ↓
4. Approver Decision:
   ↓
5a. APPROVE:
   - Deduct credits
   - Set status = "confirmed"
   - Book with provider (Amadeus)
   - Notify traveler
   ↓
5b. REJECT:
   - Release credits
   - Set status = "rejected"
   - Store rejection reason
   - Notify traveler
```

---

## UI Mockup Concepts

### Approval Dashboard
```
┌─────────────────────────────────────────────────────┐
│ Pending Approvals (5)                               │
├─────────────────────────────────────────────────────┤
│                                                      │
│ [All] [High Value >$5k] [International] [Group]     │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ John Smith → Dubai                           │   │
│ │ Mar 15-20, 2025 • Flight • $3,450           │   │
│ │ "Client meeting with Emirates Airlines"     │   │
│ │ [✓ Approve] [✗ Reject] [View Details]       │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ Sarah Johnson → New York                     │   │
│ │ Apr 2-5, 2025 • Hotel • $1,890              │   │
│ │ "Conference attendance"                      │   │
│ │ [✓ Approve] [✗ Reject] [View Details]       │   │
│ └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### My Bookings (with approval status)
```
┌─────────────────────────────────────────────────────┐
│ My Bookings                                          │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ ⏳ PENDING APPROVAL                          │   │
│ │ Dubai Business Trip                          │   │
│ │ Mar 15-20, 2025 • $3,450                    │   │
│ │ Awaiting approval from: Mike Brown (Manager) │   │
│ │ Submitted: 2 hours ago                       │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ ✓ APPROVED                                    │   │
│ │ London Conference                             │   │
│ │ Feb 10-15, 2025 • $2,100                     │   │
│ │ Confirmed                                     │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ ✗ REJECTED                                    │   │
│ │ Paris Trip                                    │   │
│ │ Jan 5-10, 2025 • $4,200                      │   │
│ │ Reason: Budget constraints for Q1             │   │
│ │ [Request Again] [Contact Manager]            │   │
│ └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## Success Metrics

- Average approval time < 24 hours
- Approval rate (approved/total)
- Rejection reasons (to improve booking UX)
- Credits saved via approvals
- User satisfaction with approval process

---

## Future Enhancements (Phase 3+)

1. **AI-Powered Auto-Approval**
   - Learn from past approvals
   - Auto-approve low-risk bookings
   - Flag unusual patterns

2. **Expense Integration**
   - Attach receipts
   - Track actual spend vs booked
   - Reconciliation tools

3. **Policy Compliance**
   - Check against travel policy
   - Flag violations
   - Suggest alternatives

4. **Mobile App**
   - Push notifications
   - Quick approve from phone
   - Biometric approval

---

## Questions to Discuss

1. Should we allow multiple approvers? (e.g., Manager + Finance)
2. What's the default approval threshold? ($1,000? $5,000?)
3. Should super_admin bypass approval?
4. Should we support approval delegation?
5. Should approvers see all bookings or only their team's?
6. What happens if approver doesn't respond in 48 hours? Auto-approve? Escalate?
