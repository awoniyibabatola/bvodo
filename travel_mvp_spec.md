# MVP Specification
## Corporate Travel Platform for Africa

**Target Launch:** 3-4 Months  
**Focus:** Prove core value proposition with minimal features

---

## MVP Philosophy

**Goal:** Enable organizations to book flights and hotels using travel credits through a centralized portal, with basic policy controls.

**What's IN:**
- Essential booking functionality
- Basic credit management
- Simple approval workflow
- Organization dashboard

**What's OUT (Post-MVP):**
- Complex policy engines
- Expense management
- Ground transportation
- Native mobile apps
- Advanced analytics
- Third-party integrations

---

## Core Features for MVP

### 1. User Authentication & Organization Setup

#### Organization Onboarding
- Simple registration form (company name, admin details)
- Email verification
- Organization unique subdomain (e.g., `acmecorp.yourplatform.com`)
- Basic company profile (logo, name, address)

#### User Management
- Admin can invite users via email
- Three roles only:
  - **Admin**: Full access, manages credits and users
  - **Manager**: Can approve bookings
  - **Traveler**: Can book travel
- CSV bulk user import
- Basic user profile (name, email, department, role)

#### Authentication
- Email/password login
- Password reset functionality
- Session management
- **No SSO in MVP**

---

### 2. Travel Credit System (Simplified)

#### Credit Wallet
- Organization-level credit balance (USD only for MVP)
- Admin can add credits via:
  - Manual bank transfer (offline process)
  - Card payment (Stripe/Paystack integration)
- Credit transaction history
- Low balance alerts (email notifications)

#### User Allocation
- Admin assigns credit limits to individual users
- Users see their available balance
- Credits deducted automatically on confirmed bookings
- **No department-level allocation in MVP**
- **No credit expiration in MVP**

---

### 3. Flight Booking (Core Feature)

#### Search Interface
- Simple search form:
  - Origin and destination (airport codes or city names)
  - Departure date and return date
  - Number of passengers (1-5)
  - Class: Economy or Business only
- One-way and round-trip only (**no multi-city**)

#### Search Results
- List view with:
  - Airline and flight numbers
  - Departure/arrival times and airports
  - Duration and stops
  - Price in USD
  - Baggage allowance
- Sort by: Price (low to high), Duration, Departure time
- Basic filters: Direct flights only, Max stops

#### Flight Details & Booking
- Flight details page with:
  - Full itinerary
  - Fare rules (cancellation, changes)
  - Baggage details
- Passenger information form:
  - Name (as on passport)
  - Date of birth
  - Passport number
  - Contact details
- Seat selection: **Not in MVP** (auto-assigned)
- Review and confirm page
- Check user has sufficient credits
- Submit booking

#### Integration
- Partner with **ONE** GDS provider (Amadeus recommended)
- Focus on major African routes initially:
  - Lagos-Nairobi-Johannesburg-Accra-Cairo triangle
  - Major carriers: Ethiopian, Kenya Airways, South African Airways

---

### 4. Hotel Booking (Core Feature)

#### Search Interface
- Simple search form:
  - City or hotel name
  - Check-in and check-out dates
  - Number of rooms (1-3)
  - Number of guests (1-4 per room)

#### Search Results
- List view with:
  - Hotel name and star rating
  - Main photo
  - Price per night (total stay cost)
  - Basic amenities (WiFi, breakfast, parking)
  - Distance from city center/airport
- Sort by: Price, Rating
- Filter by: Price range, Star rating (3-5 star)

#### Hotel Details & Booking
- Hotel details page:
  - Photo gallery (5-10 photos)
  - Description
  - Amenities list
  - Address and map
  - Cancellation policy
- Room selection (available room types)
- Guest information form
- Special requests (text field)
- Review and confirm
- Check user has sufficient credits
- Submit booking

#### Integration
- Partner with hotel booking API:
  - Booking.com Affiliate API, or
  - Expedia Partner Solutions, or
  - Direct partnerships with 20-30 major hotels in target cities

---

### 5. Simple Approval Workflow

#### Approval Settings
- Admin sets approval requirements:
  - All bookings require approval (Yes/No)
  - Approval threshold (e.g., bookings over $500 need approval)
  - Assign approvers to users

#### Booking Flow with Approval
- If approval needed:
  - Booking status: "Pending Approval"
  - Email notification sent to approver
  - Credits temporarily held (not deducted)
- Approver sees:
  - Trip details
  - Cost
  - Traveler name and reason for travel
  - Approve or Reject buttons

