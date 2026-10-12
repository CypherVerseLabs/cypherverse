/**
 * =========================================================
 * CYPHERVERSE WORLD MAP
 * =========================================================
 *
 * Declarative VISUAL map configuration.
 *
 * SAFETY RULES
 *
 * - This file never creates, updates, or deletes Parcel records.
 * - Existing parcel IDs, coordinates, ownership, listings,
 *   purchase history, and Project associations are authoritative.
 * - Drawing a road or public area does NOT reserve a parcel.
 * - Districts are descriptive overlays, not reservation boundaries.
 * - No automatic database seeding or world expansion occurs here.
 *
 * COORDINATES
 *
 * - 1 world metre = 1 database coordinate unit.
 * - Parcel spacing = 16 metres.
 * - X maps to THREE X.
 * - Z maps to THREE Z.
 *
 * WORLD CAPACITY
 *
 * - Current configured world: 2,400 × 2,400 metres.
 * - Current grid capacity: 150 × 150 positions.
 * - Future configured world: 4,800 × 4,800 metres.
 * - Future grid capacity: 300 × 300 positions.
 *
 * Expansion is configuration only. It does not create parcels.
 * =========================================================
 */

export const PARCEL_SIZE = 16;

export const CURRENT_WORLD_SIZE = 2400;

export const CURRENT_WORLD_MAX =
  CURRENT_WORLD_SIZE - PARCEL_SIZE;

export const FUTURE_WORLD_SIZE = 4800;

export const CURRENT_GRID_SIDE =
  CURRENT_WORLD_SIZE / PARCEL_SIZE;

export const FUTURE_GRID_SIDE =
  FUTURE_WORLD_SIZE / PARCEL_SIZE;

export const CURRENT_GRID_CAPACITY =
  CURRENT_GRID_SIDE * CURRENT_GRID_SIDE;

export const FUTURE_GRID_CAPACITY =
  FUTURE_GRID_SIDE * FUTURE_GRID_SIDE;

export const WORLD_CENTER = {
  x: CURRENT_WORLD_SIZE / 2,
  z: CURRENT_WORLD_SIZE / 2,
} as const;

/**
 * Grid-alignment metadata.
 *
 * A grid-aligned boundary is a multiple of PARCEL_SIZE
 * measured from the world origin.
 *
 * This metadata is for auditing and rendering only.
 */
export const WORLD_GRID = {
  parcelSize: PARCEL_SIZE,
  originX: 0,
  originZ: 0,
  currentSize: CURRENT_WORLD_SIZE,
  futureSize: FUTURE_WORLD_SIZE,
  expansionEnabled: false,
} as const;

/**
 * =========================================================
 * MAP TYPES
 * =========================================================
 */

export type WorldRoadKind =
  | "PRIMARY"
  | "SECONDARY"
  | "DIAGONAL"
  | "CURVED";

export type WorldAreaKind =
  | "PLAZA"
  | "PARK"
  | "DISTRICT";

export interface WorldPoint {
  x: number;
  z: number;
}

export interface WorldRoad {
  id: string;
  kind: WorldRoadKind;
  points: WorldPoint[];
  width: number;
}

export interface WorldArea {
  id: string;
  kind: WorldAreaKind;
  name: string;
  center: WorldPoint;
  width: number;
  depth: number;
}

/**
 * Reservation metadata is intentionally separate from the
 * visual map.
 *
 * These types describe future audit output. They do not
 * reserve parcels or establish authoritative ownership.
 */
export type ParcelFootprintRelation =
  | "OUTSIDE"
  | "PARTIAL"
  | "FULL";

export interface ParcelFootprintAudit {
  parcelId: string;
  areaId: string;
  relation: ParcelFootprintRelation;
}

export interface WorldMapDefinition {
  roads: WorldRoad[];
  areas: WorldArea[];
}

/**
 * =========================================================
 * ROAD SYSTEM
 * =========================================================
 *
 * These widths describe visual road geometry.
 *
 * PRIMARY:   32 metres
 * SECONDARY: 16 metres
 * DIAGONAL:  24 metres
 * CURVED:    20 metres
 *
 * Non-grid-aligned widths are permitted visually.
 * They must not be treated as authoritative parcel
 * reservation boundaries without a separate audit.
 *
 * The road geometry does not alter parcel coordinates.
 * =========================================================
 */

