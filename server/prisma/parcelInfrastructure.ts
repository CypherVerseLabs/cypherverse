import {
  CYPHERVERSE_MAP,
  PARCEL_SIZE,
  type WorldArea,
  type WorldRoad,
} from "../../shared/world/CypherVerseWorldLayout.js";

export interface ParcelInfrastructureReservation {
  reserved: boolean;
  reason: string | null;
}

/**
 * A parcel occupies:
 *
 *   x ... x + 16
 *   y ... y + 16
 *
 * Roads are represented as centerline segments with a visual width.
 *
 * We reserve a parcel when the road corridor intersects the parcel.
 *
 * This intentionally uses a conservative rectangle expansion so that
 * roads do not visually run through purchasable land.
 */

function segmentIntersectsRectangle(
  fromX: number,
  fromZ: number,
  toX: number,
  toZ: number,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
): boolean {
  const dx = toX - fromX;
  const dz = toZ - fromZ;

  let tMin = 0;
  let tMax = 1;

  const constraints: Array<
    [number, number]
  > = [
    [-dx, fromX - minX],
    [dx, maxX - fromX],
    [-dz, fromZ - minZ],
    [dz, maxZ - fromZ],
  ];

  for (const [p, q] of constraints) {
    if (p === 0) {
      if (q < 0) {
        return false;
      }

      continue;
    }

    const r = q / p;

    if (p < 0) {
      if (r > tMax) {
        return false;
      }

      if (r > tMin) {
        tMin = r;
      }
    } else {
      if (r < tMin) {
        return false;
      }

      if (r < tMax) {
        tMax = r;
      }
    }
  }

  return true;
}

function parcelIntersectsRoad(
  x: number,
  y: number,
  road: WorldRoad,
): boolean {
  const halfRoadWidth =
    road.width / 2;

  /*
   * Expand the parcel by half the road width.
   *
   * If the road centerline intersects this expanded rectangle,
   * the actual road corridor intersects the parcel.
   */
  const minX =
    x - halfRoadWidth;

  const maxX =
    x +
    PARCEL_SIZE +
    halfRoadWidth;

  const minZ =
    y - halfRoadWidth;

  const maxZ =
    y +
    PARCEL_SIZE +
    halfRoadWidth;

  for (
    let index = 0;
    index < road.points.length - 1;
    index++
  ) {
    const from =
      road.points[index];

    const to =
      road.points[index + 1];

    if (
      segmentIntersectsRectangle(
        from.x,
        from.z,
        to.x,
        to.z,
        minX,
        maxX,
        minZ,
        maxZ,
      )
    ) {
      return true;
    }
  }

  return false;
}

function parcelIntersectsArea(
  x: number,
  y: number,
  area: WorldArea,
): boolean {
  const parcelMinX = x;
  const parcelMaxX =
    x + PARCEL_SIZE;

  const parcelMinZ = y;
  const parcelMaxZ =
    y + PARCEL_SIZE;

  const areaMinX =
    area.center.x -
    area.width / 2;

  const areaMaxX =
    area.center.x +
    area.width / 2;

  const areaMinZ =
    area.center.z -
    area.depth / 2;

  const areaMaxZ =
    area.center.z +
    area.depth / 2;

  return (
    parcelMinX < areaMaxX &&
    parcelMaxX > areaMinX &&
    parcelMinZ < areaMaxZ &&
    parcelMaxZ > areaMinZ
  );
}

/**
 * Returns the infrastructure reservation state
 * for one canonical database parcel.
 *
 * IMPORTANT:
 *
 * DISTRICT areas are intentionally NOT reserved.
 *
 * Only:
 *
 *   - roads
 *   - parks
 *   - plazas
 *
 * reserve land.
 */
export function getParcelInfrastructureReservation(
  x: number,
  y: number,
): ParcelInfrastructureReservation {
  const roadReasons: string[] = [];

  for (
    const road of CYPHERVERSE_MAP.roads
  ) {
    if (
      parcelIntersectsRoad(
        x,
        y,
        road,
      )
    ) {
      roadReasons.push(
        road.name ??
        road.id,
      );
    }
  }

  if (
    roadReasons.length > 0
  ) {
    return {
      reserved: true,
      reason:
        `Road: ${roadReasons.join(", ")}`,
    };
  }

  const publicAreas =
    CYPHERVERSE_MAP.areas.filter(
      (area: { kind: string; }) =>
        area.kind === "PARK" ||
        area.kind === "PLAZA",
    );

  for (
    const area of publicAreas
  ) {
    if (
      parcelIntersectsArea(
        x,
        y,
        area,
      )
    ) {
      return {
        reserved: true,
        reason:
          `Public area: ${area.name}`,
      };
    }
  }

  return {
    reserved: false,
    reason: null,
  };
}