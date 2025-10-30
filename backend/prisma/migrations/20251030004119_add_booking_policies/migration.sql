-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "applied_policy_id" TEXT,
ADD COLUMN     "policy_exception_id" TEXT,
ADD COLUMN     "policy_override_by" TEXT,
ADD COLUMN     "policy_override_reason" TEXT,
ADD COLUMN     "policy_violation" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "booking_policies" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "role" VARCHAR(20) NOT NULL,
    "policy_type" VARCHAR(30) NOT NULL,
    "flight_max_amount" DECIMAL(12,2),
    "hotel_max_amount_per_night" DECIMAL(12,2),
    "hotel_max_amount_total" DECIMAL(12,2),
    "monthly_limit" DECIMAL(12,2),
    "annual_limit" DECIMAL(12,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "allowed_flight_classes" JSONB,
    "requires_approval_above" DECIMAL(12,2),
    "auto_approve_below" DECIMAL(12,2),
    "allow_manager_override" BOOLEAN NOT NULL DEFAULT false,
    "allow_exceptions" BOOLEAN NOT NULL DEFAULT true,
    "advance_booking_days" INTEGER,
    "max_trip_duration" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "effective_from" DATE,
    "effective_to" DATE,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "booking_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_exceptions" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT,
    "booking_id" TEXT,
    "exception_type" VARCHAR(30) NOT NULL,
    "flight_max_amount" DECIMAL(12,2),
    "hotel_max_amount_per_night" DECIMAL(12,2),
    "hotel_max_amount_total" DECIMAL(12,2),
    "reason" TEXT NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "valid_from" DATE,
    "valid_to" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_usage_logs" (
    "id" TEXT NOT NULL,
    "policy_id" TEXT,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "booking_id" TEXT,
    "event_type" VARCHAR(50) NOT NULL,
    "policy_snapshot" JSONB,
    "booking_type" VARCHAR(20),
    "requested_amount" DECIMAL(12,2),
    "policy_limit" DECIMAL(12,2),
    "currency" VARCHAR(3) DEFAULT 'USD',
    "was_allowed" BOOLEAN NOT NULL DEFAULT false,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "details" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_policies_organization_id_idx" ON "booking_policies"("organization_id");

-- CreateIndex
CREATE INDEX "booking_policies_role_idx" ON "booking_policies"("role");

-- CreateIndex
CREATE INDEX "booking_policies_is_active_idx" ON "booking_policies"("is_active");

-- CreateIndex
CREATE INDEX "booking_policies_priority_idx" ON "booking_policies"("priority");

-- CreateIndex
CREATE INDEX "booking_policies_effective_from_idx" ON "booking_policies"("effective_from");

-- CreateIndex
CREATE INDEX "booking_policies_effective_to_idx" ON "booking_policies"("effective_to");

-- CreateIndex
CREATE INDEX "policy_exceptions_policy_id_idx" ON "policy_exceptions"("policy_id");

-- CreateIndex
CREATE INDEX "policy_exceptions_organization_id_idx" ON "policy_exceptions"("organization_id");

-- CreateIndex
CREATE INDEX "policy_exceptions_user_id_idx" ON "policy_exceptions"("user_id");

-- CreateIndex
CREATE INDEX "policy_exceptions_booking_id_idx" ON "policy_exceptions"("booking_id");

-- CreateIndex
CREATE INDEX "policy_exceptions_exception_type_idx" ON "policy_exceptions"("exception_type");

-- CreateIndex
CREATE INDEX "policy_exceptions_is_active_idx" ON "policy_exceptions"("is_active");

-- CreateIndex
CREATE INDEX "policy_usage_logs_policy_id_idx" ON "policy_usage_logs"("policy_id");

-- CreateIndex
CREATE INDEX "policy_usage_logs_organization_id_idx" ON "policy_usage_logs"("organization_id");

-- CreateIndex
CREATE INDEX "policy_usage_logs_user_id_idx" ON "policy_usage_logs"("user_id");

-- CreateIndex
CREATE INDEX "policy_usage_logs_booking_id_idx" ON "policy_usage_logs"("booking_id");

-- CreateIndex
CREATE INDEX "policy_usage_logs_event_type_idx" ON "policy_usage_logs"("event_type");

-- CreateIndex
CREATE INDEX "policy_usage_logs_created_at_idx" ON "policy_usage_logs"("created_at");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_applied_policy_id_fkey" FOREIGN KEY ("applied_policy_id") REFERENCES "booking_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_policy_exception_id_fkey" FOREIGN KEY ("policy_exception_id") REFERENCES "policy_exceptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_policies" ADD CONSTRAINT "booking_policies_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_policies" ADD CONSTRAINT "booking_policies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_exceptions" ADD CONSTRAINT "policy_exceptions_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "booking_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_exceptions" ADD CONSTRAINT "policy_exceptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_exceptions" ADD CONSTRAINT "policy_exceptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_exceptions" ADD CONSTRAINT "policy_exceptions_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_usage_logs" ADD CONSTRAINT "policy_usage_logs_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_usage_logs" ADD CONSTRAINT "policy_usage_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_usage_logs" ADD CONSTRAINT "policy_usage_logs_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "booking_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_usage_logs" ADD CONSTRAINT "policy_usage_logs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