export const CYPHERVERSE_ROADS: WorldRoad[] = [
  {
    id: "central-north-south",
    kind: "PRIMARY",
    width: 32,
    points: [
      { x: 1200, z: 120 },
      { x: 1200, z: 1200 },
      { x: 1200, z: 2280 },
    ],
  },
  {
    id: "central-east-west",
    kind: "PRIMARY",
    width: 32,
    points: [
      { x: 120, z: 1200 },
      { x: 1200, z: 1200 },
      { x: 2280, z: 1200 },
    ],
  },
  {
    id: "north-discovery",
    kind: "SECONDARY",
    width: 16,
    points: [
      { x: 480, z: 760 },
      { x: 760, z: 920 },
      { x: 1200, z: 1040 },
      { x: 1640, z: 920 },
      { x: 1920, z: 760 },
    ],
  },
  {
    id: "south-discovery",
    kind: "SECONDARY",
    width: 16,
    points: [
      { x: 480, z: 1640 },
      { x: 760, z: 1480 },
      { x: 1200, z: 1360 },
      { x: 1640, z: 1480 },
      { x: 1920, z: 1640 },
    ],
  },
  {
    id: "northwest-diagonal",
    kind: "DIAGONAL",
    width: 24,
    points: [
      { x: 160, z: 520 },
      { x: 560, z: 760 },
      { x: 920, z: 1080 },
      { x: 1200, z: 1200 },
    ],
  },
  {
    id: "northeast-diagonal",
    kind: "DIAGONAL",
    width: 24,
    points: [
      { x: 2240, z: 520 },
      { x: 1840, z: 760 },
      { x: 1480, z: 1080 },
      { x: 1200, z: 1200 },
    ],
  },
  {
    id: "southwest-diagonal",
    kind: "DIAGONAL",
    width: 24,
    points: [
      { x: 160, z: 1880 },
      { x: 560, z: 1640 },
      { x: 920, z: 1320 },
      { x: 1200, z: 1200 },
    ],
  },
  {
    id: "southeast-diagonal",
    kind: "DIAGONAL",
    width: 24,
    points: [
      { x: 2240, z: 1880 },
      { x: 1840, z: 1640 },
      { x: 1480, z: 1320 },
      { x: 1200, z: 1200 },
    ],
  },
  {
    id: "west-inner-curve",
    kind: "CURVED",
    width: 20,
    points: [
      { x: 520, z: 920 },
      { x: 440, z: 1040 },
      { x: 420, z: 1200 },
      { x: 440, z: 1360 },
      { x: 520, z: 1480 },
    ],
  },
  {
    id: "east-inner-curve",
    kind: "CURVED",
    width: 20,
    points: [
      { x: 1880, z: 920 },
      { x: 1960, z: 1040 },
      { x: 1980, z: 1200 },
      { x: 1960, z: 1360 },
      { x: 1880, z: 1480 },
    ],
  },
];

/**
 * =========================================================
 * PUBLIC AREAS AND DISTRICT OVERLAYS
 * =========================================================
 *
 * Visual dimensions are not reservation envelopes.
 * Some bounds are not grid-aligned.
 * Some areas overlap roads or other areas.
 *
 * Genesis visual bounds:
 *   X: 1080–1320
 *   Z: 1080–1320
 *
 * A proposed 256 × 256 metre grid-aligned envelope would
 * have bounds 1072–1328. This is NOT a reservation.
 * =========================================================
 */

export const CYPHERVERSE_AREAS: WorldArea[] = [
  {
    id: "genesis-core",
    kind: "PLAZA",
    name: "Genesis",
    center: { x: 1200, z: 1200 },
    width: 240,
    depth: 240,
  },
  {
    id: "north-civic-plaza",
    kind: "PLAZA",
    name: "North Civic Plaza",
    center: { x: 1200, z: 760 },
    width: 128,
    depth: 96,
  },
  {
    id: "west-market-plaza",
    kind: "PLAZA",
    name: "West Market",
    center: { x: 760, z: 1200 },
    width: 128,
    depth: 128,
  },
  {
    id: "east-market-plaza",
    kind: "PLAZA",
    name: "East Market",
    center: { x: 1640, z: 1200 },
    width: 128,
    depth: 128,
  },
  {
    id: "northwest-park",
    kind: "PARK",
    name: "Northwest Gardens",
    center: { x: 600, z: 600 },
    width: 224,
    depth: 192,
  },
  {
    id: "northeast-park",
    kind: "PARK",
    name: "Northstar Gardens",
    center: { x: 1800, z: 600 },
    width: 224,
    depth: 192,
  },
  {
    id: "southwest-park",
    kind: "PARK",
    name: "Memorial Gardens",
    center: { x: 600, z: 1800 },
    width: 224,
    depth: 192,
  },
  {
    id: "southeast-park",
    kind: "PARK",
    name: "Southern Gardens",
    center: { x: 1800, z: 1800 },
    width: 224,
    depth: 192,
  },
  {
    id: "creative-district",
    kind: "DISTRICT",
    name: "Creative District",
    center: { x: 520, z: 920 },
    width: 320,
    depth: 320,
  },
  {
    id: "technology-district",
    kind: "DISTRICT",
    name: "Technology District",
    center: { x: 1880, z: 920 },
    width: 320,
    depth: 320,
  },
  {
    id: "market-district",
    kind: "DISTRICT",
    name: "Market District",
    center: { x: 600, z: 1200 },
    width: 320,
    depth: 256,
  },
  {
    id: "social-district",
    kind: "DISTRICT",
    name: "Social District",
    center: { x: 1800, z: 1200 },
    width: 320,
    depth: 256,
  },
  {
    id: "culture-district",
    kind: "DISTRICT",
    name: "Culture District",
    center: { x: 760, z: 1760 },
    width: 352,
    depth: 320,
  },
  {
    id: "entertainment-district",
    kind: "DISTRICT",
    name: "Entertainment District",
    center: { x: 1640, z: 1760 },
    width: 352,
    depth: 320,
  },
  {
    id: "south-civic",
    kind: "DISTRICT",
    name: "South Civic",
    center: { x: 1200, z: 1840 },
    width: 256,
    depth: 224,
  },
];

