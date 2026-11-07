-- CYPH internal marketplace account and ledger.
-- This migration creates storage only. It does not fund accounts.

CREATE TABLE "CyphAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(24,8) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CyphAccount_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CyphAccount_balance_nonnegative"
        CHECK ("balance" >= 0)
);

CREATE TABLE "CyphLedgerEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "amount" DECIMAL(24,8) NOT NULL,
    "type" TEXT NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CyphLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CyphAccount_userId_key"
    ON "CyphAccount"("userId");

CREATE INDEX "CyphAccount_userId_idx"
    ON "CyphAccount"("userId");

CREATE UNIQUE INDEX "CyphLedgerEntry_idempotencyKey_key"
    ON "CyphLedgerEntry"("idempotencyKey");

CREATE INDEX "CyphLedgerEntry_userId_idx"
    ON "CyphLedgerEntry"("userId");

CREATE INDEX "CyphLedgerEntry_accountId_idx"
    ON "CyphLedgerEntry"("accountId");

CREATE INDEX "CyphLedgerEntry_referenceType_referenceId_idx"
    ON "CyphLedgerEntry"("referenceType", "referenceId");

ALTER TABLE "CyphAccount"
    ADD CONSTRAINT "CyphAccount_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CyphLedgerEntry"
    ADD CONSTRAINT "CyphLedgerEntry_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CyphLedgerEntry"
    ADD CONSTRAINT "CyphLedgerEntry_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "CyphAccount"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;