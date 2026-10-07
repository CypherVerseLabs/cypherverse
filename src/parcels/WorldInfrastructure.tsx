import {
  useMemo,
} from "react";

import type {
  Parcel,
} from "./types";


/**
 * =========================================================
 * WORLD INFRASTRUCTURE
 * =========================================================
 *
 * Visual infrastructure for the CypherVerse world.
 *
 * This component intentionally does NOT:
 *
 * - fetch parcels
 * - modify parcels
 * - manage ownership
 * - manage marketplace state
 * - change parcel coordinates
 *
 * It simply makes the world feel like a large continuous
 * virtual geography instead of a collection of isolated
 * 16 x 16 squares.
 *
 * Coordinate system:
 *
 *   parcel.x -> world X
 *   parcel.y -> world Z
 *
 * =========================================================
 */


/**
 * =========================================================
 * CONFIGURATION
 * =========================================================
 */

/**
 * One parcel is currently 16 x 16 world units.
 */
const DEFAULT_TILE_SIZE = 16;


/**
 * Major roads occur every 256 world units.
 *
 * 256 / 16 = 16 parcels.
 *
 * This means a major road appears approximately every
 * 16 parcels.
 */
const MAJOR_ROAD_SPACING = 256;


/**
 * Secondary roads occur every 128 world units.
 *
 * 128 / 16 = 8 parcels.
 */
const SECONDARY_ROAD_SPACING = 128;


/**
 * Major road width.
 */
const MAJOR_ROAD_WIDTH = 7;


/**
 * Secondary road width.
 */
const SECONDARY_ROAD_WIDTH = 4;


/**
 * District size.
 *
 * 1024 world units = 64 parcels.
 */
const DISTRICT_SIZE = 1024;


/**
 * How much empty margin to place around loaded parcels.
 */
const WORLD_MARGIN = 128;


/**
 * Height of infrastructure above the parcel surface.
 *
 * This deliberately stays very small.
 */
const ROAD_HEIGHT = 0.045;


/**
 * =========================================================
 * PROPS
 * =========================================================
 */

export interface WorldInfrastructureProps {

  /**
   * Currently loaded parcels.
   *
   * Used only to determine the visible world bounds.
   */
  parcels: Parcel[];

  /**
   * Physical size of one parcel.
   */
  tileSize?: number;

  /**
   * World origin.
   */
  origin?: [
    number,
    number,
    number
  ];

  /**
   * Whether infrastructure should render.
   */
  visible?: boolean;
}


