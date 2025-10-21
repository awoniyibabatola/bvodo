# Company Admin API Documentation

## Overview
The Company Admin role is designed for travel managers who need to manage users, allocate credits, and oversee all company bookings. This role sits between the regular `admin` (organization owner) and `manager`/`traveler` roles.

## Role Hierarchy
1. **admin** - Full organization access (can manage everything including company admins)
2. **company_admin** - Travel manager (can manage users, credits, and view all bookings)
3. **manager** - Can approve bookings for assigned users
4. **traveler** - Regular employee, can make bookings

## Authentication
All company admin endpoints require:
- Valid JWT token in Authorization header: `Bearer <token>`
- User role must be either `admin` or `company_admin`

## Base URL
```
http://localhost:5000/api/v1/company-admin
```

---

## Endpoints

### 1. Get Organization Statistics
Get comprehensive statistics about the organization including users, bookings, and credits.

**Endpoint:** `GET /stats`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "organization": {
      "name": "Acme Corporation",
      "totalCredits": "100000.00",
      "availableCredits": "75000.00",
      "usedCredits": "25000.00"
    },
    "users": {
      "total": 45,
      "active": 42,
      "pending": 3
    },
    "bookings": {
      "total": 150,
      "confirmed": 120,
      "pending": 15
    },
    "totalSpend": "25000.00"
  }
}
```

---

### 2. Get All Users
Retrieve all users in the organization with optional filters.

**Endpoint:** `GET /users`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `status` (optional): Filter by status (active, pending, inactive, suspended)
- `role` (optional): Filter by role (admin, company_admin, manager, traveler)

**Example:**
```
GET /users?status=active&role=traveler
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "email": "john.doe@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "traveler",
        "department": "Engineering",
        "status": "active",
        "creditLimit": "5000.00",
        "availableCredits": "3500.00",
        "lastLoginAt": "2025-01-15T10:30:00Z",
        "createdAt": "2024-12-01T08:00:00Z"
      }
    ],
    "total": 42
  }
}
```

---

### 3. Invite User
Invite a new user to join the organization. An invitation email will be sent (when email service is configured).

**Endpoint:** `POST /users/invite`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "jane.smith@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "traveler",
  "creditLimit": 3000,
  "department": "Marketing"
}
```

**Fields:**
- `email` (required): User's email address
- `firstName` (required): First name
- `lastName` (required): Last name
- `role` (optional): Role to assign (default: "traveler")
- `creditLimit` (optional): Initial credit allocation (default: 0)
- `department` (optional): Department name

**Response:**
```json
{
  "success": true,
  "message": "User invitation created successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "jane.smith@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "traveler",
      "creditLimit": "3000.00",
      "status": "pending"
    },
    "invitationLink": "http://localhost:3000/accept-invitation?token=abc123..."
  }
}
```

---

### 4. Update User
Update user details including role, department, and status.

**Endpoint:** `PUT /users/:userId`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith-Johnson",
  "role": "manager",
  "department": "Sales",
  "status": "active"
}
```

**Fields (all optional):**
- `firstName`: Update first name
- `lastName`: Update last name
- `role`: Change user role
- `department`: Update department
- `status`: Change status (active, inactive, suspended)

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "jane.smith@example.com",
      "firstName": "Jane",
      "lastName": "Smith-Johnson",
      "role": "manager",
      "department": "Sales",
      "status": "active"
    }
  }
}
```

---

### 5. Allocate Credits
Allocate or add credits to a user's account.

**Endpoint:** `POST /users/:userId/credit/allocate`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 5000,
  "operation": "set"
}
```

**Fields:**
- `amount` (required): Credit amount to allocate
- `operation` (optional):
  - `"set"` (default): Set credit limit to this amount
  - `"add"`: Add this amount to existing credit limit

**Response:**
```json
{
  "success": true,
  "message": "Credit allocated successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john.doe@example.com",
      "creditLimit": "5000.00",
      "availableCredits": "5000.00"
    }
  }
}
```

**Notes:**
- Credits are deducted from organization's available credits
- Operation validates organization has sufficient credits
- Creates a credit transaction record for audit trail

---

### 6. Reduce Credits
Reduce a user's credit balance and return credits to organization.

**Endpoint:** `POST /users/:userId/credit/reduce`

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "amount": 1000,
  "reason": "Unused allocation return"
}
```

