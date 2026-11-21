/**
 * =========================================================
 * CYPHERVERSE WORLD MAP
 * =========================================================
 *
 * Declarative VISUAL city layout.
 *
 * SAFETY RULES
 *
 * - This file never creates, updates, or deletes Parcel records.
 * - Existing parcel IDs, coordinates, ownership, listings,
 *   purchase history, and Project associations remain authoritative.
 * - Drawing a road or public area does NOT reserve a parcel.
 * - Districts are descriptive visual overlays.
 * - Parks are visual overlays.
 * - Roads are visual geometry.
 * - No automatic database seeding occurs here.
 *
 * CITY MODEL
 *
 * - World: 4,800 × 4,800 metres.
 * - Parcel spacing: 16 metres.
 * - Genesis: 2,400, 2,400.
 * - World center in Three.js: 0, 0.
 *
 * The visual city is deliberately designed around:
 *
 *     PRIMARY ROAD
 *          ↓
 *     SECONDARY ROAD
 *          ↓
 *     NEIGHBORHOOD STREET
 *          ↓
 *     CITY BLOCK
 *          ↓
 *     PARCEL
 *          ↓
 *     PROJECT / BUILDING
 *
 * Changing this file changes the visual city plan only.
 * =========================================================
 */

export const PARCEL_SIZE = 16;

export const CURRENT_WORLD_SIZE = 4800;

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
 * Convert positive database/world coordinates into
 * centered Three.js coordinates.
 *
 * DB:
 *
 *     Genesis = 2400, 2400
 *
 * Three.js:
 *
 *     Genesis = 0, 0
 */
export function toCenteredWorld(
  point: WorldPoint,
): WorldPoint {
  return {
    x: point.x - WORLD_CENTER.x,
    z: point.z - WORLD_CENTER.z,
  };
}

/**
 * =========================================================
 * GRID
 * =========================================================
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

  /**
   * Human-readable street name.
   */
  name?: string;

  /**
   * Road centerline.
   */
  points: WorldPoint[];

  /**
   * Visual width only.
   */
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
 * ROAD NETWORK
 * =========================================================
 *
 * This is intentionally a connected city street system.
 *
 * PRIMARY
 * - city-scale movement
 * - district connectors
 * - major boulevard network
 *
 * SECONDARY
 * - district streets
 * - neighborhood connectors
 * - city block boundaries
 *
 * NEIGHBORHOOD
 * - represented as SECONDARY roads for compatibility
 * - smaller 16m visual width
 * - named individual streets
 *
 * IMPORTANT:
 *
 * These roads do NOT reserve Parcel records.
 * =========================================================
 */

