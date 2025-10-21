-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postal_code" TEXT,
    "logo_url" TEXT,
    "website" TEXT,
    "total_credits" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "available_credits" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit_currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "low_balance_threshold" DECIMAL(12,2) NOT NULL DEFAULT 500,
    "require_approval_all" BOOLEAN NOT NULL DEFAULT false,
    "approval_threshold" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "subscription_plan" VARCHAR(50) NOT NULL DEFAULT 'free',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verified_at" TIMESTAMP(3),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(50),
    "date_of_birth" DATE,
    "nationality" VARCHAR(100),
    "passport_number" VARCHAR(100),
    "passport_expiry" DATE,
    "passport_country" VARCHAR(100),
    "role" VARCHAR(20) NOT NULL DEFAULT 'traveler',
    "department" VARCHAR(100),
    "credit_limit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "available_credits" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "approver_id" TEXT,
    "auto_approve" BOOLEAN NOT NULL DEFAULT false,
    "avatar_url" VARCHAR(500),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "last_login_at" TIMESTAMP(3),
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "invitation_token" VARCHAR(255),
    "invitation_sent_at" TIMESTAMP(3),
    "invitation_accepted_at" TIMESTAMP(3),
    "reset_token" VARCHAR(255),
    "reset_token_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "booking_reference" VARCHAR(50) NOT NULL,
    "booking_type" VARCHAR(20) NOT NULL,
    "origin" VARCHAR(100),
    "destination" VARCHAR(100) NOT NULL,
    "departure_date" DATE NOT NULL,
    "return_date" DATE,
    "is_round_trip" BOOLEAN NOT NULL DEFAULT false,
    "passengers" INTEGER NOT NULL DEFAULT 1,
    "passenger_details" JSONB NOT NULL,
    "base_price" DECIMAL(12,2) NOT NULL,
    "taxes_fees" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total_price" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "approver_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "approval_notes" TEXT,
    "rejection_reason" TEXT,
    "travel_reason" TEXT,
    "notes" TEXT,
    "provider_name" VARCHAR(100),
    "provider_booking_reference" VARCHAR(100),
    "provider_confirmation_number" VARCHAR(100),
    "confirmation_url" VARCHAR(500),
    "ticket_url" VARCHAR(500),
    "invoice_url" VARCHAR(500),
    "booking_data" JSONB,
    "booked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT,
    "transaction_type" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "balance_before" DECIMAL(12,2) NOT NULL,
    "balance_after" DECIMAL(12,2) NOT NULL,
    "booking_id" TEXT,
    "payment_id" TEXT,
    "payment_method" VARCHAR(50),
    "payment_reference" VARCHAR(100),
    "payment_provider" VARCHAR(50),
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_subdomain_key" ON "organizations"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_email_key" ON "organizations"("email");

-- CreateIndex
CREATE INDEX "organizations_subdomain_idx" ON "organizations"("subdomain");

-- CreateIndex
CREATE INDEX "organizations_status_idx" ON "organizations"("status");

-- CreateIndex
CREATE INDEX "users_organization_id_idx" ON "users"("organization_id");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_approver_id_idx" ON "users"("approver_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_organization_id_email_key" ON "users"("organization_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_reference_key" ON "bookings"("booking_reference");

-- CreateIndex
CREATE INDEX "bookings_organization_id_idx" ON "bookings"("organization_id");

-- CreateIndex
CREATE INDEX "bookings_user_id_idx" ON "bookings"("user_id");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_booking_type_idx" ON "bookings"("booking_type");

-- CreateIndex
CREATE INDEX "bookings_departure_date_idx" ON "bookings"("departure_date");

-- CreateIndex
CREATE INDEX "bookings_booking_reference_idx" ON "bookings"("booking_reference");

-- CreateIndex
CREATE INDEX "credit_transactions_organization_id_idx" ON "credit_transactions"("organization_id");

-- CreateIndex
CREATE INDEX "credit_transactions_user_id_idx" ON "credit_transactions"("user_id");

-- CreateIndex
CREATE INDEX "credit_transactions_booking_id_idx" ON "credit_transactions"("booking_id");

-- CreateIndex
CREATE INDEX "credit_transactions_transaction_type_idx" ON "credit_transactions"("transaction_type");

-- CreateIndex
CREATE INDEX "credit_transactions_created_at_idx" ON "credit_transactions"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
