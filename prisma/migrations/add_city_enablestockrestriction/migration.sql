-- AlterTable
ALTER TABLE "public"."BusinessConfig" ADD COLUMN     "city" TEXT,
ADD COLUMN     "enableStockRestriction" BOOLEAN NOT NULL DEFAULT false;
