export interface CityLandmark {
  name: string;
  role: string;
  x: number;
  y: number;
  z?: number;
}

/**
 * =========================================================
 * CYPHERVERSE CITY LANDMARKS
 * =========================================================
 *
 * Coordinates use the same backend parcel coordinate system:
 *
 *   0, 16, 32, 48, ...
 *
 * Each landmark therefore sits directly on a real parcel.
 *
 * Genesis:
 *
 *   Decentral Station = 0,0
 *
 * The landmarks are deliberately distributed throughout
 * the world rather than clustered around Genesis.
 * =========================================================
 */

export const CITY_LANDMARKS: CityLandmark[] = [
  {
    name: "Decentral Station",
    role: "genesis",
    x: 0,
    y: 0,
    z: 0,
  },

  {
    name: "Northwest District",
    role: "district",
    x: 320,
    y: 1920,
    z: 0,
  },

  {
    name: "Northeast District",
    role: "district",
    x: 2080,
    y: 2080,
    z: 0,
  },

  {
    name: "Southeast District",
    role: "district",
    x: 2080,
    y: 320,
    z: 0,
  },

  {
    name: "Southwest District",
    role: "district",
    x: 320,
    y: 320,
    z: 0,
  },

  {
    name: "Meridian Exchange",
    role: "exchange",
    x: 1200,
    y: 1200,
    z: 0,
  },

  {
    name: "Aurora Heights",
    role: "heights",
    x: 720,
    y: 2160,
    z: 0,
  },

  {
    name: "Founders Crossing",
    role: "crossing",
    x: 640,
    y: 960,
    z: 0,
  },

  {
    name: "Eastgate",
    role: "gate",
    x: 1920,
    y: 1280,
    z: 0,
  },

  {
    name: "Westhaven",
    role: "haven",
    x: 320,
    y: 1120,
    z: 0,
  },

  {
    name: "Atlas Commons",
    role: "commons",
    x: 1200,
    y: 1920,
    z: 0,
  },

  {
    name: "Solstice Harbor",
    role: "harbor",
    x: 2080,
    y: 480,
    z: 0,
  },

  {
    name: "Liberty Row",
    role: "row",
    x: 960,
    y: 320,
    z: 0,
  },

  {
    name: "Crescent Market",
    role: "market",
    x: 1440,
    y: 880,
    z: 0,
  },

  {
    name: "Pioneer Fields",
    role: "fields",
    x: 400,
    y: 2240,
    z: 0,
  },

  {
    name: "Ironwood Quarter",
    role: "quarter",
    x: 1680,
    y: 1680,
    z: 0,
  },

  {
    name: "Summit Point",
    role: "summit",
    x: 2240,
    y: 2240,
    z: 0,
  },

  {
    name: "Riverstone",
    role: "river",
    x: 400,
    y: 800,
    z: 0,
  },

  {
    name: "Neon Boulevard",
    role: "boulevard",
    x: 1760,
    y: 1040,
    z: 0,
  },

  {
    name: "Horizon Point",
    role: "point",
    x: 1120,
    y: 2320,
    z: 0,
  },

  {
    name: "Crown Terrace",
    role: "terrace",
    x: 1600,
    y: 640,
    z: 0,
  },
];
