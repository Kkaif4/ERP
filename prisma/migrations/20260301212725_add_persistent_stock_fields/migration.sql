/*
  Warnings:

  - You are about to drop the column `isActive` on the `Item` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Item" DROP COLUMN "isActive",
ADD COLUMN     "availableKg" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "availableUnits" DECIMAL(12,2) NOT NULL DEFAULT 0;
