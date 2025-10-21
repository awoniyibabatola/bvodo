-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "exchange_rate" DECIMAL(10,6),
ADD COLUMN     "total_price_org_currency" DECIMAL(12,2);
