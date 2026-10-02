-- Add permanent parcel classification and immutable ownership history.
--
-- Existing parcels default to STANDARD.
-- No historical ownership rows are fabricated by this migration.
-- Landmark coordinates/parcel assignments are intentionally NOT changed here.

CREATE TYPE "ParcelType" AS ENUM (
  'STANDARD',
  'CITY_LANDMARK'
);

ALTER TABLE "Parcel"
ADD COLUMN "type" "ParcelType" NOT NULL DEFAULT 'STANDARD';

CREATE INDEX "Parcel_type_idx" ON "Parcel"("type");

CREATE TABLE "ParcelOwnershipHistory" (
  "id" TEXT NOT NULL,
  "parcelId" TEXT NOT NULL,
  "previousOwnerId" TEXT,
  "newOwnerId" TEXT,
  "transferredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "source" TEXT,
  "marketplaceOrderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ParcelOwnershipHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ParcelOwnershipHistory_parcelId_transferredAt_idx"
  ON "ParcelOwnershipHistory"("parcelId", "transferredAt");

CREATE INDEX "ParcelOwnershipHistory_previousOwnerId_idx"
  ON "ParcelOwnershipHistory"("previousOwnerId");

CREATE INDEX "ParcelOwnershipHistory_newOwnerId_idx"
  ON "ParcelOwnershipHistory"("newOwnerId");

CREATE INDEX "ParcelOwnershipHistory_marketplaceOrderId_idx"
  ON "ParcelOwnershipHistory"("marketplaceOrderId");

ALTER TABLE "ParcelOwnershipHistory"
ADD CONSTRAINT "ParcelOwnershipHistory_parcelId_fkey"
FOREIGN KEY ("parcelId") REFERENCES "Parcel"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ParcelOwnershipHistory"
ADD CONSTRAINT "ParcelOwnershipHistory_previousOwnerId_fkey"
FOREIGN KEY ("previousOwnerId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ParcelOwnershipHistory"
ADD CONSTRAINT "ParcelOwnershipHistory_newOwnerId_fkey"
FOREIGN KEY ("newOwnerId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ParcelOwnershipHistory"
ADD CONSTRAINT "ParcelOwnershipHistory_marketplaceOrderId_fkey"
FOREIGN KEY ("marketplaceOrderId") REFERENCES "MarketplaceOrder"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