**Fields:**
- `amount` (required): Amount to reduce (must be positive)
- `reason` (optional): Reason for reduction

**Response:**
```json
{
  "success": true,
  "message": "Credit reduced successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john.doe@example.com",
      "creditLimit": "4000.00",
      "availableCredits": "4000.00"
    }
  }
}
```

**Notes:**
- Validates user has sufficient available credits
- Returns credits to organization pool
- Creates credit transaction record

---

### 7. Remove User
Deactivate or permanently delete a user from the organization.

**Endpoint:** `DELETE /users/:userId`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `permanent` (optional): Set to `"true"` for hard delete (default: soft delete)

**Examples:**
```
DELETE /users/abc123              # Soft delete (deactivate)
DELETE /users/abc123?permanent=true  # Hard delete (permanent)
```

**Response (Soft Delete):**
```json
{
  "success": true,
  "message": "User deactivated",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john.doe@example.com",
      "status": "inactive"
    }
  }
}
```

**Response (Hard Delete):**
```json
{
  "success": true,
  "message": "User permanently removed"
}
```

**Notes:**
- Cannot remove your own account
- Soft delete preserves data for compliance
- Hard delete cascades to related data

---

### 8. Get All Trips
View all bookings/trips made by organization members with optional filters.

**Endpoint:** `GET /trips`

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `status` (optional): Filter by status (pending, confirmed, cancelled, etc.)
- `bookingType` (optional): Filter by type (flight, hotel, package)
- `userId` (optional): Filter by specific user
- `startDate` (optional): Filter by departure date (ISO 8601 format)
- `endDate` (optional): Filter by departure date (ISO 8601 format)

**Example:**
```
GET /trips?status=confirmed&bookingType=flight&startDate=2025-01-01
```

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "id": "uuid",
        "bookingReference": "BK123456",
        "bookingType": "flight",
        "origin": "Lagos",
        "destination": "Nairobi",
        "departureDate": "2025-02-15",
        "returnDate": "2025-02-20",
        "passengers": 1,
        "basePrice": "450.00",
        "taxesFees": "50.00",
        "totalPrice": "500.00",
        "currency": "USD",
        "status": "confirmed",
        "user": {
          "id": "uuid",
          "email": "john.doe@example.com",
          "firstName": "John",
          "lastName": "Doe"
        },
        "flightBookings": [...],
        "hotelBookings": [],
        "bookedAt": "2025-01-10T14:30:00Z"
      }
    ],
    "total": 150
  }
}
```

---

## Accept Invitation (Public Endpoint)

This endpoint allows invited users to accept their invitation and set their password.

**Endpoint:** `POST /api/v1/auth/accept-invitation`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "token": "invitation-token-from-email",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Invitation accepted successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "jane.smith@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "traveler"
    },
    "organization": {
      "id": "uuid",
      "name": "Acme Corporation",
      "subdomain": "acme"
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token"
    }
  }
}
```

---

## Error Responses

### Unauthorized (401)
```json
{
  "success": false,
  "message": "No token provided"
}
```

### Forbidden (403)
```json
{
  "success": false,
  "message": "Company admin access required"
}
```

### Bad Request (400)
```json
{
  "success": false,
  "message": "Organization does not have enough available credits"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "User not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Failed to allocate credit"
}
```

---

## Use Cases

### Use Case 1: Onboarding a New Employee
```javascript
// 1. Invite user
POST /company-admin/users/invite
{
  "email": "newemployee@company.com",
  "firstName": "New",
  "lastName": "Employee",
  "role": "traveler",
  "creditLimit": 3000,
  "department": "Engineering"
}

// 2. User accepts invitation (public endpoint)
POST /auth/accept-invitation
{
  "token": "invitation-token",
  "password": "SecurePassword123"
}

// 3. Verify user is active
GET /company-admin/users?email=newemployee@company.com
```