#### Approval Actions
- **Approve**: Booking confirmed, credits deducted, traveler notified
- **Reject**: Booking cancelled, credits released, traveler notified with reason
- **No complex multi-level approvals in MVP** (single approver only)

---

### 6. Organization Dashboard

#### Admin Dashboard
- Key metrics (last 30 days):
  - Total bookings
  - Total spend
  - Available credit balance
  - Pending approvals count
- Recent bookings table (last 10)
- Quick actions:
  - Add credits
  - Invite users
  - View all bookings

#### Traveler Dashboard
- My upcoming trips
- My past trips
- My available credit
- Quick search: Book a flight or hotel

#### Manager Dashboard
- Pending approvals queue
- Team bookings overview
- Same quick search functionality

---

### 7. Booking Management

#### My Trips
- List of all user bookings:
  - Upcoming
  - Completed
  - Cancelled
- Each booking shows:
  - Trip dates
  - Destination
  - Booking reference
  - Total cost
  - Status

#### Trip Details Page
- Full itinerary
- Booking confirmation (downloadable PDF)
- E-ticket for flights
- Hotel confirmation voucher
- **Cancellation**: Email support only in MVP (no self-service)
- **Modifications**: Email support only in MVP

---

### 8. Basic Reporting

#### Bookings Report
- Filterable table:
  - Date range
  - User
  - Status (confirmed, pending, cancelled)
  - Type (flight, hotel)
- Columns: Date, Traveler, Destination, Cost, Status
- Export to CSV

#### Spend Report
- Total spend by:
  - Month
  - User
  - Department
- Simple bar charts
- Export to CSV

**No advanced analytics in MVP**

---

### 9. Support & Help

#### Help Center
- FAQ page (10-15 common questions)
- How-to guides:
  - How to book a flight
  - How to add credits
  - How to invite users
  - How to approve bookings

#### Support Contact
- Support email address
- Contact form
- Expected response time: 24 hours
- **No live chat in MVP**
- **No phone support in MVP**

---

## Technical Architecture (MVP)

### Frontend
- **Web Application** (responsive, mobile-friendly)
- **Tech Stack**: React.js or Next.js
- **UI Library**: Tailwind CSS + shadcn/ui
- **State Management**: React Context or Zustand
- **No native mobile apps**

### Backend
- **Tech Stack**: Node.js (Express) or Python (Django/FastAPI)
- **Database**: PostgreSQL
- **File Storage**: AWS S3 or Cloudflare R2
- **Authentication**: JWT tokens

### Infrastructure
- **Hosting**: AWS, Google Cloud, or Digital Ocean
- **CI/CD**: GitHub Actions
- **Monitoring**: Basic logging and error tracking (Sentry)

### Integrations
- **Flights**: Amadeus API (self-service tier)
- **Hotels**: Booking.com API or similar
- **Payments**: Stripe (card) + Paystack (African payments)
- **Email**: SendGrid or AWS SES
- **PDF Generation**: For tickets and confirmations

---

## MVP User Flows

### Flow 1: Organization Setup (Admin)
1. Admin signs up
2. Verifies email
3. Completes organization profile
4. Adds initial credits via card payment
5. Invites first team members
6. Sets approval settings

### Flow 2: Book a Flight (Traveler)
1. Traveler logs in
2. Searches for flight (Lagos to Nairobi, next week)
3. Views results, selects flight
4. Enters passenger details
5. Reviews booking
6. Submits (goes to approval if required)
7. Receives confirmation email when approved
8. Downloads e-ticket

### Flow 3: Approve Booking (Manager)
1. Manager receives approval email
2. Clicks link to view booking details
3. Reviews trip purpose and cost
4. Clicks "Approve"
5. Traveler and admin notified

### Flow 4: View Reports (Admin)
1. Admin navigates to Reports
2. Selects date range (last quarter)
3. Views bookings table
4. Exports to CSV for accounting

---

## MVP Success Criteria

### Before Launch
- [ ] 5 test organizations complete full booking cycle
- [ ] 50+ successful test bookings (flights and hotels)
- [ ] Zero critical bugs
- [ ] Payment processing tested with real transactions
- [ ] All core user flows documented

### After Launch (First 3 Months)
- [ ] 20+ paying organizations
- [ ] $50,000+ in booking volume
- [ ] 200+ bookings completed
- [ ] 90%+ booking success rate
- [ ] Customer satisfaction score >4/5
- [ ] <5% support ticket rate per booking

---

## What Gets Built Post-MVP

Based on user feedback, prioritize:

