-- AlterTable
ALTER TABLE "hotel_bookings" ADD COLUMN     "is_multi_room" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "room_booking_items" (
    "id" TEXT NOT NULL,
    "hotel_booking_id" TEXT NOT NULL,
    "room_number" INTEGER NOT NULL,
    "offer_id" VARCHAR(100) NOT NULL,
    "room_type" VARCHAR(100) NOT NULL,
    "bed_type" VARCHAR(100),
    "room_description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "number_of_guests" INTEGER NOT NULL,
    "assigned_room_number" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "room_booking_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guests" (
    "id" TEXT NOT NULL,
    "room_booking_id" TEXT NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "date_of_birth" VARCHAR(50) NOT NULL,
    "address" VARCHAR(500),
    "city" VARCHAR(100),
    "country" VARCHAR(100),
    "passport_number" VARCHAR(100),
    "passport_expiry" VARCHAR(50),
    "passport_country" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "room_booking_items_hotel_booking_id_idx" ON "room_booking_items"("hotel_booking_id");

-- CreateIndex
CREATE INDEX "room_booking_items_room_number_idx" ON "room_booking_items"("room_number");

-- CreateIndex
CREATE INDEX "guests_room_booking_id_idx" ON "guests"("room_booking_id");

-- CreateIndex
CREATE INDEX "guests_email_idx" ON "guests"("email");

-- CreateIndex
CREATE INDEX "hotel_bookings_is_multi_room_idx" ON "hotel_bookings"("is_multi_room");

-- AddForeignKey
ALTER TABLE "room_booking_items" ADD CONSTRAINT "room_booking_items_hotel_booking_id_fkey" FOREIGN KEY ("hotel_booking_id") REFERENCES "hotel_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_room_booking_id_fkey" FOREIGN KEY ("room_booking_id") REFERENCES "room_booking_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
