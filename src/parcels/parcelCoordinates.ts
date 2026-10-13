/**
 * =========================================================
 * PARCEL COORDINATES
 * =========================================================
 *
 * Database parcel coordinates are stored in world units:
 * 0, 16, 32, 48, ... 4784.
 *
 * Parcel Y maps to Three.js Z.
 *
 * Normal parcel coordinates must never be translated.
 * City landmark coordinates are relative to the center
 * of the expanded world and use world-unit offsets.
 * =========================================================
 */

export const PARCEL_SIZE = 16;
export const GRID_SIZE = 300;

export const WORLD_MIN = 0;

// Last valid parcel origin: 299 * 16 = 4784.
export const WORLD_MAX =
  (GRID_SIZE - 1) * PARCEL_SIZE;

// Full world dimensions: 300 * 16 = 4800.
export const WORLD_SIZE =
  GRID_SIZE * PARCEL_SIZE;

// World center: 2400.
export const CITY_CENTER = WORLD_SIZE / 2;

/**
 * Convert an existing database parcel coordinate into
 * a Three.js world position.
 *
 * Database coordinates are already world units.
 * Do not multiply them by PARCEL_SIZE.
 */
export function parcelToWorldPosition(
  x: number,
  y: number,
  _tileSize: number,
  origin: [number, number, number] = [0, 0, 0],
): [number, number, number] {
  return [
    origin[0] + x,
    origin[1],
    origin[2] + y,
  ];
}

/**
 * Convert a Three.js world position to the nearest
 * parcel-grid coordinate.
 *
 * Coordinates are rounded to the nearest 16-unit
 * grid position.
 */
export function worldToParcelCoordinates(
  worldX: number,
  worldZ: number,
  _tileSize: number,
  origin: [number, number, number] = [0, 0, 0],
): {
  x: number;
  y: number;
} {
  return {
    x:
      Math.round(
        (worldX - origin[0]) / PARCEL_SIZE,
      ) * PARCEL_SIZE,

    y:
      Math.round(
        (worldZ - origin[2]) / PARCEL_SIZE,
      ) * PARCEL_SIZE,
  };
}

/**
 * Convert city landmark world-unit offsets into
 * absolute Three.js world positions.
 *
 * Examples:
 *   Genesis (0, 0)          -> (2400, 2400)
 *   North Gate (0, 1920)    -> (2400, 4320)
 *   West Gate (-1920, 0)    -> (480, 2400)
 *
 * Landmark positions are visual overlays only.
 * They do not create parcels or change ownership.
 */
export function landmarkToWorldPosition(
  x: number,
  y: number,
  origin: [number, number, number] = [0, 0, 0],
): [number, number, number] {
  return [
    origin[0] + CITY_CENTER + x,
    origin[1],
    origin[2] + CITY_CENTER + y,
  ];
}