### Quick Wins (Month 4-6)
- Self-service booking modifications
- Mobile app (React Native)
- Multi-currency support
- More payment methods (M-Pesa, bank transfer)
- Advanced filters and search
- Loyalty program integration

### Medium Term (Month 7-12)
- Ground transportation
- Expense management
- Complex approval workflows
- Policy engine
- Better analytics
- API access

### Long Term (Month 13+)
- Third-party integrations
- White-labeling
- AI recommendations
- Travel risk management

---

## MVP Timeline & Resources

### Team Structure
- 1 Product Manager
- 1 UI/UX Designer
- 3 Full-stack Developers
- 1 QA Engineer
- 1 DevOps Engineer (part-time)

### Development Timeline

**Month 1: Foundation**
- User authentication
- Organization setup
- Basic dashboard
- Credit system

**Month 2: Booking Core**
- Flight search and booking
- Hotel search and booking
- Amadeus/Hotel API integration
- PDF generation

**Month 3: Polish & Test**
- Approval workflow
- Reporting
- Payment integration
- Bug fixes and testing
- Help documentation

**Month 4: Launch**
- Beta with 5 pilot customers
- Gather feedback
- Fix issues
- Public launch

---

## MVP Budget Estimate

### Development Costs (4 months)
- Team salaries: $80,000 - $120,000
- Cloud infrastructure: $2,000
- Third-party services: $3,000
- Design tools & licenses: $1,000
- **Total Dev**: ~$86,000 - $126,000

### Operational Costs (First 3 months post-launch)
- Server hosting: $500/month
- API costs: $1,000/month (usage-based)
- Support tools: $200/month
- Marketing: $5,000
- **Total Ops**: ~$10,100

### Ongoing Revenue
- Transaction fee: 3-5% per booking
- Monthly subscription: $100-500 per organization (optional)

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| GDS integration complexity | Start with Amadeus self-service API, dedicated 2 weeks for integration testing |
| Payment processing issues | Use established providers (Stripe, Paystack), build fallback mechanisms |
| Low booking volume | Offer discounted rates to first 20 customers, aggressive sales push |
| Poor user experience | Continuous user testing, simple onboarding, video tutorials |
| Competition | Focus on Africa-specific needs, better local payment support, personalized service |

---

## Launch Strategy

### Beta Phase (2-4 weeks)
- Recruit 5 pilot organizations (50-200 employees each)
- Offer 3 months free + discounted transaction fees
- Weekly check-ins for feedback
- Rapid iteration on critical issues

### Public Launch
- Announce on LinkedIn, Twitter
- Content marketing (blog posts on corporate travel in Africa)
- Partnerships with business associations
- Sales outreach to target companies
- Referral program (20% discount for referrals)

### Success Metrics to Track
- Week 1: 5 sign-ups
- Month 1: 20 organizations, 50 bookings
- Month 3: 50 organizations, 500 bookings
- NPS score > 40

---

## User Stories with Acceptance Criteria

### Epic 1: Organization & User Management

#### Story 1.1: Organization Registration
**As a** company admin  
**I want to** register my organization on the platform  
**So that** my team can start booking corporate travel

**Acceptance Criteria:**
- [ ] Registration form includes: company name, admin name, admin email, password, country
- [ ] Email verification link sent after registration
- [ ] Unique subdomain generated (e.g., companyname.platform.com)
- [ ] Cannot access platform until email verified
- [ ] Success message displayed after verification
- [ ] Auto-login after verification

**Priority:** P0  
**Story Points:** 5

---

#### Story 1.2: Invite Team Members
**As an** admin  
**I want to** invite team members to the platform  
**So that** they can book travel using company credits

**Acceptance Criteria:**
- [ ] Admin can send invitation via email address
- [ ] Can assign role during invitation (Traveler/Manager)
- [ ] Can assign department and credit limit
- [ ] Invitation email contains signup link with token
- [ ] User completes profile (name, phone, passport info optional)
- [ ] Invited user appears in user list with "Pending" status
- [ ] Status changes to "Active" after signup completion
- [ ] Can resend invitation if not accepted within 7 days

**Priority:** P0  
**Story Points:** 8

---

#### Story 1.3: Bulk User Import
**As an** admin  
**I want to** upload multiple users via CSV  
**So that** I can onboard my team quickly

**Acceptance Criteria:**
- [ ] Download CSV template with headers: email, name, role, department, credit_limit
- [ ] Upload CSV file (max 1000 users)
- [ ] System validates CSV format and data
- [ ] Shows preview of users to be imported
- [ ] Displays errors for invalid entries
- [ ] Can proceed with valid entries only
- [ ] Sends invitation emails to all imported users
- [ ] Shows import summary (successful/failed)

