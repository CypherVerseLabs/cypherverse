-- CreateEnum
CREATE TYPE "ParcelStatus" AS ENUM ('available', 'owned', 'reserved', 'for_sale');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "parcelId" TEXT;

-- CreateTable
CREATE TABLE "Parcel" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "status" "ParcelStatus" NOT NULL DEFAULT 'available',
    "ownerId" TEXT,
    "price" INTEGER,
    "name" TEXT,
    "description" TEXT,
    "blockchainAddress" TEXT,
    "tokenId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parcel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParcelListing" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParcelListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParcelReservation" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParcelReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Parcel_estateId_key" ON "Parcel"("estateId");

-- CreateIndex
CREATE INDEX "Parcel_ownerId_idx" ON "Parcel"("ownerId");

-- CreateIndex
CREATE INDEX "Parcel_status_idx" ON "Parcel"("status");

-- CreateIndex
CREATE INDEX "Parcel_x_y_idx" ON "Parcel"("x", "y");

-- CreateIndex
CREATE INDEX "ParcelListing_parcelId_idx" ON "ParcelListing"("parcelId");

-- CreateIndex
CREATE INDEX "ParcelListing_sellerId_idx" ON "ParcelListing"("sellerId");

-- CreateIndex
CREATE INDEX "ParcelListing_active_idx" ON "ParcelListing"("active");

-- CreateIndex
CREATE INDEX "ParcelReservation_parcelId_idx" ON "ParcelReservation"("parcelId");

-- CreateIndex
CREATE INDEX "ParcelReservation_userId_idx" ON "ParcelReservation"("userId");

-- CreateIndex
CREATE INDEX "ParcelReservation_expiresAt_idx" ON "ParcelReservation"("expiresAt");

-- CreateIndex
CREATE INDEX "Project_parcelId_idx" ON "Project"("parcelId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "Parcel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parcel" ADD CONSTRAINT "Parcel_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcelListing" ADD CONSTRAINT "ParcelListing_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "Parcel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcelListing" ADD CONSTRAINT "ParcelListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcelReservation" ADD CONSTRAINT "ParcelReservation_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "Parcel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParcelReservation" ADD CONSTRAINT "ParcelReservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
