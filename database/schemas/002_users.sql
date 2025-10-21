-- Users Table
-- Stores user accounts for the platform

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Authentication
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP WITH TIME ZONE,

    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    date_of_birth DATE,
    nationality VARCHAR(100),

    -- Passport Information (for bookings)
    passport_number VARCHAR(100),
    passport_expiry DATE,
    passport_country VARCHAR(100),

    -- Role & Permissions
    role VARCHAR(20) NOT NULL DEFAULT 'traveler' CHECK (role IN ('admin', 'manager', 'traveler')),
    department VARCHAR(100),

    -- Credit Allocation
    credit_limit DECIMAL(12, 2) DEFAULT 0.00,
    available_credits DECIMAL(12, 2) DEFAULT 0.00,

    -- Approval Settings
    approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    auto_approve BOOLEAN DEFAULT false,

    -- Profile
    avatar_url VARCHAR(500),

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'inactive', 'suspended')),
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,

    -- Invitation
    invitation_token VARCHAR(255),
    invitation_sent_at TIMESTAMP WITH TIME ZONE,
    invitation_accepted_at TIMESTAMP WITH TIME ZONE,

    -- Password Reset
    reset_token VARCHAR(255),
    reset_token_expires_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT unique_email_per_org UNIQUE (organization_id, email),
    CONSTRAINT valid_credit_limit CHECK (credit_limit >= 0),
    CONSTRAINT valid_available_credits CHECK (available_credits >= 0 AND available_credits <= credit_limit)
);

-- Indexes
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_approver_id ON users(approver_id);
CREATE INDEX idx_users_invitation_token ON users(invitation_token);
CREATE INDEX idx_users_reset_token ON users(reset_token);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- Comments
COMMENT ON TABLE users IS 'Stores user accounts with role-based access';
COMMENT ON COLUMN users.role IS 'User role: admin (full access), manager (can approve), traveler (can book)';
COMMENT ON COLUMN users.credit_limit IS 'Maximum credits this user can have';
COMMENT ON COLUMN users.available_credits IS 'Current available credits for this user';
COMMENT ON COLUMN users.approver_id IS 'User who approves this user bookings';
COMMENT ON COLUMN users.auto_approve IS 'If true, bookings are auto-approved for this user';
COMMENT ON COLUMN users.failed_login_attempts IS 'Counter for failed login attempts';
COMMENT ON COLUMN users.locked_until IS 'Account locked until this timestamp after too many failed attempts';
