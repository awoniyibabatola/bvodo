-- Organizations Table
-- Stores company/organization information

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

    -- Credit Configuration
    total_credits DECIMAL(12, 2) DEFAULT 0.00,
    available_credits DECIMAL(12, 2) DEFAULT 0.00,
    credit_currency VARCHAR(3) DEFAULT 'USD',
    low_balance_threshold DECIMAL(12, 2) DEFAULT 500.00,

    -- Approval Settings
    require_approval_all BOOLEAN DEFAULT false,
    approval_threshold DECIMAL(12, 2) DEFAULT 0.00,

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
    subscription_plan VARCHAR(50) DEFAULT 'free',

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Indexes
    CONSTRAINT valid_credits CHECK (available_credits >= 0),
    CONSTRAINT valid_threshold CHECK (low_balance_threshold >= 0)
);

-- Indexes for better query performance
CREATE INDEX idx_organizations_subdomain ON organizations(subdomain);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_created_at ON organizations(created_at);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_organizations_updated_at();

-- Comments
COMMENT ON TABLE organizations IS 'Stores company/organization information';
COMMENT ON COLUMN organizations.subdomain IS 'Unique subdomain for organization (e.g., acmecorp)';
COMMENT ON COLUMN organizations.total_credits IS 'Total credits ever added to the organization';
COMMENT ON COLUMN organizations.available_credits IS 'Current available credits for booking';
COMMENT ON COLUMN organizations.low_balance_threshold IS 'Threshold for low balance alerts';
COMMENT ON COLUMN organizations.require_approval_all IS 'If true, all bookings require approval';
COMMENT ON COLUMN organizations.approval_threshold IS 'Bookings above this amount require approval';
