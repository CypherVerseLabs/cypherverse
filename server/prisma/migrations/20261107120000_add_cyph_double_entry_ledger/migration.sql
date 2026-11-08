-- CYPH Phase 1: central balanced ledger, admin authorization, and funding presets.
-- Additive migration. The already-applied 20261104092100 migration is not modified.
-- No user balances are funded by this migration.

DO $$
DECLARE
  zero_count BIGINT;
BEGIN
  SELECT COUNT(*)
  INTO zero_count
  FROM "CyphLedgerEntry"
  WHERE "amount" = 0;

  IF zero_count > 0 THEN
    RAISE EXCEPTION
      'CYPH migration blocked: % zero-value legacy entries require review',
      zero_count;
  END IF;
END;
$$;

CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
CREATE TYPE "CyphAccountType" AS ENUM ('USER', 'SYSTEM');

ALTER TABLE "User"
  ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';

ALTER TABLE "CyphAccount"
  ALTER COLUMN "userId" DROP NOT NULL,
  ADD COLUMN "systemCode" TEXT,
  ADD COLUMN "accountType" "CyphAccountType" NOT NULL DEFAULT 'USER';

ALTER TABLE "CyphAccount"
  DROP CONSTRAINT "CyphAccount_userId_fkey",
  ADD CONSTRAINT "CyphAccount_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "CyphAccount_identity_check"
    CHECK (
      ("accountType" = 'USER' AND "userId" IS NOT NULL AND "systemCode" IS NULL)
      OR
      ("accountType" = 'SYSTEM' AND "userId" IS NULL AND "systemCode" IS NOT NULL)
    );

CREATE UNIQUE INDEX "CyphAccount_systemCode_key"
  ON "CyphAccount"("systemCode");

ALTER TABLE "CyphLedgerEntry"
  DROP CONSTRAINT "CyphLedgerEntry_userId_fkey",
  DROP CONSTRAINT "CyphLedgerEntry_accountId_fkey",
  ADD CONSTRAINT "CyphLedgerEntry_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "CyphLedgerEntry_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "CyphAccount"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "CyphLedgerTransaction" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "actorUserId" TEXT,
  "referenceType" TEXT,
  "referenceId" TEXT,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CyphLedgerTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CyphLedgerPosting" (
  "id" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "amount" DECIMAL(24,8) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CyphLedgerPosting_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CyphLedgerPosting_amount_nonzero" CHECK ("amount" <> 0)
);

CREATE TABLE "CyphFundingPreset" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "baseAmount" DECIMAL(24,8) NOT NULL,
  "bonusAmount" DECIMAL(24,8) NOT NULL DEFAULT 0,
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CyphFundingPreset_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CyphFundingPreset_base_nonnegative" CHECK ("baseAmount" >= 0),
  CONSTRAINT "CyphFundingPreset_bonus_nonnegative" CHECK ("bonusAmount" >= 0),
  CONSTRAINT "CyphFundingPreset_total_positive" CHECK ("baseAmount" + "bonusAmount" > 0)
);

CREATE TABLE "CyphFundingGrant" (
  "id" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "presetId" TEXT,
  "baseAmount" DECIMAL(24,8) NOT NULL,
  "bonusAmount" DECIMAL(24,8) NOT NULL DEFAULT 0,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CyphFundingGrant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CyphFundingGrant_base_nonnegative" CHECK ("baseAmount" >= 0),
  CONSTRAINT "CyphFundingGrant_bonus_nonnegative" CHECK ("bonusAmount" >= 0),
  CONSTRAINT "CyphFundingGrant_total_positive" CHECK ("baseAmount" + "bonusAmount" > 0),
  CONSTRAINT "CyphFundingGrant_reason_nonempty" CHECK (length(trim("reason")) >= 5)
);

CREATE UNIQUE INDEX "CyphLedgerTransaction_idempotencyKey_key"
  ON "CyphLedgerTransaction"("idempotencyKey");
CREATE INDEX "CyphLedgerTransaction_actorUserId_idx"
  ON "CyphLedgerTransaction"("actorUserId");
CREATE INDEX "CyphLedgerTransaction_referenceType_referenceId_idx"
  ON "CyphLedgerTransaction"("referenceType", "referenceId");
CREATE INDEX "CyphLedgerTransaction_createdAt_idx"
  ON "CyphLedgerTransaction"("createdAt");

CREATE INDEX "CyphLedgerPosting_transactionId_idx"
  ON "CyphLedgerPosting"("transactionId");
CREATE INDEX "CyphLedgerPosting_accountId_idx"
  ON "CyphLedgerPosting"("accountId");

CREATE UNIQUE INDEX "CyphFundingPreset_code_key"
  ON "CyphFundingPreset"("code");
CREATE INDEX "CyphFundingPreset_enabled_sortOrder_idx"
  ON "CyphFundingPreset"("enabled", "sortOrder");

CREATE UNIQUE INDEX "CyphFundingGrant_transactionId_key"
  ON "CyphFundingGrant"("transactionId");
CREATE INDEX "CyphFundingGrant_targetUserId_createdAt_idx"
  ON "CyphFundingGrant"("targetUserId", "createdAt");