### Use Case 2: Managing Travel Budget
```javascript
// 1. Check organization stats
GET /company-admin/stats

// 2. Allocate credits to user
POST /company-admin/users/:userId/credit/allocate
{
  "amount": 5000,
  "operation": "add"
}

// 3. Monitor user's bookings
GET /company-admin/trips?userId=:userId

// 4. Reduce unused credits
POST /company-admin/users/:userId/credit/reduce
{
  "amount": 1000,
  "reason": "End of quarter adjustment"
}
```

### Use Case 3: Offboarding an Employee
```javascript
// 1. Reduce remaining credits
POST /company-admin/users/:userId/credit/reduce
{
  "amount": 2500,
  "reason": "Employee offboarding"
}

// 2. Soft delete (deactivate) user
DELETE /company-admin/users/:userId

// Or hard delete (if required by policy)
DELETE /company-admin/users/:userId?permanent=true
```

---

## Security Notes

1. **Authorization**: All endpoints check for `admin` or `company_admin` role
2. **Organization Isolation**: Users can only access data within their organization
3. **Self-Protection**: Cannot remove or modify your own account
4. **Credit Validation**: All credit operations validate sufficient balances
5. **Audit Trail**: All credit transactions are logged for compliance
6. **Token Expiration**: Invitation tokens expire after 7 days
7. **Password Security**: Minimum 8 characters required

---

## Frontend Integration Example

```typescript
// Example: Invite a user
const inviteUser = async (userData) => {
  const token = localStorage.getItem('accessToken');

  const response = await fetch('http://localhost:5000/api/v1/company-admin/users/invite', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();

  if (data.success) {
    console.log('Invitation sent:', data.data.invitationLink);
  } else {
    console.error('Failed to invite user:', data.message);
  }
};

// Example: Allocate credits
const allocateCredits = async (userId, amount) => {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`http://localhost:5000/api/v1/company-admin/users/${userId}/credit/allocate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      operation: 'set',
    }),
  });

  const data = await response.json();
  return data;
};

// Example: View all company trips
const getAllTrips = async (filters = {}) => {
  const token = localStorage.getItem('accessToken');
  const queryString = new URLSearchParams(filters).toString();

  const response = await fetch(`http://localhost:5000/api/v1/company-admin/trips?${queryString}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return data.data.bookings;
};
```

---

## Database Schema Reference

### User Role Values
- `admin` - Organization owner/superuser
- `company_admin` - Travel manager (NEW)
- `manager` - Department manager
- `traveler` - Regular employee

### User Status Values
- `pending` - Invited, awaiting acceptance
- `active` - Active user
- `inactive` - Deactivated (soft delete)
- `suspended` - Temporarily suspended

### Booking Status Values
- `pending` - Initial booking state
- `pending_approval` - Awaiting manager approval
- `approved` - Approved, ready to confirm
- `confirmed` - Confirmed with provider
- `cancelled` - Cancelled booking
- `rejected` - Rejected by approver
- `completed` - Trip completed
- `failed` - Booking failed

---

## Testing Checklist

- [ ] Invite user and verify invitation token generated
- [ ] Accept invitation with valid token
- [ ] Allocate credits and verify organization balance decreases
- [ ] Reduce credits and verify organization balance increases
- [ ] View all users with various filters
- [ ] View all trips with date range filter
- [ ] Update user role and department
- [ ] Soft delete user and verify status = inactive
- [ ] Try to remove own account (should fail)
- [ ] Access endpoint as regular traveler (should be forbidden)
- [ ] Get organization statistics
- [ ] Verify credit transactions are logged

---

## Change Log

### Version 1.0 (2025-01-19)
- Added company_admin role to schema
- Created company admin middleware
- Implemented all 8 company admin endpoints
- Added accept invitation public endpoint
- Updated frontend navigation for company admins
- Added comprehensive API documentation