**Priority:** P1  
**Story Points:** 5

---

#### Story 1.4: Manage User Roles
**As an** admin  
**I want to** change user roles and credit limits  
**So that** I can control access and spending

**Acceptance Criteria:**
- [ ] Can view list of all users with current roles
- [ ] Can change role (Traveler/Manager/Admin)
- [ ] Can update credit limit
- [ ] Can deactivate/reactivate users
- [ ] Changes take effect immediately
- [ ] User notified via email of role change
- [ ] Deactivated users cannot login
- [ ] Cannot deactivate last admin

**Priority:** P0  
**Story Points:** 5

---

### Epic 2: Travel Credit Management

#### Story 2.1: Add Credits via Card Payment
**As an** admin  
**I want to** add credits to my organization's wallet using a credit card  
**So that** my team can book travel

**Acceptance Criteria:**
- [ ] Can enter amount to add (minimum $100, maximum $50,000)
- [ ] Secure payment form (Stripe/Paystack)
- [ ] Supports Visa, Mastercard, Amex
- [ ] Shows processing indicator
- [ ] Credits added immediately on successful payment
- [ ] Confirmation email sent with receipt
- [ ] Transaction appears in credit history
- [ ] Failed payment shows clear error message
- [ ] Can retry failed payment

**Priority:** P0  
**Story Points:** 8

---

#### Story 2.2: View Credit Balance
**As a** user (any role)  
**I want to** see my available credit balance  
**So that** I know how much I can spend

**Acceptance Criteria:**
- [ ] Balance displayed on dashboard
- [ ] Shows personal credit limit (for Travelers/Managers)
- [ ] Shows organization total balance (for Admins)
- [ ] Balance updates in real-time after bookings
- [ ] Color indicator: Green (>50%), Yellow (20-50%), Red (<20%)
- [ ] Click balance to view transaction history

**Priority:** P0  
**Story Points:** 3

---

#### Story 2.3: Credit Transaction History
**As an** admin  
**I want to** view all credit transactions  
**So that** I can track spending and top-ups

**Acceptance Criteria:**
- [ ] List shows: date, user, type (added/deducted), amount, balance, description
- [ ] Filter by: date range, transaction type, user
- [ ] Sort by date (newest first by default)
- [ ] Pagination (50 per page)
- [ ] Export to CSV
- [ ] Shows booking reference for deductions

**Priority:** P0  
**Story Points:** 5

---

#### Story 2.4: Low Balance Alert
**As an** admin  
**I want to** receive alerts when credit balance is low  
**So that** I can top up before it runs out

**Acceptance Criteria:**
- [ ] Alert threshold configurable (default: $500)
- [ ] Email notification when threshold reached
- [ ] Dashboard shows warning banner
- [ ] Can set multiple alert thresholds
- [ ] Can enable/disable alerts
- [ ] Alert includes link to add credits

**Priority:** P1  
**Story Points:** 3

---

### Epic 3: Flight Booking

#### Story 3.1: Search for Flights
**As a** traveler  
**I want to** search for available flights  
**So that** I can find suitable options for my trip

**Acceptance Criteria:**
- [ ] Search form includes: origin, destination, departure date, return date (optional), passengers (1-5), class (Economy/Business)
- [ ] Origin/destination autocomplete with airport codes and city names
- [ ] Date picker shows dates from today onwards
- [ ] Can select one-way or round-trip
- [ ] Form validation (required fields, valid dates)
- [ ] Search results display within 3 seconds
- [ ] Shows loading indicator during search
- [ ] Error message if no flights found
- [ ] Can modify search without losing results

**Priority:** P0  
**Story Points:** 13

---

#### Story 3.2: View Flight Results
**As a** traveler  
**I want to** view search results with flight details  
**So that** I can compare options and choose the best flight

**Acceptance Criteria:**
- [ ] Results show: airline logo, flight number, departure/arrival times, duration, stops, price
- [ ] Shows layover duration for connecting flights
- [ ] Price displayed in USD
- [ ] Baggage allowance shown
- [ ] Can sort by: Price, Duration, Departure time
- [ ] Can filter by: Direct flights only, Airlines, Max stops, Departure time range
- [ ] Shows at least 10 results per page
- [ ] Pagination if more than 10 results
- [ ] Price includes all taxes and fees
- [ ] Click flight to view details

