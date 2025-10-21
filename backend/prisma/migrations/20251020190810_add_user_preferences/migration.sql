-- AlterTable
ALTER TABLE "users" ADD COLUMN     "preferred_currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
ADD COLUMN     "preferred_language" VARCHAR(10) DEFAULT 'en',
ADD COLUMN     "preferred_timezone" VARCHAR(50) DEFAULT 'UTC';
