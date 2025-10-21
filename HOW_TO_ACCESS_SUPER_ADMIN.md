# How to Access Super Admin Dashboard

## Quick Setup Guide

### Step 1: Promote an Existing User to Super Admin

Run this command in the backend directory:

```bash
cd backend
node scripts/create-super-admin.js
```

You'll be prompted to:
1. Enter the email of the user you want to promote
2. Confirm the promotion

**Example:**
```
=== Create Super Admin ===

Enter the email of the user to promote to super admin: admin@example.com

Found user:
  Name: John Doe
  Email: admin@example.com
  Current Role: admin
  Organization: Acme Corporation

Promote this user to super admin? (yes/no): yes

✅ Success! User has been promoted to super admin.

You can now login as admin@example.com to access super admin features.
Super admin dashboard: http://localhost:3000/super-admin
```

### Step 2: Login as Super Admin

1. Go to: `http://localhost:3000/login`
2. Login with the promoted user's credentials
3. You'll see a "Super Admin" button in the navigation bar

### Step 3: Access Super Admin Dashboard

Once logged in as a super admin, you have two ways to access it:

1. **Click the "Super Admin" button** in the navigation (purple gradient button)
2. **Or directly navigate to:** `http://localhost:3000/super-admin`

---

## Super Admin Features

### Dashboard Overview (`/super-admin`)
- View platform-wide statistics
- See all organizations at a glance
- Quick search functionality
- Access to full organization list

### Organizations Management (`/super-admin/organizations`)
- Complete list of all organizations
- Search by name, email, or subdomain
- View user count, booking count, and credit stats
- Pagination for large lists

### Individual Organization (`/super-admin/organizations/[id]`)
- Detailed organization view
- **Allocate Credits:**
  - Add to existing credits
  - Set total credits amount
- **Reduce Credits:**
  - Remove credits from organization
- View all users in the organization
- See recent bookings
- Complete transaction history

---

## Important Notes

### Super Admin vs Regular Admin

| Feature | Super Admin | Organization Admin |
|---------|-------------|-------------------|
| Manage own organization | ✅ | ✅ |
| View all organizations | ✅ | ❌ |
| Allocate credits to any org | ✅ | ❌ |
| Platform-wide statistics | ✅ | ❌ |
| Access super admin dashboard | ✅ | ❌ |
| Can see other organizations | ✅ | ❌ |

### Navigation Differences

**Super Admin:**
- Dashboard button
- **Super Admin button** (purple gradient) → Goes to `/super-admin`

**Regular Users:**
- Dashboard button
- Bookings, Flights, Hotels buttons
- Users and Reports (for company admins)

---

## Troubleshooting

### "User not found" error
Make sure the user exists in your database. You can check by logging into the regular dashboard first.

### Super Admin button not showing
1. Clear your browser cache and localStorage
2. Logout and login again
3. Check that the user's role was successfully updated to `super_admin`

### Can't access `/super-admin` routes
Make sure:
1. The backend is running (`cd backend && npm run dev`)
2. The user is logged in with a valid token
3. The user's role is exactly `super_admin` (not `admin` or `company_admin`)

---

## Alternative: Manual Database Update

If you prefer to update the database directly:

```sql
-- Using psql or your database client
UPDATE users
SET role = 'super_admin'
WHERE email = 'your-email@example.com';
```

Or using Prisma Studio:

```bash
cd backend
npx prisma studio
```

Then find the user and change their role to `super_admin`.

---

## Next Steps

Once you have super admin access:

1. **View Platform Stats** - See total organizations, users, bookings
2. **Manage Credits** - Allocate or reduce credits for any organization
3. **Monitor Organizations** - Keep track of all companies using the platform
4. **View Transactions** - See complete credit transaction history

Enjoy your super admin powers! 🚀