**Priority:** P0  
**Story Points:** 13

---

#### Story 3.3: View Flight Details
**As a** traveler  
**I want to** see detailed information about a specific flight  
**So that** I can make an informed booking decision

**Acceptance Criteria:**
- [ ] Shows complete itinerary for all segments
- [ ] Displays airline, flight numbers, aircraft type
- [ ] Shows departure/arrival terminals
- [ ] Baggage allowance (checked and carry-on)
- [ ] Fare class and ticket type
- [ ] Cancellation and change policy
- [ ] Total price breakdown (base fare, taxes, fees)
- [ ] Estimated travel time
- [ ] "Book Now" button prominent
- [ ] "Back to Results" option

**Priority:** P0  
**Story Points:** 8

---

#### Story 3.4: Book a Flight
**As a** traveler  
**I want to** book a selected flight  
**So that** I can secure my travel arrangement

**Acceptance Criteria:**
- [ ] Passenger information form: First name, Last name, Date of birth, Passport number, Nationality, Contact email, Phone
- [ ] Form pre-filled with user profile data if available
- [ ] All fields validated (required, format)
- [ ] Can save passenger info to profile for future bookings
- [ ] Review page shows flight details + passenger info + total cost
- [ ] Displays credit balance and remaining balance after booking
- [ ] Cannot proceed if insufficient credits
- [ ] Shows if approval required
- [ ] Terms and conditions checkbox
- [ ] "Confirm Booking" button
- [ ] Loading indicator during booking process

**Priority:** P0  
**Story Points:** 13

---

#### Story 3.5: Receive Booking Confirmation
**As a** traveler  
**I want to** receive confirmation after booking  
**So that** I have proof of my reservation

**Acceptance Criteria:**
- [ ] Confirmation page shows: booking reference, flight details, passenger info, total cost
- [ ] Status displayed (Confirmed or Pending Approval)
- [ ] Email sent immediately with booking details
- [ ] E-ticket attached to email (PDF) if confirmed
- [ ] Email includes airline booking reference
- [ ] Can download confirmation PDF from platform
- [ ] Booking appears in "My Trips"
- [ ] Credits deducted immediately (or held if pending approval)

**Priority:** P0  
**Story Points:** 8

---

### Epic 4: Hotel Booking

#### Story 4.1: Search for Hotels
**As a** traveler  
**I want to** search for hotels at my destination  
**So that** I can find suitable accommodation

**Acceptance Criteria:**
- [ ] Search form includes: City/hotel name, Check-in date, Check-out date, Number of rooms (1-3), Guests per room (1-4)
- [ ] City autocomplete with major cities
- [ ] Date picker prevents past dates and invalid ranges
- [ ] Minimum stay 1 night
- [ ] Form validation
- [ ] Search results display within 3 seconds
- [ ] Shows loading indicator
- [ ] Error message if no hotels found
- [ ] Displays number of results found

**Priority:** P0  
**Story Points:** 13

---

#### Story 4.2: View Hotel Results
**As a** traveler  
**I want to** browse available hotels with key information  
**So that** I can choose the best option

**Acceptance Criteria:**
- [ ] Results show: Hotel name, Main image, Star rating, Price per night, Total price, Guest rating (if available)
- [ ] Shows key amenities (WiFi, Breakfast, Parking, Pool)
- [ ] Distance from city center/airport
- [ ] Cancellation policy indicator (Free cancellation vs Non-refundable)
- [ ] Can sort by: Price (low to high), Star rating, Guest rating
- [ ] Can filter by: Price range, Star rating (3-5), Amenities, Cancellation policy
- [ ] Shows 15 results per page
- [ ] Pagination
- [ ] Click hotel to view details

**Priority:** P0  
**Story Points:** 13

---

#### Story 4.3: View Hotel Details
**As a** traveler  
**I want to** see comprehensive hotel information  
**So that** I can make an informed booking decision

**Acceptance Criteria:**
- [ ] Photo gallery (5-10 images, clickable for full view)
- [ ] Hotel description
- [ ] Full amenities list with icons
- [ ] Address with map (embedded Google Maps)
- [ ] Guest reviews section (if available)
- [ ] Check-in/check-out times
- [ ] Available room types with individual pricing
- [ ] Room features (bed type, size, view)
- [ ] Cancellation policy details
- [ ] "Select Room" button for each room type
- [ ] "Back to Results" option

**Priority:** P0  
**Story Points:** 13

---

#### Story 4.4: Book a Hotel
**As a** traveler  
**I want to** book a hotel room  
**So that** I can secure my accommodation

