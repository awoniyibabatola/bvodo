-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "checkout_session_id" VARCHAR(200),
ADD COLUMN     "payment_status" VARCHAR(30) NOT NULL DEFAULT 'pending',
ADD COLUMN     "provider" VARCHAR(20) NOT NULL DEFAULT 'duffel',
ADD COLUMN     "provider_order_id" VARCHAR(100),
ADD COLUMN     "provider_raw_data" JSONB;

-- CreateIndex
CREATE INDEX "bookings_provider_idx" ON "bookings"("provider");

-- CreateIndex
CREATE INDEX "bookings_provider_order_id_idx" ON "bookings"("provider_order_id");

-- CreateIndex
CREATE INDEX "bookings_payment_status_idx" ON "bookings"("payment_status");
