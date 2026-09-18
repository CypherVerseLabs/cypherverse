/**
 * Convert a parcel coordinate into a 3D world position.
 *
 * Parcel coordinates:
 *
 *     x = east / west
 *     y = north / south
 *
 * 3D coordinates:
 *
 *     x = horizontal
 *     y = vertical
 *     z = depth
 *
 * Parcel Y therefore maps to THREE Z.
 */

export function parcelToWorldPosition(
  x: number,
  y: number,
  tileSize: number,
  origin: [number, number, number] = [0, 0, 0]
): [number, number, number] {
  return [
    origin[0] + x * tileSize,
    origin[1],
    origin[2] + y * tileSize,
  ];
}

export function worldToParcelCoordinates(
  worldX: number,
  worldZ: number,
  tileSize: number,
  origin: [number, number, number] = [0, 0, 0]
): {
  x: number;
  y: number;
} {
  return {
    x: Math.floor(
      (worldX - origin[0]) / tileSize
    ),
    y: Math.floor(
      (worldZ - origin[2]) / tileSize
    ),
  };
}
