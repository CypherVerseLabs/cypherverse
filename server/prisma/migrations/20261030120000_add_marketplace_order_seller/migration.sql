-- MarketplaceOrder.sellerId is required for both primary inventory and resale.
-- Existing resale orders are backfilled from their listing seller.
-- Any remaining historical orders use the dedicated TEST marketplace seller.

ALTER TABLE "MarketplaceOrder"
ADD COLUMN "sellerId" TEXT;

UPDATE "MarketplaceOrder" AS o
SET "sellerId" = l."sellerId"
FROM "ParcelListing" AS l
WHERE o."listingId" = l.id
  AND o."sellerId" IS NULL;

DO $$
DECLARE
  seller_id TEXT;
BEGIN
  SELECT id INTO seller_id
  FROM "User"
  WHERE email = 'marketplace@cypherverse.test'
  LIMIT 1;

  IF seller_id IS NULL THEN
    seller_id := gen_random_uuid()::text;
    INSERT INTO "User" (id, email, username, "createdAt", "updatedAt")
    VALUES (
      seller_id,
      'marketplace@cypherverse.test',
      'CypherVerse Test Seller',
      NOW(),
      NOW()
    );
  END IF;

  UPDATE "MarketplaceOrder"
  SET "sellerId" = seller_id
  WHERE "sellerId" IS NULL;
END $$;

ALTER TABLE "MarketplaceOrder"
ALTER COLUMN "sellerId" SET NOT NULL;

CREATE INDEX "MarketplaceOrder_sellerId_idx"
ON "MarketplaceOrder"("sellerId");

ALTER TABLE "MarketplaceOrder"
ADD CONSTRAINT "MarketplaceOrder_sellerId_fkey"
FOREIGN KEY ("sellerId") REFERENCES "User"(id)
ON DELETE RESTRICT
ON UPDATE CASCADE;