export const CYPHERVERSE_ROADS: WorldRoad[] = [
  /**
   * -------------------------------------------------------
   * CENTRAL PRIMARY NETWORK
   * -------------------------------------------------------
   */

  {
    id: "central-north-south",
    kind: "PRIMARY",
    name: "Central Boulevard",
    width: 32,
    points: [
      { x: 2400, z: 120 },
      { x: 2400, z: 720 },
      { x: 2400, z: 1440 },
      { x: 2400, z: 2400 },
      { x: 2400, z: 3360 },
      { x: 2400, z: 4080 },
      { x: 2400, z: 4680 },
    ],
  },

  {
    id: "central-east-west",
    kind: "PRIMARY",
    name: "Unity Boulevard",
    width: 32,
    points: [
      { x: 120, z: 2400 },
      { x: 720, z: 2400 },
      { x: 1440, z: 2400 },
      { x: 2400, z: 2400 },
      { x: 3360, z: 2400 },
      { x: 4080, z: 2400 },
      { x: 4680, z: 2400 },
    ],
  },

  /**
   * -------------------------------------------------------
   * NORTHERN PRIMARY BELT
   * -------------------------------------------------------
   */

  {
    id: "northview-boulevard",
    kind: "PRIMARY",
    name: "Northview Boulevard",
    width: 28,
    points: [
      { x: 720, z: 960 },
      { x: 1440, z: 720 },
      { x: 2400, z: 680 },
      { x: 3360, z: 720 },
      { x: 4080, z: 960 },
    ],
  },

  /**
   * -------------------------------------------------------
   * SOUTHERN PRIMARY BELT
   * -------------------------------------------------------
   */

  {
    id: "civic-boulevard",
    kind: "PRIMARY",
    name: "Civic Boulevard",
    width: 28,
    points: [
      { x: 720, z: 3840 },
      { x: 1440, z: 4080 },
      { x: 2400, z: 4120 },
      { x: 3360, z: 4080 },
      { x: 4080, z: 3840 },
    ],
  },

  /**
   * -------------------------------------------------------
   * WEST PRIMARY SPINE
   * -------------------------------------------------------
   */

  {
    id: "liberty-drive",
    kind: "PRIMARY",
    name: "Liberty Drive",
    width: 28,
    points: [
      { x: 480, z: 1200 },
      { x: 720, z: 1680 },
      { x: 720, z: 2400 },
      { x: 720, z: 3120 },
      { x: 480, z: 3600 },
    ],
  },

  /**
   * -------------------------------------------------------
   * EAST PRIMARY SPINE
   * -------------------------------------------------------
   */

  {
    id: "innovation-drive",
    kind: "PRIMARY",
    name: "Innovation Drive",
    width: 28,
    points: [
      { x: 4320, z: 1200 },
      { x: 4080, z: 1680 },
      { x: 4080, z: 2400 },
      { x: 4080, z: 3120 },
      { x: 4320, z: 3600 },
    ],
  },

  /**
   * -------------------------------------------------------
   * OUTER CONNECTORS
   * -------------------------------------------------------
   */

  {
    id: "northwest-connector",
    kind: "PRIMARY",
    name: "Northwest Connector",
    width: 24,
    points: [
      { x: 180, z: 540 },
      { x: 720, z: 960 },
      { x: 1200, z: 1200 },
    ],
  },

  {
    id: "northeast-connector",
    kind: "PRIMARY",
    name: "Northeast Connector",
    width: 24,
    points: [
      { x: 4620, z: 540 },
      { x: 4080, z: 960 },
      { x: 3600, z: 1200 },
    ],
  },

  {
    id: "southwest-connector",
    kind: "PRIMARY",
    name: "Southwest Connector",
    width: 24,
    points: [
      { x: 180, z: 4260 },
      { x: 720, z: 3840 },
      { x: 1200, z: 3600 },
    ],
  },

  {
    id: "southeast-connector",
    kind: "PRIMARY",
    name: "Southeast Connector",
    width: 24,
    points: [
      { x: 4620, z: 4260 },
      { x: 4080, z: 3840 },
      { x: 3600, z: 3600 },
    ],
  },

  /**
   * =======================================================
   * CITY BLOCK STREETS
   * =======================================================
   *
   * These form a deliberate urban grid around the districts.
   */

  {
    id: "northview-street",
    kind: "SECONDARY",
    name: "Northview Street",
    width: 16,
    points: [
      { x: 560, z: 1120 },
      { x: 1200, z: 1120 },
      { x: 1800, z: 1120 },
      { x: 2400, z: 1120 },
      { x: 3000, z: 1120 },
      { x: 3600, z: 1120 },
      { x: 4240, z: 1120 },
    ],
  },

  {
    id: "artisan-avenue",
    kind: "SECONDARY",
    name: "Artisan Avenue",
    width: 16,
    points: [
      { x: 560, z: 1680 },
      { x: 1200, z: 1680 },
      { x: 1800, z: 1680 },
      { x: 2400, z: 1680 },
      { x: 3000, z: 1680 },
      { x: 3600, z: 1680 },
      { x: 4240, z: 1680 },
    ],
  },

  {
    id: "commerce-street",
    kind: "SECONDARY",
    name: "Commerce Street",
    width: 16,
    points: [
      { x: 560, z: 3120 },
      { x: 1200, z: 3120 },
      { x: 1800, z: 3120 },
      { x: 2400, z: 3120 },
      { x: 3000, z: 3120 },
      { x: 3600, z: 3120 },
      { x: 4240, z: 3120 },
    ],
  },

  {
    id: "southern-avenue",
    kind: "SECONDARY",
    name: "Southern Avenue",
    width: 16,
    points: [
      { x: 560, z: 3680 },
      { x: 1200, z: 3680 },
      { x: 1800, z: 3680 },
      { x: 2400, z: 3680 },
      { x: 3000, z: 3680 },
      { x: 3600, z: 3680 },
      { x: 4240, z: 3680 },
    ],
  },

  {
    id: "willow-way",
    kind: "SECONDARY",
    name: "Willow Way",
    width: 16,
    points: [
      { x: 1120, z: 560 },
      { x: 1120, z: 1120 },
      { x: 1120, z: 1680 },
      { x: 1120, z: 2400 },
      { x: 1120, z: 3120 },
      { x: 1120, z: 3680 },
      { x: 1120, z: 4240 },
    ],
  },

  {
    id: "community-street",
    kind: "SECONDARY",
    name: "Community Street",
    width: 16,
    points: [
      { x: 1680, z: 560 },
      { x: 1680, z: 1120 },
      { x: 1680, z: 1680 },
      { x: 1680, z: 2400 },
      { x: 1680, z: 3120 },
      { x: 1680, z: 3680 },
      { x: 1680, z: 4240 },
    ],
  },

  {
    id: "garden-avenue",
    kind: "SECONDARY",
    name: "Garden Avenue",
    width: 16,
    points: [
      { x: 3120, z: 560 },
      { x: 3120, z: 1120 },
      { x: 3120, z: 1680 },
      { x: 3120, z: 2400 },
      { x: 3120, z: 3120 },
      { x: 3120, z: 3680 },
      { x: 3120, z: 4240 },
    ],
  },

  {
    id: "future-drive",
    kind: "SECONDARY",
    name: "Future Drive",
    width: 16,
    points: [
      { x: 3680, z: 560 },
      { x: 3680, z: 1120 },
      { x: 3680, z: 1680 },
      { x: 3680, z: 2400 },
      { x: 3680, z: 3120 },
      { x: 3680, z: 3680 },
      { x: 3680, z: 4240 },
    ],
  },

  /**
   * =======================================================
   * NORTHWEST NEIGHBORHOOD
   * =======================================================
   */

  {
    id: "garden-lane",
    kind: "SECONDARY",
    name: "Garden Lane",
    width: 12,
    points: [
      { x: 760, z: 760 },
      { x: 760, z: 1000 },
      { x: 760, z: 1240 },
      { x: 760, z: 1480 },
    ],
  },

  {
    id: "maker-lane",
    kind: "SECONDARY",
    name: "Maker Lane",
    width: 12,
    points: [
      { x: 1360, z: 760 },
      { x: 1360, z: 1000 },
      { x: 1360, z: 1240 },
      { x: 1360, z: 1480 },
    ],
  },

  {
    id: "studio-street",
    kind: "SECONDARY",
    name: "Studio Street",
    width: 12,
    points: [
      { x: 760, z: 880 },
      { x: 1000, z: 880 },
      { x: 1240, z: 880 },
      { x: 1480, z: 880 },
    ],
  },

  {
    id: "creator-way",
    kind: "SECONDARY",
    name: "Creator Way",
    width: 12,
    points: [
      { x: 760, z: 1360 },
      { x: 1000, z: 1360 },
      { x: 1240, z: 1360 },
      { x: 1480, z: 1360 },
    ],
  },

  /**
   * =======================================================
   * NORTHEAST NEIGHBORHOOD
   * =======================================================
   */

  {
    id: "tech-lane",
    kind: "SECONDARY",
    name: "Tech Lane",
    width: 12,
    points: [
      { x: 3360, z: 760 },
      { x: 3360, z: 1000 },
      { x: 3360, z: 1240 },
      { x: 3360, z: 1480 },
    ],
  },

  {
    id: "innovation-lane",
    kind: "SECONDARY",
    name: "Innovation Lane",
    width: 12,
    points: [
      { x: 3920, z: 760 },
      { x: 3920, z: 1000 },
      { x: 3920, z: 1240 },
      { x: 3920, z: 1480 },
    ],
  },

  {
    id: "circuit-street",
    kind: "SECONDARY",
    name: "Circuit Street",
    width: 12,
    points: [
      { x: 3320, z: 880 },
      { x: 3560, z: 880 },
      { x: 3800, z: 880 },
      { x: 4040, z: 880 },
    ],
  },

  {
    id: "future-way",
    kind: "SECONDARY",
    name: "Future Way",
    width: 12,
    points: [
      { x: 3320, z: 1360 },
      { x: 3560, z: 1360 },
      { x: 3800, z: 1360 },
      { x: 4040, z: 1360 },
    ],
  },

  /**
   * =======================================================
   * SOUTHWEST NEIGHBORHOOD
   * =======================================================
   */

  {
    id: "culture-lane",
    kind: "SECONDARY",
    name: "Culture Lane",
    width: 12,
    points: [
      { x: 960, z: 3160 },
      { x: 960, z: 3400 },
      { x: 960, z: 3640 },
      { x: 960, z: 3880 },
    ],
  },

  {
    id: "museum-way",
    kind: "SECONDARY",
    name: "Museum Way",
    width: 12,
    points: [
      { x: 1520, z: 3160 },
      { x: 1520, z: 3400 },
      { x: 1520, z: 3640 },
      { x: 1520, z: 3880 },
    ],
  },

  {
    id: "heritage-street",
    kind: "SECONDARY",
    name: "Heritage Street",
    width: 12,
    points: [
      { x: 840, z: 3280 },
      { x: 1080, z: 3280 },
      { x: 1320, z: 3280 },
      { x: 1560, z: 3280 },
    ],
  },

  {
    id: "gallery-way",
    kind: "SECONDARY",
    name: "Gallery Way",
    width: 12,
    points: [
      { x: 840, z: 3760 },
      { x: 1080, z: 3760 },
      { x: 1320, z: 3760 },
      { x: 1560, z: 3760 },
    ],
  },

  /**
   * =======================================================
   * SOUTHEAST NEIGHBORHOOD
   * =======================================================
   */

  {
    id: "festival-lane",
    kind: "SECONDARY",
    name: "Festival Lane",
    width: 12,
    points: [
      { x: 3240, z: 3160 },
      { x: 3240, z: 3400 },
      { x: 3240, z: 3640 },
      { x: 3240, z: 3880 },
    ],
  },

  {
    id: "arena-way",
    kind: "SECONDARY",
    name: "Arena Way",
    width: 12,
    points: [
      { x: 3800, z: 3160 },
      { x: 3800, z: 3400 },
      { x: 3800, z: 3640 },
      { x: 3800, z: 3880 },
    ],
  },

  {
    id: "showcase-street",
    kind: "SECONDARY",
    name: "Showcase Street",
    width: 12,
    points: [
      { x: 3200, z: 3280 },
      { x: 3440, z: 3280 },
      { x: 3680, z: 3280 },
      { x: 3920, z: 3280 },
    ],
  },

  {
    id: "entertainment-way",
    kind: "SECONDARY",
    name: "Entertainment Way",
    width: 12,
    points: [
      { x: 3200, z: 3760 },
      { x: 3440, z: 3760 },
      { x: 3680, z: 3760 },
      { x: 3920, z: 3760 },
    ],
  },
];

