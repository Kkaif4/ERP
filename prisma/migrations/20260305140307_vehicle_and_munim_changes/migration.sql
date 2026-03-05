-- AlterTable
ALTER TABLE "Bill" ADD COLUMN     "munimRef" INTEGER,
ADD COLUMN     "vehicleAgentId" UUID;

-- CreateTable
CREATE TABLE "VehicleAgent" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "vehicleNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleAgent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VehicleAgent_organizationId_idx" ON "VehicleAgent"("organizationId");

-- CreateIndex
CREATE INDEX "VehicleAgent_name_idx" ON "VehicleAgent"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleAgent_organizationId_name_key" ON "VehicleAgent"("organizationId", "name");

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_vehicleAgentId_fkey" FOREIGN KEY ("vehicleAgentId") REFERENCES "VehicleAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleAgent" ADD CONSTRAINT "VehicleAgent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
