-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "group_name" VARCHAR(200),
ADD COLUMN     "is_group_booking" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "number_of_travelers" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "flight_bookings" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "airline" VARCHAR(100) NOT NULL,
    "airline_code" VARCHAR(10),
    "flight_number" VARCHAR(20) NOT NULL,
    "departure_airport" VARCHAR(100) NOT NULL,
    "departure_airport_code" VARCHAR(10) NOT NULL,
    "arrival_airport" VARCHAR(100) NOT NULL,
    "arrival_airport_code" VARCHAR(10) NOT NULL,
    "departure_time" TIMESTAMP(3) NOT NULL,
    "arrival_time" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "cabin_class" VARCHAR(50) NOT NULL,
    "stops" INTEGER NOT NULL DEFAULT 0,
    "layover_info" JSONB,
    "baggage_allowance" VARCHAR(200),
    "carry_on_allowance" VARCHAR(200),
    "seat_numbers" JSONB,
    "aircraft" VARCHAR(100),
    "terminal" VARCHAR(50),
    "gate" VARCHAR(50),
    "e_ticket_numbers" JSONB,
    "pnr" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flight_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_bookings" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "hotel_id" VARCHAR(100) NOT NULL,
    "hotel_name" VARCHAR(200) NOT NULL,
    "hotel_chain" VARCHAR(100),
    "address" VARCHAR(500) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "country" VARCHAR(100) NOT NULL,
    "postal_code" VARCHAR(20),
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "check_in_date" DATE NOT NULL,
    "check_out_date" DATE NOT NULL,
    "number_of_nights" INTEGER NOT NULL,
    "number_of_rooms" INTEGER NOT NULL DEFAULT 1,
    "room_type" VARCHAR(100) NOT NULL,
    "room_description" TEXT,
    "bed_type" VARCHAR(100),
    "guests_per_room" INTEGER NOT NULL DEFAULT 1,
    "amenities" JSONB,
    "meal_plan" VARCHAR(50),
    "special_requests" TEXT,
    "room_numbers" JSONB,
    "hotel_phone" VARCHAR(50),
    "hotel_email" VARCHAR(200),
    "cancellation_policy" TEXT,
    "free_cancellation_until" TIMESTAMP(3),
    "confirmation_number" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotel_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_applications" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "requested_amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "company_name" VARCHAR(200) NOT NULL,
    "registration_number" VARCHAR(100),
    "business_type" VARCHAR(100),
    "industry" VARCHAR(100),
    "year_established" INTEGER,
    "number_of_employees" INTEGER,
    "annual_revenue" DECIMAL(15,2),
    "contact_person_name" VARCHAR(200) NOT NULL,
    "contact_person_title" VARCHAR(100),
    "contact_email" VARCHAR(200) NOT NULL,
    "contact_phone" VARCHAR(50) NOT NULL,
    "business_address" VARCHAR(500) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100),
    "country" VARCHAR(100) NOT NULL,
    "postal_code" VARCHAR(20) NOT NULL,
    "bank_name" VARCHAR(200),
    "bank_account_number" VARCHAR(100),
    "tax_id" VARCHAR(100),
    "proposed_credit_term" INTEGER,
    "estimated_monthly_spend" DECIMAL(12,2),
    "documents_uploaded" JSONB,
    "status" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_notes" TEXT,
    "rejection_reason" TEXT,
    "approved_amount" DECIMAL(12,2),
    "approved_credit_term" INTEGER,
    "credit_limit_effective_date" TIMESTAMP(3),
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flight_bookings_booking_id_idx" ON "flight_bookings"("booking_id");

-- CreateIndex
CREATE INDEX "flight_bookings_flight_number_idx" ON "flight_bookings"("flight_number");

-- CreateIndex
CREATE INDEX "flight_bookings_departure_time_idx" ON "flight_bookings"("departure_time");

-- CreateIndex
CREATE INDEX "hotel_bookings_booking_id_idx" ON "hotel_bookings"("booking_id");

-- CreateIndex
CREATE INDEX "hotel_bookings_hotel_id_idx" ON "hotel_bookings"("hotel_id");

-- CreateIndex
CREATE INDEX "hotel_bookings_check_in_date_idx" ON "hotel_bookings"("check_in_date");

-- CreateIndex
CREATE INDEX "hotel_bookings_check_out_date_idx" ON "hotel_bookings"("check_out_date");

-- CreateIndex
CREATE INDEX "credit_applications_organization_id_idx" ON "credit_applications"("organization_id");

-- CreateIndex
CREATE INDEX "credit_applications_status_idx" ON "credit_applications"("status");

-- CreateIndex
CREATE INDEX "credit_applications_submitted_at_idx" ON "credit_applications"("submitted_at");

-- CreateIndex
CREATE INDEX "bookings_is_group_booking_idx" ON "bookings"("is_group_booking");

-- AddForeignKey
ALTER TABLE "flight_bookings" ADD CONSTRAINT "flight_bookings_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_bookings" ADD CONSTRAINT "hotel_bookings_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_applications" ADD CONSTRAINT "credit_applications_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