/**
 * =========================================================
 * PUBLIC AREAS / DISTRICTS
 * =========================================================
 *
 * These are intentionally smaller than the previous layout.
 *
 * The goal is to visually open more land around them for
 * existing purchasable/available Parcel records.
 *
 * IMPORTANT:
 *
 * A visual area does NOT make land unavailable.
 * A Parcel's actual status still comes from the database.
 * =========================================================
 */

export const CYPHERVERSE_AREAS: WorldArea[] = [
  /**
   * -------------------------------------------------------
   * CENTER
   * -------------------------------------------------------
   */

  {
    id: "genesis-core",
    kind: "PLAZA",
    name: "Genesis",
    center: {
      x: 2400,
      z: 2400,
    },
    width: 256,
    depth: 256,
  },

  /**
   * -------------------------------------------------------
   * CIVIC CORE
   * -------------------------------------------------------
   */

  {
    id: "north-civic-plaza",
    kind: "PLAZA",
    name: "North Civic Plaza",
    center: {
      x: 2400,
      z: 760,
    },
    width: 160,
    depth: 112,
  },

  {
    id: "south-civic-plaza",
    kind: "PLAZA",
    name: "South Civic Plaza",
    center: {
      x: 2400,
      z: 3980,
    },
    width: 176,
    depth: 128,
  },

  /**
   * -------------------------------------------------------
   * MARKETS
   * -------------------------------------------------------
   */

  {
    id: "west-market-plaza",
    kind: "PLAZA",
    name: "West Market",
    center: {
      x: 820,
      z: 2400,
    },
    width: 144,
    depth: 144,
  },

  {
    id: "east-market-plaza",
    kind: "PLAZA",
    name: "East Market",
    center: {
      x: 3980,
      z: 2400,
    },
    width: 144,
    depth: 144,
  },

  /**
   * -------------------------------------------------------
   * CORNER GARDENS
   * -------------------------------------------------------
   *
   * Small public parks leave substantial surrounding
   * land visually open for city blocks and Parcels.
   */

  {
    id: "northwest-park",
    kind: "PARK",
    name: "Northwest Gardens",
    center: {
      x: 520,
      z: 520,
    },
    width: 192,
    depth: 192,
  },

  {
    id: "northeast-park",
    kind: "PARK",
    name: "Northstar Gardens",
    center: {
      x: 4280,
      z: 520,
    },
    width: 192,
    depth: 192,
  },

  {
    id: "southwest-park",
    kind: "PARK",
    name: "Memorial Gardens",
    center: {
      x: 520,
      z: 4280,
    },
    width: 192,
    depth: 192,
  },

  {
    id: "southeast-park",
    kind: "PARK",
    name: "Southern Gardens",
    center: {
      x: 4280,
      z: 4280,
    },
    width: 192,
    depth: 192,
  },

  /**
   * -------------------------------------------------------
   * SOUTH CIVIC GARDENS
   * -------------------------------------------------------
   *
   * Kept intentionally compact so the surrounding area
   * remains visually available for city blocks.
   */

  {
    id: "civic-gardens",
    kind: "PARK",
    name: "Civic Gardens",
    center: {
      x: 2400,
      z: 3500,
    },
    width: 224,
    depth: 144,
  },

  /**
   * -------------------------------------------------------
   * DISTRICTS
   * -------------------------------------------------------
   */

  {
    id: "creative-district",
    kind: "DISTRICT",
    name: "Creative District",
    center: {
      x: 1000,
      z: 1000,
    },
    width: 480,
    depth: 480,
  },

  {
    id: "technology-district",
    kind: "DISTRICT",
    name: "Technology District",
    center: {
      x: 3800,
      z: 1000,
    },
    width: 480,
    depth: 480,
  },

  {
    id: "market-district",
    kind: "DISTRICT",
    name: "Market District",
    center: {
      x: 900,
      z: 2400,
    },
    width: 480,
    depth: 384,
  },

  {
    id: "social-district",
    kind: "DISTRICT",
    name: "Social District",
    center: {
      x: 3900,
      z: 2400,
    },
    width: 480,
    depth: 384,
  },

  {
    id: "culture-district",
    kind: "DISTRICT",
    name: "Culture District",
    center: {
      x: 1050,
      z: 3750,
    },
    width: 560,
    depth: 480,
  },

  {
    id: "entertainment-district",
    kind: "DISTRICT",
    name: "Entertainment District",
    center: {
      x: 3750,
      z: 3750,
    },
    width: 560,
    depth: 480,
  },

  {
    id: "south-civic",
    kind: "DISTRICT",
    name: "South Civic",
    center: {
      x: 2400,
      z: 3950,
    },
    width: 416,
    depth: 288,
  },

  /**
   * -------------------------------------------------------
   * NORTH CIVIC
   * -------------------------------------------------------
   */

  {
    id: "north-civic",
    kind: "DISTRICT",
    name: "North Civic",
    center: {
      x: 2400,
      z: 850,
    },
    width: 416,
    depth: 256,
  },
];

