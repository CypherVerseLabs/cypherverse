import {
  CYPHERVERSE_AREAS,
} from "./CypherVerseMap";

/**
 * =========================================================
 * WORLD DISTRICTS
 * =========================================================
 *
 * The existing CypherVerse map is authored in the original
 * 2400 × 2400 city coordinate system.
 *
 * The expanded database world is 4800 × 4800 and places
 * the existing city at the center.
 *
 * Therefore the old city coordinates are shifted by 1200
 * when converting them into database coordinates.
 *
 * Example:
 *
 *     Old Genesis center:
 *         1200, 1200
 *
 *     Database/world center:
 *         2400, 2400
 *
 *     Offset:
 *         +1200, +1200
 *
 * Districts remain descriptive geography only.
 * They do not reserve parcels or modify ownership.
 * =========================================================
 */

const ORIGINAL_CITY_SIZE = 2400;

const ORIGINAL_CITY_CENTER =
  ORIGINAL_CITY_SIZE / 2;

const DATABASE_WORLD_CENTER = 2400;

const CITY_COORDINATE_OFFSET =
  DATABASE_WORLD_CENTER -
  ORIGINAL_CITY_CENTER;

export interface WorldDistrict {
  id: string;
  name: string;

  /**
   * Database/world coordinates.
   */
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Convert an old city coordinate into the
 * expanded database coordinate system.
 */
function toDatabaseCoordinate(
  coordinate: number,
): number {
  return coordinate + CITY_COORDINATE_OFFSET;
}

/**
 * Derived from the existing visual map.
 *
 * These bounds describe geography only.
 * They do not reserve land or change parcel availability.
 */
export const WORLD_DISTRICTS: WorldDistrict[] =
  CYPHERVERSE_AREAS
    .filter(
      (area) =>
        area.kind === "DISTRICT",
    )
    .map((area) => {
      const oldMinX =
        area.center.x -
        area.width / 2;

      const oldMaxX =
        area.center.x +
        area.width / 2;

      const oldMinY =
        area.center.z -
        area.depth / 2;

      const oldMaxY =
        area.center.z +
        area.depth / 2;

      return {
        id: area.id,
        name: area.name,

        minX:
          toDatabaseCoordinate(oldMinX),

        maxX:
          toDatabaseCoordinate(oldMaxX),

        minY:
          toDatabaseCoordinate(oldMinY),

        maxY:
          toDatabaseCoordinate(oldMaxY),
      };
    });

/**
 * Returns the first matching district.
 *
 * Bounds are inclusive at the minimum and exclusive
 * at the maximum.
 *
 * If districts overlap, array order determines which
 * district is returned.
 */
export function getDistrictAt(
  x: number,
  y: number,
): WorldDistrict | undefined {
  return WORLD_DISTRICTS.find(
    (district) =>
      x >= district.minX &&
      x < district.maxX &&
      y >= district.minY &&
      y < district.maxY,
  );
}