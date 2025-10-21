-- Corporate Travel Platform Database Initialization
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    country VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    logo_url VARCHAR(500),
    website VARCHAR(255),
    total_credits DECIMAL(12, 2) DEFAULT 0.00,
    available_credits DECIMAL(12, 2) DEFAULT 0.00,
    credit_currency VARCHAR(3) DEFAULT 'USD',
    low_balance_threshold DECIMAL(12, 2) DEFAULT 500.00,
    require_approval_all BOOLEAN DEFAULT false,
    approval_threshold DECIMAL(12, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    subscription_plan VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_credits CHECK (available_credits >= 0),
    CONSTRAINT valid_threshold CHECK (low_balance_threshold >= 0)
);

CREATE INDEX idx_organizations_subdomain ON organizations(subdomain);
CREATE INDEX idx_organizations_status ON organizations(status);

-- ============================================================================
-- USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    nationality VARCHAR(100),
    passport_number VARCHAR(100),
    passport_expiry DATE,
    passport_country VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'traveler' CHECK (role IN ('admin', 'manager', 'traveler')),
    department VARCHAR(100),
    credit_limit DECIMAL(12, 2) DEFAULT 0.00,
    available_credits DECIMAL(12, 2) DEFAULT 0.00,
    approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    auto_approve BOOLEAN DEFAULT false,
    avatar_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'inactive', 'suspended')),
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    invitation_token VARCHAR(255),
    invitation_sent_at TIMESTAMP WITH TIME ZONE,
    invitation_accepted_at TIMESTAMP WITH TIME ZONE,
    reset_token VARCHAR(255),
    reset_token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_email_per_org UNIQUE (organization_id, email),
    CONSTRAINT valid_credit_limit CHECK (credit_limit >= 0),
    CONSTRAINT valid_available_credits CHECK (available_credits >= 0 AND available_credits <= credit_limit)
);

CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ============================================================================
-- BOOKINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    booking_type VARCHAR(20) NOT NULL CHECK (booking_type IN ('flight', 'hotel')),
    origin VARCHAR(100),
    destination VARCHAR(100) NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE,
    is_round_trip BOOLEAN DEFAULT false,
    passengers INTEGER DEFAULT 1 CHECK (passengers > 0 AND passengers <= 9),
    passenger_details JSONB NOT NULL,
    base_price DECIMAL(12, 2) NOT NULL,
    taxes_fees DECIMAL(12, 2) DEFAULT 0.00,
    total_price DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'pending_approval', 'approved', 'confirmed',
        'cancelled', 'rejected', 'completed', 'failed'
    )),
    requires_approval BOOLEAN DEFAULT false,
    approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    rejection_reason TEXT,
    travel_reason TEXT,
    notes TEXT,
    provider_name VARCHAR(100),
    provider_booking_reference VARCHAR(100),
    provider_confirmation_number VARCHAR(100),
    confirmation_url VARCHAR(500),
    ticket_url VARCHAR(500),
    invoice_url VARCHAR(500),
    booking_data JSONB,
    booked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_prices CHECK (
        base_price >= 0 AND taxes_fees >= 0 AND total_price >= 0 AND
        total_price = base_price + taxes_fees
    ),
    CONSTRAINT valid_dates CHECK (
        departure_date >= CURRENT_DATE AND
        (return_date IS NULL OR return_date >= departure_date)
    )
);

CREATE INDEX idx_bookings_organization_id ON bookings(organization_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_booking_reference ON bookings(booking_reference);

-- ============================================================================
-- CREDIT TRANSACTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN (
        'credit_added', 'credit_deducted', 'credit_held',
        'credit_released', 'credit_allocated', 'credit_refunded'
    )),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    balance_before DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    payment_id UUID,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    payment_provider VARCHAR(50),
    description TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT valid_balances CHECK (balance_before >= 0 AND balance_after >= 0)
);

CREATE INDEX idx_credit_transactions_org_id ON credit_transactions(organization_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA (Optional - for development)
-- ============================================================================

-- Uncomment for development seeding
-- INSERT INTO organizations (name, subdomain, email, country, available_credits)
-- VALUES ('Demo Corp', 'democorp', 'admin@democorp.com', 'Nigeria', 10000.00);
