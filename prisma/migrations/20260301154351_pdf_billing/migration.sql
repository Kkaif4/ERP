-- AlterTable
ALTER TABLE "BusinessConfig" ADD COLUMN     "defaultPageSize" TEXT NOT NULL DEFAULT 'A4',
ADD COLUMN     "logoBase64" TEXT,
ADD COLUMN     "upiId" TEXT;
