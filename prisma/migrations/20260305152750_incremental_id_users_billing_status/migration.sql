/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,incrementalId]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,incrementalId]` on the table `Farmer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,incrementalId]` on the table `Item` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `incrementalId` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `incrementalId` to the `Farmer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `incrementalId` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BillingMethod" AS ENUM ('STANDARD', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('PENDING', 'PAID');

-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "status" "BillStatus" NOT NULL DEFAULT 'PAID';

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "incrementalId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Farmer" ADD COLUMN     "incrementalId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "incrementalId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "billingMethod" "BillingMethod" NOT NULL DEFAULT 'STANDARD';

-- CreateIndex
CREATE UNIQUE INDEX "Customer_organizationId_incrementalId_key" ON "Customer"("organizationId", "incrementalId");

-- CreateIndex
CREATE UNIQUE INDEX "Farmer_organizationId_incrementalId_key" ON "Farmer"("organizationId", "incrementalId");

-- CreateIndex
CREATE UNIQUE INDEX "Item_organizationId_incrementalId_key" ON "Item"("organizationId", "incrementalId");