/**
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function WorldInfrastructure({
  parcels,
  tileSize = DEFAULT_TILE_SIZE,
  origin = [0, 0, 0],
  visible = true,
}: WorldInfrastructureProps) {

  /**
   * =======================================================
   * WORLD BOUNDS
   * =======================================================
   *
   * Hooks must always run in the same order on every render.
   *
   * Therefore the empty/hidden check happens AFTER all
   * useMemo calls below.
   */

  const bounds =
  useMemo(
    () => {

      if (parcels.length === 0) {
        return {
          minX: 0,
          maxX: 0,
          minZ: 0,
          maxZ: 0,
        };
      }

      let minX =
        Infinity;

      let maxX =
        -Infinity;

      let minZ =
        Infinity;

      let maxZ =
        -Infinity;



        for (
          const parcel
          of parcels
        ) {

          minX =
            Math.min(
              minX,
              parcel.x
            );

          maxX =
            Math.max(
              maxX,
              parcel.x
            );

          minZ =
            Math.min(
              minZ,
              parcel.y
            );

          maxZ =
            Math.max(
              maxZ,
              parcel.y
            );

        }


        /**
         * Align bounds to major road intervals.
         *
         * This keeps the infrastructure stable as chunks
         * stream in.
         */

        const alignedMinX =
          Math.floor(
            (
              minX -
              WORLD_MARGIN -
              origin[0]
            ) /
            MAJOR_ROAD_SPACING
          ) *
          MAJOR_ROAD_SPACING +
          origin[0];


        const alignedMaxX =
          Math.ceil(
            (
              maxX +
              WORLD_MARGIN -
              origin[0]
            ) /
            MAJOR_ROAD_SPACING
          ) *
          MAJOR_ROAD_SPACING +
          origin[0];


        const alignedMinZ =
          Math.floor(
            (
              minZ -
              WORLD_MARGIN -
              origin[2]
            ) /
            MAJOR_ROAD_SPACING
          ) *
          MAJOR_ROAD_SPACING +
          origin[2];


        const alignedMaxZ =
          Math.ceil(
            (
              maxZ +
              WORLD_MARGIN -
              origin[2]
            ) /
            MAJOR_ROAD_SPACING
          ) *
          MAJOR_ROAD_SPACING +
          origin[2];


        return {
          minX: alignedMinX,
          maxX: alignedMaxX,
          minZ: alignedMinZ,
          maxZ: alignedMaxZ,
        };

      },
      [
        parcels,
        origin,
      ]
    );


  /**
   * =======================================================
   * ROAD POSITIONS
   * =======================================================
   */

  const majorRoadsX =
    useMemo(
      () =>
        buildRoadPositions(
          bounds.minX,
          bounds.maxX,
          MAJOR_ROAD_SPACING
        ),
      [
        bounds.minX,
        bounds.maxX,
      ]
    );


  const majorRoadsZ =
    useMemo(
      () =>
        buildRoadPositions(
          bounds.minZ,
          bounds.maxZ,
          MAJOR_ROAD_SPACING
        ),
      [
        bounds.minZ,
        bounds.maxZ,
      ]
    );


  const secondaryRoadsX =
    useMemo(
      () =>
        buildRoadPositions(
          bounds.minX,
          bounds.maxX,
          SECONDARY_ROAD_SPACING
        ).filter(
          position =>
            !isMajorRoad(
              position,
              MAJOR_ROAD_SPACING
            )
        ),
      [
        bounds.minX,
        bounds.maxX,
      ]
    );


  const secondaryRoadsZ =
    useMemo(
      () =>
        buildRoadPositions(
          bounds.minZ,
          bounds.maxZ,
          SECONDARY_ROAD_SPACING
        ).filter(
          position =>
            !isMajorRoad(
              position,
              MAJOR_ROAD_SPACING
            )
        ),
      [
        bounds.minZ,
        bounds.maxZ,
      ]
    );


  /**
   * =======================================================
   * DISTRICT POSITIONS
   * =======================================================
   *
   * Districts are represented visually by subtle large
   * translucent zones rather than changing parcel data.
   */

  const districtCenters =
    useMemo(
      () =>
        buildDistrictCenters(
          bounds.minX,
          bounds.maxX,
          bounds.minZ,
          bounds.maxZ
        ),
      [
        bounds,
      ]
    );


  const worldWidth =
    Math.max(
      1,
      bounds.maxX -
      bounds.minX
    );


  const worldDepth =
    Math.max(
      1,
      bounds.maxZ -
      bounds.minZ
    );
  /**
   * =======================================================
   * VISIBILITY
   * =======================================================
   *
   * This check must happen after all hooks so React sees
   * the same hook order on every render.
   */

  if (
    !visible ||
    parcels.length === 0
  ) {
    return null;
  }


  /**
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <group
      name="world-infrastructure"
    >

      {/* =================================================
          LARGE EMPTY-WORLD BASE
          ================================================= */}

      <mesh
        name="world-base"
        position={[
          (
            bounds.minX +
            bounds.maxX
          ) / 2,

          -0.08,

          (
            bounds.minZ +
            bounds.maxZ
          ) / 2,
        ]}
        receiveShadow
      >

        <boxGeometry
          args={[
            worldWidth,
            0.08,
            worldDepth,
          ]}
        />

        <meshStandardMaterial
          color="#172019"
          roughness={1}
        />

      </mesh>


      {/* =================================================
          DISTRICT AREAS
          ================================================= */}

      {districtCenters.map(
        (district) => (

          <mesh
            key={
              district.key
            }

            name={
              `district-${district.key}`
            }

            position={[
              district.x,
              -0.01,
              district.z,
            ]}
          >

            <planeGeometry
              args={[
                DISTRICT_SIZE -
                  10,

                DISTRICT_SIZE -
                  10,
              ]}
            />

            <meshBasicMaterial
              color={
                district.color
              }

              transparent

              opacity={0.035}

              depthWrite={false}
            />

          </mesh>

        )
      )}


      {/* =================================================
          MAJOR ROADS — X DIRECTION
          ================================================= */}

      {majorRoadsX.map(
        (x) => (

          <mesh
            key={
              `major-x-${x}`
            }

            name={
              `major-road-x-${x}`
            }

            position={[
              x,
              ROAD_HEIGHT,
              (
                bounds.minZ +
                bounds.maxZ
              ) / 2,
            ]}
          >

            <boxGeometry
              args={[
                MAJOR_ROAD_WIDTH,
                0.04,
                worldDepth,
              ]}
            />

            <meshStandardMaterial
              color="#25282b"
              roughness={0.92}
            />

          </mesh>

        )
      )}


      {/* =================================================
          MAJOR ROADS — Z DIRECTION
          ================================================= */}

      {majorRoadsZ.map(
        (z) => (

          <mesh
            key={
              `major-z-${z}`
            }

            name={
              `major-road-z-${z}`
            }

            position={[
              (
                bounds.minX +
                bounds.maxX
              ) / 2,

              ROAD_HEIGHT,

              z,
            ]}
          >

            <boxGeometry
              args={[
                worldWidth,
                0.04,
                MAJOR_ROAD_WIDTH,
              ]}
            />

            <meshStandardMaterial
              color="#25282b"
              roughness={0.92}
            />

          </mesh>

        )
      )}


      {/* =================================================
          SECONDARY ROADS — X DIRECTION
          ================================================= */}

      {secondaryRoadsX.map(
        (x) => (

          <mesh
            key={
              `secondary-x-${x}`
            }

            name={
              `secondary-road-x-${x}`
            }

            position={[
              x,
              ROAD_HEIGHT + 0.002,
              (
                bounds.minZ +
                bounds.maxZ
              ) / 2,
            ]}
          >

            <boxGeometry
              args={[
                SECONDARY_ROAD_WIDTH,
                0.025,
                worldDepth,
              ]}
            />

            <meshStandardMaterial
              color="#303437"
              roughness={0.95}
            />

          </mesh>

        )
      )}


      {/* =================================================
          SECONDARY ROADS — Z DIRECTION
          ================================================= */}

      {secondaryRoadsZ.map(
        (z) => (

          <mesh
            key={
              `secondary-z-${z}`
            }

            name={
              `secondary-road-z-${z}`
            }

            position={[
              (
                bounds.minX +
                bounds.maxX
              ) / 2,

              ROAD_HEIGHT + 0.002,

              z,
            ]}
          >

            <boxGeometry
              args={[
                worldWidth,
                0.025,
                SECONDARY_ROAD_WIDTH,
              ]}
            />

            <meshStandardMaterial
              color="#303437"
              roughness={0.95}
            />

          </mesh>

        )
      )}


      {/* =================================================
          ROAD CENTER LIGHTING
          ================================================= */}

      {majorRoadsX.map(
        (x) => (

          <mesh
            key={
              `road-line-x-${x}`
            }

            position={[
              x,
              ROAD_HEIGHT + 0.025,
              (
                bounds.minZ +
                bounds.maxZ
              ) / 2,
            ]}
          >

            <boxGeometry
              args={[
                0.18,
                0.008,
                worldDepth,
              ]}
            />

            <meshBasicMaterial
              color="#6b6f72"
              transparent
              opacity={0.3}
            />

          </mesh>

        )
      )}


      {majorRoadsZ.map(
        (z) => (

          <mesh
            key={
              `road-line-z-${z}`
            }

            position={[
              (
                bounds.minX +
                bounds.maxX
              ) / 2,

              ROAD_HEIGHT + 0.025,

              z,
            ]}
          >

            <boxGeometry
              args={[
                worldWidth,
                0.008,
                0.18,
              ]}
            />

            <meshBasicMaterial
              color="#6b6f72"
              transparent
              opacity={0.3}
            />

          </mesh>

        )
      )}


      {/* =================================================
          INTERSECTION PLAZAS
          ================================================= */}

      {majorRoadsX.flatMap(
        (x) =>
          majorRoadsZ.map(
            (z) => (

              <mesh
                key={
                  `intersection-${x}-${z}`
                }

                position={[
                  x,
                  ROAD_HEIGHT + 0.015,
                  z,
                ]}
              >

                <cylinderGeometry
                  args={[
                    10,
                    10,
                    0.03,
                    32,
                  ]}
                />

                <meshStandardMaterial
                  color="#34383b"
                  roughness={0.9}
                />

              </mesh>

            )
          )
      )}


      {/* =================================================
          DISTRICT BOUNDARY LINES
          ================================================= */}

      <DistrictBoundaries
        bounds={
          bounds
        }
      />


      {/* =================================================
          SUBTLE WORLD GRID
          ================================================= */}

      <gridHelper
        args={[
          Math.max(
            worldWidth,
            worldDepth
          ),
          Math.max(
            1,
            Math.round(
              Math.max(
                worldWidth,
                worldDepth
              ) /
              tileSize
            )
          ),
          "#344238",
          "#1f2b22",
        ]}

        position={[
          (
            bounds.minX +
            bounds.maxX
          ) / 2,

          -0.005,

          (
            bounds.minZ +
            bounds.maxZ
          ) / 2,
        ]}

        rotation={[
          0,
          0,
          0,
        ]}
      />

    </group>
  );
}


