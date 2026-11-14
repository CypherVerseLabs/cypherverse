-- CYPH controlled distribution and reconciliation foundation.
-- Additive only: existing ledger/grant history is retained.
-- No supply ceiling is assumed here. Distribution remains disabled until an
-- operator configures the ceiling and completes a source-of-truth reconciliation.
-- The EVM token contract, once deployed, is authoritative for on-chain supply.

ALTER TABLE "CyphAccount"
  ALTER COLUMN "balance" TYPE DECIMAL(36,18);
ALTER TABLE "CyphLedgerEntry"
  ALTER COLUMN "amount" TYPE DECIMAL(36,18);
ALTER TABLE "CyphLedgerPosting"
  ALTER COLUMN "amount" TYPE DECIMAL(36,18);
ALTER TABLE "CyphFundingPreset"
  ALTER COLUMN "baseAmount" TYPE DECIMAL(36,18),
  ALTER COLUMN "bonusAmount" TYPE DECIMAL(36,18);
ALTER TABLE "CyphFundingGrant"
  ALTER COLUMN "baseAmount" TYPE DECIMAL(36,18),
  ALTER COLUMN "bonusAmount" TYPE DECIMAL(36,18);
ALTER TABLE "MarketplacePayment"
  ALTER COLUMN "amount" TYPE DECIMAL(36,18);

CREATE TABLE "CyphDistributionControl" (
  "id" TEXT NOT NULL DEFAULT 'primary',
  "distributionCeiling" DECIMAL(36,18),
  "distributedAmount" DECIMAL(36,18) NOT NULL DEFAULT 0,
  "reconciledAt" TIMESTAMP(3),
  "enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CyphDistributionControl_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CyphDistributionControl_singleton_check" CHECK ("id" = 'primary'),
  CONSTRAINT "CyphDistributionControl_ceiling_nonnegative" CHECK ("distributionCeiling" IS NULL OR "distributionCeiling" >= 0),
  CONSTRAINT "CyphDistributionControl_distributed_nonnegative" CHECK ("distributedAmount" >= 0),
  CONSTRAINT "CyphDistributionControl_ceiling_check" CHECK ("distributionCeiling" IS NULL OR "distributedAmount" <= "distributionCeiling"),
  CONSTRAINT "CyphDistributionControl_enabled_check" CHECK (NOT "enabled" OR ("distributionCeiling" IS NOT NULL AND "reconciledAt" IS NOT NULL))
);

CREATE TABLE "CyphDistributionAllocation" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "ceiling" DECIMAL(36,18),
  "distributedAmount" DECIMAL(36,18) NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CyphDistributionAllocation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CyphDistributionAllocation_ceiling_nonnegative" CHECK ("ceiling" IS NULL OR "ceiling" >= 0),
  CONSTRAINT "CyphDistributionAllocation_distributed_nonnegative" CHECK ("distributedAmount" >= 0),
  CONSTRAINT "CyphDistributionAllocation_ceiling_check" CHECK ("ceiling" IS NULL OR "distributedAmount" <= "ceiling")
);

ALTER TABLE "CyphFundingPreset"
  ADD COLUMN "allocationId" TEXT;
ALTER TABLE "CyphFundingGrant"
  ADD COLUMN "allocationId" TEXT;

CREATE UNIQUE INDEX "CyphDistributionAllocation_code_key"
  ON "CyphDistributionAllocation"("code");
CREATE INDEX "CyphDistributionAllocation_enabled_idx"
  ON "CyphDistributionAllocation"("enabled");
CREATE INDEX "CyphFundingPreset_allocationId_idx"
  ON "CyphFundingPreset"("allocationId");

ALTER TABLE "CyphFundingPreset"
  ADD CONSTRAINT "CyphFundingPreset_allocationId_fkey"
  FOREIGN KEY ("allocationId") REFERENCES "CyphDistributionAllocation"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CyphFundingGrant"
  ADD CONSTRAINT "CyphFundingGrant_allocationId_fkey"
  FOREIGN KEY ("allocationId") REFERENCES "CyphDistributionAllocation"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "CyphDistributionControl"
  ("id", "distributionCeiling", "distributedAmount", "reconciledAt", "enabled", "createdAt", "updatedAt")
VALUES
  ('primary', NULL, 0, NULL, FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
