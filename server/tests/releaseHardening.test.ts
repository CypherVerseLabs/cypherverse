import assert from "node:assert/strict";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { getPrimaryMarketplaceSellerEmail } from "../config/marketplaceConfig.js";
import { isTestPaymentSimulationEnabled } from "../middleware/testPaymentSimulation.js";

test("payment simulation is disabled by default", () => {
  assert.equal(isTestPaymentSimulationEnabled({ NODE_ENV: "test" }), false);
  assert.equal(isTestPaymentSimulationEnabled({ NODE_ENV: "development" }), false);
});

test("payment simulation requires explicit non-production opt-in", () => {
  assert.equal(
    isTestPaymentSimulationEnabled({
      NODE_ENV: "test",
      ENABLE_TEST_PAYMENT_SIMULATION: "true",
    }),
    true
  );
  assert.equal(
    isTestPaymentSimulationEnabled({
      NODE_ENV: "development",
      ENABLE_TEST_PAYMENT_SIMULATION: "true",
    }),
    true
  );
});

test("Production cannot enable payment simulation, even with opt-in set", () => {
  assert.equal(
    isTestPaymentSimulationEnabled({
      NODE_ENV: "production",
      ENABLE_TEST_PAYMENT_SIMULATION: "true",
    }),
    false
  );
});

test("non-production keeps the existing TEST seller fallback", () => {
  assert.equal(
    getPrimaryMarketplaceSellerEmail({ NODE_ENV: "test" }),
    "marketplace@cypherverse.test"
  );
});

test("Production requires a configured non-TEST system seller", () => {
  assert.throws(
    () => getPrimaryMarketplaceSellerEmail({ NODE_ENV: "production" }),
    /MARKETPLACE_SYSTEM_SELLER_EMAIL/
  );
  assert.throws(
    () =>
      getPrimaryMarketplaceSellerEmail({
        NODE_ENV: "production",
        MARKETPLACE_SYSTEM_SELLER_EMAIL: "marketplace@cypherverse.test",
      }),
    /TEST marketplace seller/
  );
  assert.equal(
    getPrimaryMarketplaceSellerEmail({
      NODE_ENV: "production",
      MARKETPLACE_SYSTEM_SELLER_EMAIL: "marketplace@cypherverse.example",
    }),
    "marketplace@cypherverse.example"
  );
});

test("Production seller email can be explicitly overridden outside Production", () => {
  assert.equal(
    getPrimaryMarketplaceSellerEmail({
      NODE_ENV: "test",
      MARKETPLACE_SYSTEM_SELLER_EMAIL: "seller@example.com",
    }),
    "seller@example.com"
  );
});

test("every Prisma migration directory contains migration.sql", () => {
  const migrationsPath = path.resolve(process.cwd(), "prisma/migrations");
  const migrationDirectories = readdirSync(migrationsPath).filter((entry) =>
    statSync(path.join(migrationsPath, entry)).isDirectory()
  );

  assert.ok(migrationDirectories.length > 0, "expected Prisma migration directories");
  for (const directory of migrationDirectories) {
    assert.ok(
      statSync(path.join(migrationsPath, directory, "migration.sql")).isFile(),
      `missing migration.sql in ${directory}`
    );
  }
});