/**
 * =========================================================
 * ROAD HELPERS
 * =========================================================
 */

function buildRoadPositions(
  min: number,
  max: number,
  spacing: number
): number[] {

  const positions: number[] = [];

  const start =
    Math.floor(
      min / spacing
    ) *
    spacing;


  for (
    let position = start;
    position <= max;
    position += spacing
  ) {

    positions.push(
      position
    );

  }


  return positions;
}


function isMajorRoad(
  position: number,
  spacing: number
): boolean {

  return (
    Math.abs(
      position %
      spacing
    ) <
    0.001
  );
}


/**
 * =========================================================
 * DISTRICTS
 * =========================================================
 */

function buildDistrictCenters(
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number
): Array<{
  key: string;
  x: number;
  z: number;
  color: string;
}> {

  const districts: Array<{
    key: string;
    x: number;
    z: number;
    color: string;
  }> = [];


  const colors = [
    "#4b3f72",
    "#315c72",
    "#466b52",
    "#735044",
    "#5d5075",
    "#3e625f",
  ];


  const startX =
    Math.floor(
      minX /
      DISTRICT_SIZE
    ) *
    DISTRICT_SIZE;


  const startZ =
    Math.floor(
      minZ /
      DISTRICT_SIZE
    ) *
    DISTRICT_SIZE;


  let colorIndex = 0;


  for (
    let x = startX;
    x <= maxX;
    x += DISTRICT_SIZE
  ) {

    for (
      let z = startZ;
      z <= maxZ;
      z += DISTRICT_SIZE
    ) {

      districts.push({
        key:
          `${x}:${z}`,

        x:
          x +
          DISTRICT_SIZE / 2,

        z:
          z +
          DISTRICT_SIZE / 2,

        color:
          colors[
            colorIndex %
            colors.length
          ],
      });


      colorIndex++;

    }

  }


  return districts;
}