**Acceptance Criteria:**
- [ ] Guest information form (same as flight booking)
- [ ] Special requests text field (early check-in, high floor, etc.)
- [ ] Estimated arrival time dropdown
- [ ] Review page shows: Hotel details, Room type, Check-in/out dates, Guest info, Total cost
- [ ] Displays credit balance and remaining balance
- [ ] Cannot proceed if insufficient credits
- [ ] Shows if approval required
- [ ] Cancellation policy clearly stated
- [ ] Terms checkbox
- [ ] "Confirm Booking" button
- [ ] Loading indicator during booking

**Priority:** P0  
**Story Points:** 13

---

#### Story 4.5: Receive Hotel Confirmation
**As a** traveler  
**I want to** receive confirmation of my hotel booking  
**So that** I have my reservation details

**Acceptance Criteria:**
- [ ] Confirmation page shows: Booking reference, Hotel details, Room type, Dates, Guest info, Total cost
- [ ] Status displayed (Confirmed or Pending Approval)
- [ ] Email sent with booking details
- [ ] Hotel voucher attached (PDF) if confirmed
- [ ] Email includes hotel booking reference
- [ ] Can download voucher from platform
- [ ] Booking appears in "My Trips"
- [ ] Credits deducted (or held if pending)
- [ ] Instructions for hotel contact if needed

**Priority:** P0  
**Story Points:** 8

---

### Epic 5: Approval Workflow

#### Story 5.1: Configure Approval Settings
**As an** admin  
**I want to** set up approval requirements  
**So that** I can control booking authorizations

**Acceptance Criteria:**
- [ ] Toggle: Require approval for all bookings (Yes/No)
- [ ] Set approval threshold (e.g., bookings over $X need approval)
- [ ] Assign approvers to individual users
- [ ] Assign default approver for organization
- [ ] Can set auto-approval for specific users (VIPs)
- [ ] Settings saved and applied to new bookings
- [ ] Changes don't affect pending approvals
- [ ] Confirmation message on save

**Priority:** P0  
**Story Points:** 8

---

#### Story 5.2: Submit Booking for Approval
**As a** traveler  
**I want to** submit my booking for approval  
**So that** I can get authorization to travel

**Acceptance Criteria:**
- [ ] After booking, status shows "Pending Approval"
- [ ] Reason for travel field (required)
- [ ] Can add notes for approver
- [ ] Confirmation page shows "Pending Approval" status
- [ ] Email notification to approver
- [ ] Credits held (not deducted yet)
- [ ] Booking visible in "My Trips" with pending status
- [ ] Cannot modify booking while pending

**Priority:** P0  
**Story Points:** 8

---

#### Story 5.3: Review and Approve Bookings
**As a** manager  
**I want to** review and approve booking requests  
**So that** I can authorize team travel

**Acceptance Criteria:**
- [ ] Pending approvals shown on dashboard
- [ ] Email notification includes booking summary and approve/reject links
- [ ] Approval page shows: Traveler name, Trip details (destination, dates), Flight/hotel details, Total cost, Reason for travel, Traveler notes
- [ ] "Approve" and "Reject" buttons prominent
- [ ] Approve: Credits deducted, booking confirmed, traveler notified via email, booking reference generated
- [ ] Reject: Must provide reason, Credits released, traveler notified with reason, booking cancelled
- [ ] Can approve from email link or platform
- [ ] Approved booking moves to "Confirmed" status
- [ ] Approval history tracked (who approved, when)

**Priority:** P0  
**Story Points:** 13

---

#### Story 5.4: View Approval History
**As a** manager or admin  
**I want to** see all approval decisions  
**So that** I can track authorization history

**Acceptance Criteria:**
- [ ] List shows: Date, Traveler, Destination, Cost, Status (Approved/Rejected), Approver, Decision date
- [ ] Filter by: Date range, Status, Traveler, Approver
- [ ] Search by booking reference
- [ ] Click to view full booking details
- [ ] Export to CSV
- [ ] Shows approval notes if any

**Priority:** P1  
**Story Points:** 5

---

### Epic 6: Dashboard & Reporting

#### Story 6.1: Admin Dashboard
**As an** admin  
**I want to** see key metrics and activities  
**So that** I can monitor travel program performance

**Acceptance Criteria:**
- [ ] Summary cards show (last 30 days): Total bookings, Total spend, Average cost per booking, Pending approvals count
- [ ] Credit balance prominently displayed
- [ ] Chart: Spend trend (last 6 months)
- [ ] Recent bookings table (last 10): Date, Traveler, Destination, Cost, Status
- [ ] Quick actions: Add credits, Invite user, View all bookings
- [ ] Low balance warning if applicable
- [ ] Upcoming trips (next 7 days)