/**
 * =========================================================
 * GRID / FOOTPRINT HELPERS
 * =========================================================
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
        Math.round(
          coordinate / PARCEL_SIZE,
        ),
    ) < 1e-9
  );
}

export function getAreaGridEnvelope(
  area: WorldArea,
) {
  const minX =
    area.center.x -
    area.width / 2;

  const maxX =
    area.center.x +
    area.width / 2;

  const minZ =
    area.center.z -
    area.depth / 2;

  const maxZ =
    area.center.z +
    area.depth / 2;

  return {
    minX:
      Math.floor(
        minX / PARCEL_SIZE,
      ) * PARCEL_SIZE,

    maxX:
      Math.ceil(
        maxX / PARCEL_SIZE,
      ) * PARCEL_SIZE,

    minZ:
      Math.floor(
        minZ / PARCEL_SIZE,
      ) * PARCEL_SIZE,

    maxZ:
      Math.ceil(
        maxZ / PARCEL_SIZE,
      ) * PARCEL_SIZE,
  };
}

export function getParcelAreaRelation(
  parcelX: number,
  parcelZ: number,
  area: WorldArea,
): ParcelFootprintRelation {
  const parcelMinX = parcelX;
  const parcelMaxX =
    parcelX + PARCEL_SIZE;

  const parcelMinZ = parcelZ;
  const parcelMaxZ =
    parcelZ + PARCEL_SIZE;

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

  const overlapX =
    Math.min(
      parcelMaxX,
      areaMaxX,
    ) -
    Math.max(
      parcelMinX,
      areaMinX,
    );

  const overlapZ =
    Math.min(
      parcelMaxZ,
      areaMaxZ,
    ) -
    Math.max(
      parcelMinZ,
      areaMinZ,
    );

  if (
    overlapX <= 0 ||
    overlapZ <= 0
  ) {
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