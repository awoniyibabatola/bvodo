-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "confirmation_notes" TEXT,
ADD COLUMN     "confirmed_by_at" TIMESTAMP(3),
ADD COLUMN     "confirmer_id" TEXT,
ADD COLUMN     "rejected_by" TEXT;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_confirmer_id_fkey" FOREIGN KEY ("confirmer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
