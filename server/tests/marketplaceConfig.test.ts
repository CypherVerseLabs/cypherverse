import assert from "node:assert/strict";
import test from "node:test";

import { getPrimaryMarketplaceSellerEmail } from "../config/marketplaceConfig.js";

test("non-Production environments retain the TEST fallback", () => {
  assert.equal(getPrimaryMarketplaceSellerEmail({ NODE_ENV: "test" }), "marketplace@cypherverse.test");
  assert.equal(getPrimaryMarketplaceSellerEmail({ NODE_ENV: "development", MARKETPLACE_SYSTEM_SELLER_EMAIL: "  seller@example.com  " }), "seller@example.com");
});

test("Production requires an explicitly configured seller email", () => {
  assert.throws(() => getPrimaryMarketplaceSellerEmail({ NODE_ENV: "production" }), /MARKETPLACE_SYSTEM_SELLER_EMAIL/);
  assert.throws(() => getPrimaryMarketplaceSellerEmail({ NODE_ENV: "production", MARKETPLACE_SYSTEM_SELLER_EMAIL: "not-an-email" }), /MARKETPLACE_SYSTEM_SELLER_EMAIL/);
});

test("Production rejects the TEST seller identity", () => {
  assert.throws(() => getPrimaryMarketplaceSellerEmail({ NODE_ENV: "production", MARKETPLACE_SYSTEM_SELLER_EMAIL: "marketplace@cypherverse.test" }), /TEST marketplace seller/);
});

test("Production accepts a valid configured non-TEST email", () => {
  assert.equal(getPrimaryMarketplaceSellerEmail({ NODE_ENV: "production", MARKETPLACE_SYSTEM_SELLER_EMAIL: "marketplace@cypherverse.example" }), "marketplace@cypherverse.example");
});