/**
 * =========================================================
 * DISTRICT BOUNDARIES
 * =========================================================
 */

function DistrictBoundaries({
  bounds,
}: {
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
}) {

  const lines =
    useMemo(
      () => {

        const result: Array<{
          key: string;
          x?: number;
          z?: number;
          width: number;
          depth: number;
        }> = [];


        const startX =
          Math.floor(
            bounds.minX /
            DISTRICT_SIZE
          ) *
          DISTRICT_SIZE;


        const startZ =
          Math.floor(
            bounds.minZ /
            DISTRICT_SIZE
          ) *
          DISTRICT_SIZE;


        for (
          let x = startX;
          x <= bounds.maxX;
          x += DISTRICT_SIZE
        ) {

          result.push({
            key:
              `vertical-${x}`,

            x,

            width:
              0.35,

            depth:
              bounds.maxZ -
              bounds.minZ,
          });

        }


        for (
          let z = startZ;
          z <= bounds.maxZ;
          z += DISTRICT_SIZE
        ) {

          result.push({
            key:
              `horizontal-${z}`,

            z,

            width:
              bounds.maxX -
              bounds.minX,

            depth:
              0.35,
          });

        }


        return result;

      },
      [
        bounds,
      ]
    );


  return (
    <group
      name="district-boundaries"
    >

      {lines.map(
        (line) => (

          <mesh
            key={
              line.key
            }

            position={[
              line.x ??
                (
                  bounds.minX +
                  bounds.maxX
                ) / 2,

              0.055,

              line.z ??
                (
                  bounds.minZ +
                  bounds.maxZ
                ) / 2,
            ]}
          >

            <boxGeometry
              args={[
                line.width,
                0.015,
                line.depth,
              ]}
            />

            <meshBasicMaterial
              color="#65706a"
              transparent
              opacity={0.25}
            />

          </mesh>

        )
      )}

    </group>
  );
}
