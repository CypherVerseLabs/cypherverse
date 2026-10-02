import { $Enums } from "../generated/prisma/client.js";

/**
 * =========================================================
 * CYPHERVERSE LANDMARKS
 * =========================================================
 *
 * 45 permanent CypherVerse landmarks.
 *
 * Coordinate system:
 *   x = east / west
 *   y = north / south
 *
 * Parcel coordinates map directly to:
 *   Parcel.x
 *   Parcel.y
 *
 * Landmark spacing:
 *   22 parcels horizontally
 *   22 parcels vertically
 *
 * The world uses a 7 × 7 coordinate grid:
 *
 *   -66
 *   -44
 *   -22
 *     0
 *    22
 *    44
 *    66
 *
 * The four extreme corners are intentionally left open,
 * resulting in exactly 45 landmarks.
 *
 * Genesis is fixed at:
 *   (0, 0)
 *
 * Every landmark is permanently classified as:
 *   CITY_LANDMARK
 *
 * Landmark parcels must not participate in the normal
 * parcel marketplace.
 */

export type CypherVerseLandmark = {
  estateId: string;
  x: number;
  y: number;
  name: string;
  description: string;
  type: $Enums.ParcelType;
};

/**
 * =========================================================
 * LANDMARKS
 * =========================================================
 */