CREATE INDEX "CyphFundingGrant_presetId_idx"
  ON "CyphFundingGrant"("presetId");

ALTER TABLE "CyphLedgerTransaction"
  ADD CONSTRAINT "CyphLedgerTransaction_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CyphLedgerPosting"
  ADD CONSTRAINT "CyphLedgerPosting_transactionId_fkey"
  FOREIGN KEY ("transactionId") REFERENCES "CyphLedgerTransaction"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "CyphLedgerPosting_accountId_fkey"
  FOREIGN KEY ("accountId") REFERENCES "CyphAccount"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CyphFundingPreset"
  ADD CONSTRAINT "CyphFundingPreset_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CyphFundingGrant"
  ADD CONSTRAINT "CyphFundingGrant_transactionId_fkey"
  FOREIGN KEY ("transactionId") REFERENCES "CyphLedgerTransaction"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "CyphFundingGrant_targetUserId_fkey"
  FOREIGN KEY ("targetUserId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "CyphFundingGrant_presetId_fkey"
  FOREIGN KEY ("presetId") REFERENCES "CyphFundingPreset"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- System accounts are accounting destinations, not funded user wallets.
INSERT INTO "CyphAccount"
  ("id", "userId", "systemCode", "accountType", "balance", "createdAt", "updatedAt")
VALUES
  ('system-cyph-issuance', NULL, 'CYPH_ISSUANCE', 'SYSTEM', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('system-cyph-marketplace-revenue', NULL, 'CYPH_MARKETPLACE_REVENUE', 'SYSTEM', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('system-cyph-legacy-offset', NULL, 'CYPH_LEGACY_MIGRATION_OFFSET', 'SYSTEM', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Backfill every existing legacy entry into a balanced journal transaction.
-- The offset account preserves the historical one-sided entry without guessing its origin.
INSERT INTO "CyphLedgerTransaction"
  ("id", "type", "idempotencyKey", "referenceType", "referenceId", "reason", "createdAt")
SELECT
  'legacy-' || e."id",
  'LEGACY_IMPORT',
  'legacy:' || e."id",
  e."referenceType",
  e."referenceId",
  'Imported existing CYPH ledger entry into the balanced journal.',
  e."createdAt"
FROM "CyphLedgerEntry" e;

INSERT INTO "CyphLedgerPosting"
  ("id", "transactionId", "accountId", "amount", "createdAt")
SELECT
  'legacy-user-' || e."id",
  'legacy-' || e."id",
  e."accountId",
  e."amount",
  e."createdAt"
FROM "CyphLedgerEntry" e
UNION ALL
SELECT
  'legacy-offset-' || e."id",
  'legacy-' || e."id",
  'system-cyph-legacy-offset',
  -e."amount",
  e."createdAt"
FROM "CyphLedgerEntry" e;

-- Deferred database-level invariant: every committed journal transaction
-- must have at least two postings whose signed sum is exactly zero.
CREATE OR REPLACE FUNCTION cyph_assert_balanced_journal_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  target_transaction_id TEXT;
  posting_count BIGINT;
  posting_total NUMERIC;
BEGIN
  IF TG_TABLE_NAME = 'CyphLedgerTransaction' THEN
    target_transaction_id := NEW."id";
  ELSE
    target_transaction_id := NEW."transactionId";
  END IF;

  SELECT COUNT(*), COALESCE(SUM("amount"), 0)
    INTO posting_count, posting_total
  FROM "CyphLedgerPosting"
  WHERE "transactionId" = target_transaction_id;

  IF posting_count < 2 OR posting_total <> 0 THEN
    RAISE EXCEPTION
      'CYPH journal transaction % is not balanced (postings %, total %)',
      target_transaction_id, posting_count, posting_total
      USING ERRCODE = '23514';
  END IF;

  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER "CyphLedgerTransaction_balanced"
AFTER INSERT ON "CyphLedgerTransaction"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION cyph_assert_balanced_journal_transaction();

CREATE CONSTRAINT TRIGGER "CyphLedgerPosting_balanced"
AFTER INSERT ON "CyphLedgerPosting"
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION cyph_assert_balanced_journal_transaction();

-- Posted financial records are append-only.
CREATE OR REPLACE FUNCTION cyph_reject_posted_ledger_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'CYPH posted ledger records are immutable'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "CyphLedgerTransaction_immutable"
BEFORE UPDATE OR DELETE ON "CyphLedgerTransaction"
FOR EACH ROW
EXECUTE FUNCTION cyph_reject_posted_ledger_mutation();

CREATE TRIGGER "CyphLedgerPosting_immutable"
BEFORE UPDATE OR DELETE ON "CyphLedgerPosting"
FOR EACH ROW
EXECUTE FUNCTION cyph_reject_posted_ledger_mutation();

CREATE TRIGGER "CyphFundingGrant_immutable"
BEFORE UPDATE OR DELETE ON "CyphFundingGrant"
FOR EACH ROW
EXECUTE FUNCTION cyph_reject_posted_ledger_mutation();
