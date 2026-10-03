-- Stage 1: rail-neutral marketplace payments and CYPH accounting tables.
-- Existing marketplace data is preserved and existing USD test payments
-- are migrated to the LOCAL / USD_PROVIDER representation.

CREATE TYPE "MarketplaceCurrency" AS ENUM (
  'USD',
  'ETH',
  'CYPH'
);

CREATE TYPE "MarketplacePaymentMethod" AS ENUM (
  'USD_PROVIDER',
  'ETH_BLOCKCHAIN',
  'CYPH_LEDGER'
);

ALTER TYPE "MarketplacePaymentEnvironment"
RENAME VALUE 'TEST' TO 'LOCAL';

ALTER TYPE "MarketplacePaymentEnvironment"
ADD VALUE 'STAGING';

ALTER TYPE "MarketplacePaymentEnvironment"
ADD VALUE 'PRODUCTION';

ALTER TABLE "ParcelListing"
ADD COLUMN "currency" "MarketplaceCurrency" NOT NULL DEFAULT 'USD';

ALTER TABLE "ParcelListing"
ALTER COLUMN "price" TYPE DECIMAL(36,18);

ALTER TABLE "MarketplaceOrder"
ALTER COLUMN "amount" TYPE DECIMAL(36,18);

ALTER TABLE "MarketplaceOrder"
ADD COLUMN "currency_new" "MarketplaceCurrency" NOT NULL DEFAULT 'USD';

UPDATE "MarketplaceOrder"
SET "currency_new" = CASE
  WHEN "currency" = 'USD' THEN 'USD'::"MarketplaceCurrency"
  WHEN "currency" = 'ETH' THEN 'ETH'::"MarketplaceCurrency"
  WHEN "currency" = 'CYPH' THEN 'CYPH'::"MarketplaceCurrency"
  ELSE 'USD'::"MarketplaceCurrency"
END;

ALTER TABLE "MarketplaceOrder"
DROP COLUMN "currency";

ALTER TABLE "MarketplaceOrder"
RENAME COLUMN "currency_new" TO "currency";

ALTER TABLE "MarketplacePayment"
RENAME COLUMN "providerTransactionId" TO "externalTransactionId";

ALTER INDEX "MarketplacePayment_providerTransactionId_key"
RENAME TO "MarketplacePayment_externalTransactionId_key";

ALTER TABLE "MarketplacePayment"
ADD COLUMN "method" "MarketplacePaymentMethod" NOT NULL DEFAULT 'USD_PROVIDER';

ALTER TABLE "MarketplacePayment"
ALTER COLUMN "amount" TYPE DECIMAL(36,18);

ALTER TABLE "MarketplacePayment"
ALTER COLUMN "environment" SET DEFAULT 'LOCAL';

ALTER TABLE "MarketplacePayment"
ADD COLUMN "network" TEXT,
ADD COLUMN "metadata" JSONB;

ALTER TABLE "MarketplacePayment"
RENAME COLUMN "paidAt" TO "confirmedAt";

ALTER TABLE "MarketplacePaymentEvent"
RENAME COLUMN "providerEventId" TO "externalEventId";

ALTER INDEX "MarketplacePaymentEvent_providerEventId_key"
RENAME TO "MarketplacePaymentEvent_externalEventId_key";

ALTER TABLE "MarketplacePaymentEvent"
RENAME COLUMN "providerTransactionId" TO "externalTransactionId";

ALTER TABLE "MarketplacePaymentEvent"
RENAME CONSTRAINT "MarketplacePaymentEvent_providerTransactionId_fkey"
TO "MarketplacePaymentEvent_externalTransactionId_fkey";

ALTER TABLE "MarketplacePaymentEvent"
ALTER COLUMN "environment" SET DEFAULT 'LOCAL';

-- CYPH is an internal ledger currency at this stage.
-- CyphAccount.balance is a server-maintained available-balance
-- projection; CyphLedgerEntry is immutable accounting history.

CREATE TABLE "CyphAccount" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "balance" DECIMAL(36,18) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CyphAccount_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CyphAccount_userId_key"
ON "CyphAccount"("userId");

CREATE INDEX "CyphAccount_userId_idx"
ON "CyphAccount"("userId");

ALTER TABLE "CyphAccount"
ADD CONSTRAINT "CyphAccount_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

CREATE TABLE "CyphLedgerEntry" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "amount" DECIMAL(36,18) NOT NULL,
  "type" TEXT NOT NULL,
  "referenceType" TEXT,
  "referenceId" TEXT,
  "idempotencyKey" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CyphLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CyphLedgerEntry_idempotencyKey_key"
ON "CyphLedgerEntry"("idempotencyKey");

CREATE INDEX "CyphLedgerEntry_userId_idx"
ON "CyphLedgerEntry"("userId");

CREATE INDEX "CyphLedgerEntry_accountId_idx"
ON "CyphLedgerEntry"("accountId");

CREATE INDEX "CyphLedgerEntry_referenceType_referenceId_idx"
ON "CyphLedgerEntry"("referenceType", "referenceId");

CREATE INDEX "CyphLedgerEntry_createdAt_idx"
ON "CyphLedgerEntry"("createdAt");

ALTER TABLE "CyphLedgerEntry"
ADD CONSTRAINT "CyphLedgerEntry_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "User"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "CyphLedgerEntry"
ADD CONSTRAINT "CyphLedgerEntry_accountId_fkey"
FOREIGN KEY ("accountId")
REFERENCES "CyphAccount"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
