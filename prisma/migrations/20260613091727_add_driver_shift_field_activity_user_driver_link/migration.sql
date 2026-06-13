-- AlterTable
ALTER TABLE "User" ADD COLUMN "driverId" TEXT;
ALTER TABLE "User" ADD CONSTRAINT "User_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_driverId_key" UNIQUE ("driverId");

-- CreateTable
CREATE TABLE "DriverShift" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "startLocationLat" DOUBLE PRECISION,
    "startLocationLng" DOUBLE PRECISION,
    "endLocationLat" DOUBLE PRECISION,
    "endLocationLng" DOUBLE PRECISION,
    "startedBy" TEXT,
    "endedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldActivityLog" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "shipmentId" TEXT,
    "shiftId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "deviceInfo" TEXT,
    "metadata" TEXT,

    CONSTRAINT "FieldActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverShift_driverId_idx" ON "DriverShift"("driverId");

-- CreateIndex
CREATE INDEX "DriverShift_status_idx" ON "DriverShift"("status");

-- CreateIndex
CREATE INDEX "FieldActivityLog_driverId_idx" ON "FieldActivityLog"("driverId");

-- CreateIndex
CREATE INDEX "FieldActivityLog_createdAt_idx" ON "FieldActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "DriverShift" ADD CONSTRAINT "DriverShift_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldActivityLog" ADD CONSTRAINT "FieldActivityLog_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
