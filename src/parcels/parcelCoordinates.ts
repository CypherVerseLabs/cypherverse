/**
 * =========================================================
 * PARCEL COORDINATES
 * =========================================================
 *
 * DATABASE COORDINATES
 *
 * Existing parcel coordinates remain authoritative:
 *
 *     0, 16, 32, 48, ... 4784
 *
 * A full expanded world is:
 *
 *     300 × 300 parcel positions
 *     4800 × 4800 world metres
 *
 * THREE.JS COORDINATES
 *
 * Three.js uses a centered coordinate system.
 *
 * Database:
 *
 *     0 -------------------------- 4800
 *                    2400
 *
 * Three.js:
 *
 *     -2400 ---------------------- +2400
 *                       0
 *
 * Therefore:
 *
 *     THREE = DATABASE - 2400
 *
 * X maps to THREE X.
 * Database Y maps to THREE Z.
 *
 * IMPORTANT
 *
 * Do not change existing database parcel coordinates.
 * Do not multiply database coordinates by tileSize.
 * =========================================================
 */

export const PARCEL_SIZE = 16;

export const GRID_SIZE = 300;

export const WORLD_MIN = 0;

/**
 * Last valid parcel origin:
 *
 * 299 * 16 = 4784
 */
export const WORLD_MAX =
  (GRID_SIZE - 1) * PARCEL_SIZE;

/**
 * Full world dimensions:
 *
 * 300 * 16 = 4800
 */
export const WORLD_SIZE =
  GRID_SIZE * PARCEL_SIZE;

/**
 * Database coordinate of the world center.
 */
export const CITY_CENTER =
  WORLD_SIZE / 2;

/**
 * Convert an existing database parcel coordinate
 * into centered Three.js world coordinates.
 *
 * Example:
 *
 *     database (2400, 2400)
 *     -> Three.js (0, 0)
 */
export function parcelToWorldPosition(
  x: number,
  y: number,
  _tileSize: number,
  origin: [number, number, number] = [0, 0, 0],
): [number, number, number] {
  return [
    origin[0] + x - CITY_CENTER,
    origin[1],
    origin[2] + y - CITY_CENTER,
  ];
}

/**
 * Convert a centered Three.js world position
 * back into the nearest database parcel coordinate.
 *
 * Example:
 *
 *     Three.js (0, 0)
 *     -> database (2400, 2400)
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
        (
          worldX -
          origin[0] +
          CITY_CENTER
        ) /
          PARCEL_SIZE,
      ) * PARCEL_SIZE,

    y:
      Math.round(
        (
          worldZ -
          origin[2] +
          CITY_CENTER
        ) /
          PARCEL_SIZE,
      ) * PARCEL_SIZE,
  };
}

/**
 * Convert a city landmark offset into centered
 * Three.js world coordinates.
 *
 * City landmarks are defined relative to Genesis:
 *
 *     Genesis = (0, 0)
 *
 * Therefore Genesis remains:
 *
 *     Three.js (0, 0)
 *
 * This function intentionally does NOT return
 * database coordinates.
 */
export function landmarkToWorldPosition(
  x: number,
  y: number,
  origin: [number, number, number] = [0, 0, 0],
): [number, number, number] {
  return [
    origin[0] + x,
    origin[1],
    origin[2] + y,
  ];
}

/**
 * Convert a centered Three.js coordinate into
 * the corresponding database coordinate.
 *
 * Useful when a visual landmark needs to be
 * matched against an existing Parcel record.
 */
export function worldPositionToDatabaseCoordinates(
  worldX: number,
  worldZ: number,
): {
  x: number;
  y: number;
} {
  return {
    x: worldX + CITY_CENTER,
    y: worldZ + CITY_CENTER,
  };
}