export const CYPHERVERSE_LANDMARKS: CypherVerseLandmark[] = [
  // =======================================================
  // NORTHWEST
  // =======================================================

  {
    estateId: "landmark-northwest-frontier",
    x: -66,
    y: 66,
    name: "Northwest Frontier",
    description:
      "A permanent landmark marking the northwest frontier of CypherVerse.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-northwest-highlands",
    x: -44,
    y: 66,
    name: "Northwest Highlands",
    description:
      "An elevated northern district overlooking the western frontier.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-northern-library",
    x: -22,
    y: 66,
    name: "Northern Library",
    description:
      "A major northern knowledge and archive landmark.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-north-gate",
    x: 0,
    y: 66,
    name: "North Gate",
    description:
      "The primary northern gateway into the CypherVerse world.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-northern-observatory",
    x: 22,
    y: 66,
    name: "Northern Observatory",
    description:
      "A northern observatory overlooking the world grid.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-northstar",
    x: 44,
    y: 66,
    name: "Northstar",
    description:
      "A major landmark marking the northern expansion region.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-northeast-frontier",
    x: 66,
    y: 66,
    name: "Northeast Frontier",
    description:
      "A permanent landmark marking the northeast frontier.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  // =======================================================
  // NORTH INNER
  // =======================================================

  {
    estateId: "landmark-western-heights",
    x: -66,
    y: 44,
    name: "Western Heights",
    description:
      "A western highland landmark overlooking the surrounding districts.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-creative-district",
    x: -44,
    y: 44,
    name: "Creative District",
    description:
      "A cultural district focused on art, design, and creativity.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-grand-library",
    x: -22,
    y: 44,
    name: "Grand Library",
    description:
      "A major public archive dedicated to knowledge and history.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-university",
    x: 0,
    y: 44,
    name: "Cypher University",
    description:
      "A major center for education, research, and innovation.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-technology-district",
    x: 22,
    y: 44,
    name: "Technology District",
    description:
      "A major technology and development district.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-digital-district",
    x: 44,
    y: 44,
    name: "Digital District",
    description:
      "A district dedicated to digital infrastructure and services.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-eastern-heights",
    x: 66,
    y: 44,
    name: "Eastern Heights",
    description:
      "A major eastern highland landmark.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  // =======================================================
  // UPPER MID
  // =======================================================

  {
    estateId: "landmark-west-watch",
    x: -66,
    y: 22,
    name: "West Watch",
    description:
      "A western observation and gateway landmark.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-west-plaza",
    x: -44,
    y: 22,
    name: "West Plaza",
    description:
      "A major public plaza serving the western districts.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-cypher-gallery",
    x: -22,
    y: 22,
    name: "Cypher Gallery",
    description:
      "A major gallery showcasing digital and physical art.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-civic-center",
    x: 0,
    y: 22,
    name: "Civic Center",
    description:
      "The principal civic district north of Genesis.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-central-station",
    x: 22,
    y: 22,
    name: "Central Station",
    description:
      "A major transportation hub connecting the central districts.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-east-plaza",
    x: 44,
    y: 22,
    name: "East Plaza",
    description:
      "A major public square serving the eastern districts.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-east-watch",
    x: 66,
    y: 22,
    name: "East Watch",
    description:
      "A permanent eastern observation landmark.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  // =======================================================
  // CENTRAL
  // =======================================================

  {
    estateId: "landmark-west-gate",
    x: -66,
    y: 0,
    name: "West Gate",
    description:
      "The primary western gateway into CypherVerse.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-west-market",
    x: -44,
    y: 0,
    name: "West Market",
    description:
      "A western commercial and trading district.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-central-plaza",
    x: -22,
    y: 0,
    name: "Central Plaza",
    description:
      "A major public gathering space immediately west of Genesis.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-genesis",
    x: 0,
    y: 0,
    name: "Genesis",
    description:
      "The central landmark and geographic heart of CypherVerse.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-marketplace",
    x: 22,
    y: 0,
    name: "Marketplace",
    description:
      "The principal commercial and marketplace district.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-east-gate",
    x: 44,
    y: 0,
    name: "East Gate",
    description:
      "The primary eastern gateway into CypherVerse.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-eastern-frontier",
    x: 66,
    y: 0,
    name: "Eastern Frontier",
    description:
      "A permanent landmark marking the eastern world boundary.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  // =======================================================
  // LOWER MID
  // =======================================================

  {
    estateId: "landmark-western-harbor",
    x: -66,
    y: -22,
    name: "Western Harbor",
    description:
      "A western waterfront and transportation landmark.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-industrial-district",
    x: -44,
    y: -22,
    name: "Industrial District",
    description:
      "A major district for infrastructure, manufacturing, and logistics.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-financial-district",
    x: -22,
    y: -22,
    name: "Financial District",
    description:
      "A major commercial and financial district.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-south-civic-center",
    x: 0,
    y: -22,
    name: "South Civic Center",
    description:
      "A southern civic district connected to the central city.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-entertainment-district",
    x: 22,
    y: -22,
    name: "Entertainment District",
    description:
      "A major district for entertainment, nightlife, and public events.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-eastern-harbor",
    x: 44,
    y: -22,
    name: "Eastern Harbor",
    description:
      "A major eastern waterfront landmark.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-southeast-watch",
    x: 66,
    y: -22,
    name: "Southeast Watch",
    description:
      "A permanent landmark overlooking the southeastern region.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  // =======================================================
  // SOUTH
  // =======================================================

  {
    estateId: "landmark-southwest-frontier",
    x: -66,
    y: -44,
    name: "Southwest Frontier",
    description:
      "A permanent landmark marking the southwestern frontier.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-memorial-plaza",
    x: -44,
    y: -44,
    name: "Memorial Plaza",
    description:
      "A public memorial landmark dedicated to CypherVerse history.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-arena",
    x: -22,
    y: -44,
    name: "Cypher Arena",
    description:
      "A major venue for competitive events and entertainment.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-south-gate",
    x: 0,
    y: -44,
    name: "South Gate",
    description:
      "The primary southern gateway into CypherVerse.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-city-stadium",
    x: 22,
    y: -44,
    name: "City Stadium",
    description:
      "A major sporting and entertainment venue.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-south-market",
    x: 44,
    y: -44,
    name: "South Market",
    description:
      "A southern commercial and trading district.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-southeast-frontier",
    x: 66,
    y: -44,
    name: "Southeast Frontier",
    description:
      "A permanent landmark marking the southeastern frontier.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  // =======================================================
  // SOUTHERN OUTER ROW
  // =======================================================

  {
    estateId: "landmark-southwest-plaza",
    x: -44,
    y: -66,
    name: "Southwest Plaza",
    description:
      "A major public plaza serving the southwest region.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-southern-gardens",
    x: -22,
    y: -66,
    name: "Southern Gardens",
    description:
      "A large public green space in the southern region.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-south-central",
    x: 0,
    y: -66,
    name: "South Central",
    description:
      "A major southern landmark connecting the outer districts.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-skyport",
    x: 22,
    y: -66,
    name: "Skyport",
    description:
      "A major aerial transportation landmark.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-southwatch",
    x: 44,
    y: -66,
    name: "Southwatch",
    description:
      "A permanent landmark marking the southern expansion region.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },

  {
    estateId: "landmark-southern-frontier",
    x: 66,
    y: -66,
    name: "Southern Frontier",
    description:
      "A permanent landmark marking the southern world boundary.",
    type: $Enums.ParcelType.CITY_LANDMARK,
  },
];

/**
 * =========================================================
 * VALIDATION
 * =========================================================
 *
 * Prevent accidental duplicate estate IDs or coordinates.
 */

const estateIds = new Set<string>();
const coordinates = new Set<string>();

for (const landmark of CYPHERVERSE_LANDMARKS) {
  if (estateIds.has(landmark.estateId)) {
    throw new Error(
      `Duplicate CypherVerse landmark estateId: ${landmark.estateId}`,
    );
  }

  estateIds.add(landmark.estateId);

  const coordinateKey = `${landmark.x},${landmark.y}`;

  if (coordinates.has(coordinateKey)) {
    throw new Error(
      `Duplicate CypherVerse landmark coordinates: (${landmark.x}, ${landmark.y})`,
    );
  }

  coordinates.add(coordinateKey);

  if (landmark.type !== $Enums.ParcelType.CITY_LANDMARK) {
    throw new Error(
      `Invalid landmark type for ${landmark.estateId}`,
    );
  }
}

/**
 * =========================================================
 * COUNT VALIDATION
 * =========================================================
 */

if (CYPHERVERSE_LANDMARKS.length !== 45) {
  throw new Error(
    `Expected exactly 45 CypherVerse landmarks, found ${CYPHERVERSE_LANDMARKS.length}`,
  );
}