**Priority:** P0  
**Story Points:** 13

---

#### Story 6.2: Traveler Dashboard
**As a** traveler  
**I want to** see my trips and credit balance  
**So that** I can manage my travel

**Acceptance Criteria:**
- [ ] My credit balance displayed
- [ ] Upcoming trips section (next 30 days): Destination, Dates, Booking type, Status
- [ ] Past trips section (last 3 months)
- [ ] Quick search: "Book a flight" and "Book a hotel" buttons
- [ ] Pending approvals section if any
- [ ] Click trip to view full details

**Priority:** P0  
**Story Points:** 8

---

#### Story 6.3: View My Trips
**As a** traveler  
**I want to** see all my bookings in one place  
**So that** I can manage my travel itinerary

**Acceptance Criteria:**
- [ ] Tabs: Upcoming, Past, Cancelled
- [ ] Each trip shows: Thumbnail image, Destination, Travel dates, Type (flight/hotel), Status, Total cost, Booking reference
- [ ] Sort by: Date (nearest first for upcoming), Date (recent first for past)
- [ ] Filter by: Type, Date range
- [ ] Click trip to view full details
- [ ] Can download confirmation/e-ticket
- [ ] Empty state message if no trips

**Priority:** P0  
**Story Points:** 8

---

#### Story 6.4: View Trip Details
**As a** user  
**I want to** see complete details of a specific booking  
**So that** I have all necessary travel information

**Acceptance Criteria:**
- [ ] Shows booking type (flight or hotel)
- [ ] Complete itinerary with all details
- [ ] Booking reference and confirmation number
- [ ] Status badge (Confirmed, Pending, Cancelled)
- [ ] Passenger/guest information
- [ ] Cost breakdown
- [ ] Date booked and booked by
- [ ] Approver name if applicable
- [ ] Download buttons: E-ticket (flights), Voucher (hotels), Invoice
- [ ] Contact support button
- [ ] For upcoming trips, shows countdown (X days until departure)

**Priority:** P0  
**Story Points:** 8

---

#### Story 6.5: Generate Bookings Report
**As an** admin or manager  
**I want to** generate reports on bookings  
**So that** I can analyze travel spend

**Acceptance Criteria:**
- [ ] Filter options: Date range, User, Department, Status, Type (flight/hotel)
- [ ] Table shows: Date, Traveler, Department, Destination, Type, Cost, Status, Booking reference
- [ ] Sort by any column
- [ ] Summary row: Total bookings, Total cost
- [ ] Export to CSV
- [ ] Save filter preferences
- [ ] Pagination (100 per page)
- [ ] Clear filters button

**Priority:** P0  
**Story Points:** 8

---

#### Story 6.6: View Spend Analytics
**As an** admin  
**I want to** visualize spending patterns  
**So that** I can identify trends and optimize costs

**Acceptance Criteria:**
- [ ] Bar chart: Monthly spend (last 12 months)
- [ ] Pie chart: Spend by type (flight vs hotel)
- [ ] Pie chart: Spend by department
- [ ] Top 5 travelers by spend
- [ ] Top 5 destinations
- [ ] Average booking value
- [ ] Can select date range
- [ ] Export charts as images
- [ ] Export underlying data as CSV

**Priority:** P1  
**Story Points:** 13

---

### Epic 7: Support & Help

#### Story 7.1: Access Help Center
**As a** user  
**I want to** find answers to common questions  
**So that** I can resolve issues without contacting support

**Acceptance Criteria:**
- [ ] Help link in navigation menu
- [ ] FAQ page with categories: Getting Started, Bookings, Credits, Approvals, Account
- [ ] At least 15 FAQ items
- [ ] Searchable FAQs
- [ ] Expandable/collapsible answers
- [ ] "Was this helpful?" feedback buttons
- [ ] Links to related articles
- [ ] Contact support button if answer not found

**Priority:** P1  
**Story Points:** 5

---

#### Story 7.2: Contact Support
**As a** user  
**I want to** contact support when I need help  
**So that** I can get assistance with my issue

**Acceptance Criteria:**
- [ ] Contact form with fields: Name (pre-filled), Email (pre-filled), Subject, Message, Category dropdown
- [ ] Optional: Upload attachment (screenshot)
- [ ] Support email address visible
- [ ] Expected response time stated (24 hours)
- [ ] Confirmation message after submission
- [ ] Confirmation email sent
- [ ] Ticket reference number generated
- [ ] Auto-reply email with ticket number

