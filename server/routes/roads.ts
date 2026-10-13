import { Router, Response } from "express";

const router = Router();

const PARCEL_SIZE = 16;
const GRID_SIZE = 150;

const WORLD_MIN = 0;
const WORLD_MAX = (GRID_SIZE - 1) * PARCEL_SIZE;

const CITY_CENTER =
  Math.floor((GRID_SIZE - 1) / 2) * PARCEL_SIZE;

type RoadType =
  | "avenue"
  | "street"
  | "path"
  | "plaza";

interface Road {
  id: string;
  type: RoadType;
  name: string;
  start: {
    x: number;
    y: number;
  };
  end: {
    x: number;
    y: number;
  };
  width: number;
}

function generateRoads(): Road[] {
  const roads: Road[] = [];

  // =======================================================
  // MAJOR AVENUES
  // Every 20 parcel indices
  // =======================================================

  const majorSpacing = 20;

  for (
    let grid = majorSpacing;
    grid < GRID_SIZE;
    grid += majorSpacing
  ) {
    const position = grid * PARCEL_SIZE;

    roads.push({
      id: `avenue-x-${grid}`,
      type: "avenue",
      name: `Avenue ${grid}`,
      start: {
        x: position,
        y: WORLD_MIN,
      },
      end: {
        x: position,
        y: WORLD_MAX,
      },
      width: 24,
    });

    roads.push({
      id: `avenue-y-${grid}`,
      type: "avenue",
      name: `Avenue ${grid}`,
      start: {
        x: WORLD_MIN,
        y: position,
      },
      end: {
        x: WORLD_MAX,
        y: position,
      },
      width: 24,
    });
  }

  // =======================================================
  // SECONDARY STREETS
  // Every 5 parcel indices
  // =======================================================

  const streetSpacing = 5;

  for (
    let grid = streetSpacing;
    grid < GRID_SIZE;
    grid += streetSpacing
  ) {
    if (grid % majorSpacing === 0) {
      continue;
    }

    const position = grid * PARCEL_SIZE;

    roads.push({
      id: `street-x-${grid}`,
      type: "street",
      name: `Street ${grid}`,
      start: {
        x: position,
        y: WORLD_MIN,
      },
      end: {
        x: position,
        y: WORLD_MAX,
      },
      width: 12,
    });

    roads.push({
      id: `street-y-${grid}`,
      type: "street",
      name: `Street ${grid}`,
      start: {
        x: WORLD_MIN,
        y: position,
      },
      end: {
        x: WORLD_MAX,
        y: position,
      },
      width: 12,
    });
  }

  // =======================================================
  // CENTRAL BOULEVARD
  // Crosses at the city center.
  // =======================================================

  roads.push({
    id: "central-boulevard-x",
    type: "avenue",
    name: "Central Boulevard",
    start: {
      x: WORLD_MIN,
      y: CITY_CENTER,
    },
    end: {
      x: WORLD_MAX,
      y: CITY_CENTER,
    },
    width: 32,
  });

  roads.push({
    id: "central-boulevard-y",
    type: "avenue",
    name: "Central Boulevard",
    start: {
      x: CITY_CENTER,
      y: WORLD_MIN,
    },
    end: {
      x: CITY_CENTER,
      y: WORLD_MAX,
    },
    width: 32,
  });

  // =======================================================
  // DIAGONAL CONNECTORS
  // =======================================================

  roads.push({
    id: "diagonal-northeast",
    type: "street",
    name: "Northeast Connector",
    start: {
      x: WORLD_MIN,
      y: WORLD_MIN,
    },
    end: {
      x: WORLD_MAX,
      y: WORLD_MAX,
    },
    width: 14,
  });

  roads.push({
    id: "diagonal-southeast",
    type: "street",
    name: "Southeast Connector",
    start: {
      x: WORLD_MAX,
      y: WORLD_MIN,
    },
    end: {
      x: WORLD_MIN,
      y: WORLD_MAX,
    },
    width: 14,
  });

  // =======================================================
  // PLAZAS
  // =======================================================

  const plazaOffset = WORLD_MAX * 0.3;

  const plazas = [
    {
      id: "central-plaza",
      name: "Central Plaza",
      x: CITY_CENTER,
      y: CITY_CENTER,
    },
    {
      id: "north-plaza",
      name: "North Plaza",
      x: CITY_CENTER,
      y: CITY_CENTER + plazaOffset,
    },
    {
      id: "south-plaza",
      name: "South Plaza",
      x: CITY_CENTER,
      y: CITY_CENTER - plazaOffset,
    },
    {
      id: "east-plaza",
      name: "East Plaza",
      x: CITY_CENTER + plazaOffset,
      y: CITY_CENTER,
    },
    {
      id: "west-plaza",
      name: "West Plaza",
      x: CITY_CENTER - plazaOffset,
      y: CITY_CENTER,
    },
  ];

  for (const plaza of plazas) {
    roads.push({
      id: plaza.id,
      type: "plaza",
      name: plaza.name,
      start: {
        x: Math.max(
          WORLD_MIN,
          plaza.x - 64,
        ),
        y: plaza.y,
      },
      end: {
        x: Math.min(
          WORLD_MAX,
          plaza.x + 64,
        ),
        y: plaza.y,
      },
      width: 64,
    });
  }

  // =======================================================
  // PEDESTRIAN PATHS
  // =======================================================

  roads.push({
    id: "central-walk-horizontal",
    type: "path",
    name: "Central Walk",
    start: {
      x: WORLD_MIN,
      y: CITY_CENTER,
    },
    end: {
      x: WORLD_MAX,
      y: CITY_CENTER,
    },
    width: 6,
  });

  roads.push({
    id: "central-walk-vertical",
    type: "path",
    name: "Central Walk",
    start: {
      x: CITY_CENTER,
      y: WORLD_MIN,
    },
    end: {
      x: CITY_CENTER,
      y: WORLD_MAX,
    },
    width: 6,
  });

  return roads;
}

const roads = generateRoads();

// =========================================================
// GET /api/roads
// =========================================================

router.get(
  "/",
  (_req, res: Response) => {
    return res.status(200).json({
      roads,
      count: roads.length,

      world: {
        gridSize: GRID_SIZE,
        parcelSize: PARCEL_SIZE,
        minX: WORLD_MIN,
        maxX: WORLD_MAX,
        minY: WORLD_MIN,
        maxY: WORLD_MAX,
        width: WORLD_MAX,
        height: WORLD_MAX,
        center: CITY_CENTER,
      },
    });
  },
);

export default router;