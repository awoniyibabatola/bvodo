-- Bookings Table
-- Stores all booking records (flights and hotels)

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Booking Details
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    booking_type VARCHAR(20) NOT NULL CHECK (booking_type IN ('flight', 'hotel')),

    -- Trip Information
    origin VARCHAR(100),
    destination VARCHAR(100) NOT NULL,
    departure_date DATE NOT NULL,
    return_date DATE,
    is_round_trip BOOLEAN DEFAULT false,

    -- Passenger/Guest Information
    passengers INTEGER DEFAULT 1 CHECK (passengers > 0 AND passengers <= 9),
    passenger_details JSONB NOT NULL,

    -- Pricing
    base_price DECIMAL(12, 2) NOT NULL,
    taxes_fees DECIMAL(12, 2) DEFAULT 0.00,
    total_price DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Booking Status
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',
        'pending_approval',
        'approved',
        'confirmed',
        'cancelled',
        'rejected',
        'completed',
        'failed'
    )),

    -- Approval Workflow
    requires_approval BOOLEAN DEFAULT false,
    approver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_notes TEXT,
    rejection_reason TEXT,

    -- Travel Purpose
    travel_reason TEXT,
    notes TEXT,

    -- Provider Information
    provider_name VARCHAR(100),
    provider_booking_reference VARCHAR(100),
    provider_confirmation_number VARCHAR(100),

    -- Documents
    confirmation_url VARCHAR(500),
    ticket_url VARCHAR(500),
    invoice_url VARCHAR(500),

    -- Additional Data
    booking_data JSONB,

    -- Metadata
    booked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT valid_prices CHECK (
        base_price >= 0 AND
        taxes_fees >= 0 AND
        total_price >= 0 AND
        total_price = base_price + taxes_fees
    ),
    CONSTRAINT valid_dates CHECK (
        departure_date >= CURRENT_DATE AND
        (return_date IS NULL OR return_date >= departure_date)
    )
);

-- Indexes
CREATE INDEX idx_bookings_organization_id ON bookings(organization_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_booking_reference ON bookings(booking_reference);
CREATE INDEX idx_bookings_booking_type ON bookings(booking_type);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_approver_id ON bookings(approver_id);
CREATE INDEX idx_bookings_departure_date ON bookings(departure_date);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);
CREATE INDEX idx_bookings_destination ON bookings(destination);

-- Composite indexes for common queries
CREATE INDEX idx_bookings_org_status ON bookings(organization_id, status);
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX idx_bookings_org_type ON bookings(organization_id, booking_type);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_bookings_updated_at();

-- Comments
COMMENT ON TABLE bookings IS 'Stores all flight and hotel bookings';
COMMENT ON COLUMN bookings.booking_reference IS 'Internal unique booking reference';
COMMENT ON COLUMN bookings.booking_type IS 'Type of booking: flight or hotel';
COMMENT ON COLUMN bookings.passenger_details IS 'JSON array of passenger/guest information';
COMMENT ON COLUMN bookings.booking_data IS 'Additional booking data specific to flight or hotel';
COMMENT ON COLUMN bookings.provider_booking_reference IS 'Booking reference from Amadeus/Booking.com';
COMMENT ON COLUMN bookings.requires_approval IS 'Whether this booking needs manager approval';
