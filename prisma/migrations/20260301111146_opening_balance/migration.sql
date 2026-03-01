-- CreateEnum
CREATE TYPE "BalanceType" AS ENUM ('DUE', 'ADVANCE');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "openingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "openingBalanceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "openingBalanceType" "BalanceType" NOT NULL DEFAULT 'DUE';

-- AlterTable
ALTER TABLE "Farmer" ADD COLUMN     "openingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "openingBalanceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "openingBalanceType" "BalanceType" NOT NULL DEFAULT 'DUE';
