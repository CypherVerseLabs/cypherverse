import {
  PARCEL_SIZE,
  CURRENT_WORLD_SIZE,
} from "../../shared/world/CypherVerseWorldLayout.js";

export interface ParcelCoordinate {
  x: number;
  y: number;
}

const GRID_SIDE = CURRENT_WORLD_SIZE / PARCEL_SIZE;

export function generateParcelCoordinates(): ParcelCoordinate[] {
  const coordinates: ParcelCoordinate[] = [];

  for (let y = 0; y < CURRENT_WORLD_SIZE; y += PARCEL_SIZE) {
    for (let x = 0; x < CURRENT_WORLD_SIZE; x += PARCEL_SIZE) {
      coordinates.push({ x, y });
    }
  }

  if (coordinates.length !== GRID_SIDE * GRID_SIDE) {
    throw new Error(
      `Expected ${GRID_SIDE * GRID_SIDE} coordinates, got ${coordinates.length}`,
    );
  }

  return coordinates;
}

// Run the verification whenever this file is executed directly.
const coordinates = generateParcelCoordinates();

console.log("Cypherverse parcel coordinate generation");
console.log(`Grid: ${GRID_SIDE} × ${GRID_SIDE}`);
console.log(`Parcel size: ${PARCEL_SIZE} × ${PARCEL_SIZE}`);
console.log(`Total coordinates: ${coordinates.length}`);
console.log("First coordinate:", coordinates[0]);
console.log("Last coordinate:", coordinates[coordinates.length - 1]);
console.log(
  "Genesis coordinate exists:",
  coordinates.some(({ x, y }) => x === 2400 && y === 2400),
);