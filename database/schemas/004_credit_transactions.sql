-- Credit Transactions Table
-- Tracks all credit additions and deductions

CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Transaction Details
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN (
        'credit_added',
        'credit_deducted',
        'credit_held',
        'credit_released',
        'credit_allocated',
        'credit_refunded'
    )),

    -- Amount
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD',

    -- Balance After Transaction
    balance_before DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,

    -- Related Records
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    payment_id UUID,

    -- Payment Information (for credit additions)
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    payment_provider VARCHAR(50),

    -- Description
    description TEXT NOT NULL,
    notes TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Constraints
    CONSTRAINT valid_balances CHECK (
        balance_before >= 0 AND
        balance_after >= 0
    )
);

-- Indexes
CREATE INDEX idx_credit_transactions_org_id ON credit_transactions(organization_id);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_booking_id ON credit_transactions(booking_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX idx_credit_transactions_payment_reference ON credit_transactions(payment_reference);

-- Composite indexes
CREATE INDEX idx_credit_transactions_org_created ON credit_transactions(organization_id, created_at DESC);
CREATE INDEX idx_credit_transactions_org_type ON credit_transactions(organization_id, transaction_type);

-- Comments
COMMENT ON TABLE credit_transactions IS 'Tracks all credit movements for organizations and users';
COMMENT ON COLUMN credit_transactions.transaction_type IS 'Type of transaction: credit_added, credit_deducted, credit_held, credit_released, credit_allocated, credit_refunded';
COMMENT ON COLUMN credit_transactions.balance_before IS 'Organization/user credit balance before transaction';
COMMENT ON COLUMN credit_transactions.balance_after IS 'Organization/user credit balance after transaction';
COMMENT ON COLUMN credit_transactions.payment_method IS 'Payment method used: card, bank_transfer, paystack, etc.';
