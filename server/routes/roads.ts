import { Router, Response } from "express";

const router = Router();

const PARCEL_SIZE = 16;
const GRID_SIZE = 150;
const WORLD_MAX = (GRID_SIZE - 1) * PARCEL_SIZE;

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
  // Every 20 parcels
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
        y: 0,
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
        x: 0,
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
  // Every 5 parcels
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
        y: 0,
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
        x: 0,
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
  // =======================================================

  const center = WORLD_MAX / 2;

  roads.push({
    id: "central-boulevard-x",
    type: "avenue",
    name: "Central Boulevard",
    start: {
      x: 0,
      y: center,
    },
    end: {
      x: WORLD_MAX,
      y: center,
    },
    width: 32,
  });

  roads.push({
    id: "central-boulevard-y",
    type: "avenue",
    name: "Central Boulevard",
    start: {
      x: center,
      y: 0,
    },
    end: {
      x: center,
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
      x: 0,
      y: 0,
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
      y: 0,
    },
    end: {
      x: 0,
      y: WORLD_MAX,
    },
    width: 14,
  });

  // =======================================================
  // PLAZAS
  // =======================================================

  const plazas = [
    {
      id: "central-plaza",
      name: "Central Plaza",
      x: center,
      y: center,
    },
    {
      id: "north-plaza",
      name: "North Plaza",
      x: center,
      y: WORLD_MAX * 0.2,
    },
    {
      id: "south-plaza",
      name: "South Plaza",
      x: center,
      y: WORLD_MAX * 0.8,
    },
    {
      id: "east-plaza",
      name: "East Plaza",
      x: WORLD_MAX * 0.8,
      y: center,
    },
    {
      id: "west-plaza",
      name: "West Plaza",
      x: WORLD_MAX * 0.2,
      y: center,
    },
  ];

  for (const plaza of plazas) {
    roads.push({
      id: plaza.id,
      type: "plaza",
      name: plaza.name,
      start: {
        x: plaza.x - 64,
        y: plaza.y,
      },
      end: {
        x: plaza.x + 64,
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
      x: 0,
      y: center,
    },
    end: {
      x: WORLD_MAX,
      y: center,
    },
    width: 6,
  });

  roads.push({
    id: "central-walk-vertical",
    type: "path",
    name: "Central Walk",
    start: {
      x: center,
      y: 0,
    },
    end: {
      x: center,
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
  (
    _req,
    res: Response
  ) => {
    return res.status(200).json({
      roads,
      count: roads.length,

      world: {
        gridSize: GRID_SIZE,
        parcelSize: PARCEL_SIZE,
        width: WORLD_MAX,
        height: WORLD_MAX,
      },
    });
  }
);

export default router;