/**
 * =========================================================
 * GRID AND FOOTPRINT HELPERS
 * =========================================================
 *
 * Pure functions only.
 *
 * These helpers can support a future parcel-footprint audit.
 * They do not read or write the database.
 * =========================================================
 */

/**
 * True when a coordinate lies on the parcel grid,
 * measured from the configured world origin.
 */
export function isGridAligned(
  coordinate: number,
): boolean {
  if (!Number.isFinite(coordinate)) {
    return false;
  }

  return (
    Math.abs(
      coordinate / PARCEL_SIZE -
        Math.round(coordinate / PARCEL_SIZE),
    ) < 1e-9
  );
}

/**
 * Return the grid-aligned envelope enclosing a rectangular
 * visual area.
 *
 * This is an audit proposal, not a land reservation.
 */
export function getAreaGridEnvelope(
  area: WorldArea,
) {
  const minX = area.center.x - area.width / 2;
  const maxX = area.center.x + area.width / 2;
  const minZ = area.center.z - area.depth / 2;
  const maxZ = area.center.z + area.depth / 2;

  return {
    minX:
      Math.floor(minX / PARCEL_SIZE) * PARCEL_SIZE,

    maxX:
      Math.ceil(maxX / PARCEL_SIZE) * PARCEL_SIZE,

    minZ:
      Math.floor(minZ / PARCEL_SIZE) * PARCEL_SIZE,

    maxZ:
      Math.ceil(maxZ / PARCEL_SIZE) * PARCEL_SIZE,
  };
}

/**
 * Classify the relationship between a parcel footprint and
 * an axis-aligned rectangular area.
 *
 * Parcel coordinates are treated as the parcel's origin.
 * The parcel occupies [x, x + size] × [z, z + size].
 *
 * The area uses its visual width and depth, not a reserved
 * or grid-aligned envelope.
 */
export function getParcelAreaRelation(
  parcelX: number,
  parcelZ: number,
  area: WorldArea,
): ParcelFootprintRelation {
  const parcelMinX = parcelX;
  const parcelMaxX = parcelX + PARCEL_SIZE;
  const parcelMinZ = parcelZ;
  const parcelMaxZ = parcelZ + PARCEL_SIZE;

  const areaMinX = area.center.x - area.width / 2;
  const areaMaxX = area.center.x + area.width / 2;
  const areaMinZ = area.center.z - area.depth / 2;
  const areaMaxZ = area.center.z + area.depth / 2;

  const overlapX =
    Math.min(parcelMaxX, areaMaxX) -
    Math.max(parcelMinX, areaMinX);

  const overlapZ =
    Math.min(parcelMaxZ, areaMaxZ) -
    Math.max(parcelMinZ, areaMinZ);

  if (overlapX <= 0 || overlapZ <= 0) {
    return "OUTSIDE";
  }

  if (
    parcelMinX >= areaMinX &&
    parcelMaxX <= areaMaxX &&
    parcelMinZ >= areaMinZ &&
    parcelMaxZ <= areaMaxZ
  ) {
    return "FULL";
  }

  return "PARTIAL";
}

/**
 * =========================================================
 * COMPLETE MAP
 * =========================================================
 */

export const CYPHERVERSE_MAP: WorldMapDefinition = {
  roads: CYPHERVERSE_ROADS,
  areas: CYPHERVERSE_AREAS,
};