**Priority:** P0  
**Story Points:** 5

---

### Epic 8: Authentication & Security

#### Story 8.1: User Login
**As a** registered user  
**I want to** log into my account  
**So that** I can access the platform

**Acceptance Criteria:**
- [ ] Login form with email and password
- [ ] "Remember me" checkbox
- [ ] Form validation
- [ ] Error message for invalid credentials
- [ ] Account lockout after 5 failed attempts
- [ ] "Forgot password?" link
- [ ] Redirect to dashboard after successful login
- [ ] Session expires after 24 hours of inactivity

**Priority:** P0  
**Story Points:** 5

---

#### Story 8.2: Password Reset
**As a** user  
**I want to** reset my password if I forget it  
**So that** I can regain access to my account

**Acceptance Criteria:**
- [ ] "Forgot password" page with email input
- [ ] Sends reset link to email
- [ ] Reset link expires after 1 hour
- [ ] Reset page allows setting new password
- [ ] Password strength indicator
- [ ] Password requirements shown (min 8 chars, uppercase, number, special char)
- [ ] Confirmation message after successful reset
- [ ] Auto-login after reset
- [ ] Old password immediately invalidated

**Priority:** P0  
**Story Points:** 5

---

#### Story 8.3: Update Profile
**As a** user  
**I want to** update my profile information  
**So that** my details are current

**Acceptance Criteria:**
- [ ] Profile page shows: Name, Email (read-only), Phone, Department (read-only for non-admins), Passport number, Date of birth, Nationality
- [ ] Can update editable fields
- [ ] Form validation
- [ ] "Save Changes" button
- [ ] Confirmation message on save
- [ ] Changes reflected immediately
- [ ] Can change password (requires current password)

**Priority:** P0  
**Story Points:** 5

---

#### Story 8.4: Logout
**As a** user  
**I want to** securely log out  
**So that** my account remains protected

**Acceptance Criteria:**
- [ ] Logout option in user menu
- [ ] Session immediately terminated
- [ ] Redirected to login page
- [ ] Confirmation message "You have been logged out"
- [ ] Cannot access protected pages after logout
- [ ] All tabs/windows logged out

**Priority:** P0  
**Story Points:** 2

---

## Story Point Summary

| Epic | Total Story Points |
|------|-------------------|
| Epic 1: Organization & User Management | 23 |
| Epic 2: Travel Credit Management | 19 |
| Epic 3: Flight Booking | 68 |
| Epic 4: Hotel Booking | 68 |
| Epic 5: Approval Workflow | 34 |
| Epic 6: Dashboard & Reporting | 58 |
| Epic 7: Support & Help | 10 |
| Epic 8: Authentication & Security | 17 |
| **TOTAL** | **297 points** |

**Estimated Velocity:** 40-50 points per 2-week sprint  
**Estimated Duration:** 12-15 sprints (24-30 weeks / 6-7.5 months)

Note: Initial estimate of 3-4 months was aggressive. With full user story breakdown, a more realistic timeline is 6-7 months for complete MVP, or 4 months for absolute minimal viable features (focusing only on P0 stories with reduced scope).

---

## Next Steps

1. **Validate with customers**: Interview 10-15 potential customers
2. **Finalize tech stack**: Choose specific technologies
3. **Design mockups**: Create high-fidelity designs for all core flows
4. **Set up infrastructure**: Cloud accounts, CI/CD, monitoring
5. **Start development**: Sprint 1 begins!
6. **Weekly progress reviews**: Track against timeline
7. **Beta recruitment**: Start lining up pilot customers

---

## Appendix: MVP Feature Checklist

**Must Have (P0)**
- [x] User authentication and roles
- [x] Organization setup
- [x] Credit management (add, track, deduct)
- [x] Flight search and booking
- [x] Hotel search and booking
- [x] Single-level approval workflow
- [x] Basic dashboard
- [x] Booking confirmation emails
- [x] Simple reporting

**Should Have (P1 - if time permits)**
- [ ] Bulk user import
- [ ] More payment methods
- [ ] Booking cancellation (self-service)
- [ ] Better search filters
- [ ] Mobile-optimized design

**Won't Have (P2 - Post-MVP)**
- [ ] Native mobile apps
- [ ] Multi-city flights
- [ ] Ground transportation
- [ ] Expense management
- [ ] Advanced analytics
- [ ] SSO integration
- [ ] API access