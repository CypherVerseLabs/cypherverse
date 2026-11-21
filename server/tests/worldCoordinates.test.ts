import assert from "node:assert/strict";
import test from "node:test";

import {
  CURRENT_WORLD_SIZE,
  PARCEL_SIZE,
} from "../../shared/world/CypherVerseWorldLayout.js";

import {
  CITY_CENTER,
  WORLD_MAX,
  parcelToWorldPosition,
  worldToParcelCoordinates,
} from "../../src/parcels/parcelCoordinates.js";

test("CypherVerse world layout defines exactly 90,000 parcel positions", () => {
  const gridSide = CURRENT_WORLD_SIZE / PARCEL_SIZE;

  assert.equal(CURRENT_WORLD_SIZE, 4800);
  assert.equal(PARCEL_SIZE, 16);
  assert.equal(gridSide, 300);
  assert.equal(gridSide * gridSide, 90000);
  assert.equal(WORLD_MAX, 4784);
});

test("database Genesis coordinate maps to the centered Three.js origin", () => {
  assert.equal(CITY_CENTER, 2400);
  assert.deepEqual(
    parcelToWorldPosition(2400, 2400, PARCEL_SIZE),
    [0, 0, 0]
  );
});

test("world corners map to the expected centered coordinates and back", () => {
  assert.deepEqual(
    parcelToWorldPosition(0, 0, PARCEL_SIZE),
    [-2400, 0, -2400]
  );
  assert.deepEqual(
    parcelToWorldPosition(4784, 4784, PARCEL_SIZE),
    [2384, 0, 2384]
  );
  assert.deepEqual(
    worldToParcelCoordinates(0, 0, PARCEL_SIZE),
    { x: 2400, y: 2400 }
  );
});
