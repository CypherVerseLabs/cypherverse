import {
  CYPHERVERSE_AREAS,
} from "./CypherVerseMap";

export interface WorldDistrict {
  id: string;
  name: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/**
 * Derived from the existing visual map.
 *
 * These bounds describe geography only. They do not
 * reserve land or change parcel availability.
 */
export const WORLD_DISTRICTS: WorldDistrict[] =
  CYPHERVERSE_AREAS
    .filter((area) => area.kind === "DISTRICT")
    .map((area) => ({
      id: area.id,
      name: area.name,
      minX: area.center.x - area.width / 2,
      maxX: area.center.x + area.width / 2,
      minY: area.center.z - area.depth / 2,
      maxY: area.center.z + area.depth / 2,
    }));

/**
 * Returns the first matching district.
 *
 * Bounds are inclusive at the minimum and exclusive
 * at the maximum. Overlapping districts use array order.
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