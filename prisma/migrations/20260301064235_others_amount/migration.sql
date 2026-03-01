-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "othersAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "othersNote" TEXT;
