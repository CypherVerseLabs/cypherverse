/**
 * Convert a parcel coordinate into a 3D world position.
 *
 * The database already stores parcel coordinates in world units:
 *
 *     0
 *     16
 *     32
 *     48
 *     ...
 *     2384
 *
 * Therefore x/y are mapped directly into the 3D world.
 *
 * Parcel Y maps to THREE Z.
 */

export function parcelToWorldPosition(
  x: number,
  y: number,
  _tileSize: number,
  origin: [number, number, number] = [0, 0, 0]
): [number, number, number] {
  return [
    origin[0] + x,
    origin[1],
    origin[2] + y,
  ];
}


/**
 * Convert a 3D world position back into a parcel coordinate.
 *
 * Because database coordinates are already in world units,
 * no additional tile-size multiplication is required.
 */
export function worldToParcelCoordinates(
  worldX: number,
  worldZ: number,
  _tileSize: number,
  origin: [number, number, number] = [0, 0, 0]
): {
  x: number;
  y: number;
} {
  return {
    x: Math.floor(
      worldX - origin[0]
    ),

    y: Math.floor(
      worldZ - origin[2]
    ),
  };
}