import assert from "node:assert/strict";
import test from "node:test";

import { isTestPaymentSimulationEnabled } from "../middleware/testPaymentSimulation.js";

test("payment simulation is disabled unless explicitly enabled", () => {
  assert.equal(isTestPaymentSimulationEnabled({ NODE_ENV: "development" }), false);
  assert.equal(isTestPaymentSimulationEnabled({ NODE_ENV: "test" }), false);
  assert.equal(isTestPaymentSimulationEnabled({ NODE_ENV: "development", ENABLE_TEST_PAYMENT_SIMULATION: "false" }), false);
  assert.equal(isTestPaymentSimulationEnabled({ NODE_ENV: "development", ENABLE_TEST_PAYMENT_SIMULATION: "TRUE" }), false);
});

test("payment simulation can be explicitly enabled outside Production", () => {
  assert.equal(isTestPaymentSimulationEnabled({ NODE_ENV: "development", ENABLE_TEST_PAYMENT_SIMULATION: "true" }), true);
  assert.equal(isTestPaymentSimulationEnabled({ NODE_ENV: "test", ENABLE_TEST_PAYMENT_SIMULATION: "true" }), true);
  assert.equal(isTestPaymentSimulationEnabled({ ENABLE_TEST_PAYMENT_SIMULATION: "true" }), true);
});

test("Production always disables payment simulation, even with opt-in", () => {
  assert.equal(isTestPaymentSimulationEnabled({ NODE_ENV: "production", ENABLE_TEST_PAYMENT_SIMULATION: "true" }), false);
});
