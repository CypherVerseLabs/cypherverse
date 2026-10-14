import { useMemo } from "react";

import { Text } from "@react-three/drei";

import * as THREE from "three";

import {
  CYPHERVERSE_MAP,
  type WorldArea,
  type WorldRoad,
  type WorldPoint,
} from "./CypherVerseMap";

/**
 * =========================================================
 * WORLD COORDINATE SYSTEM
 * =========================================================
 *
 * Database/world coordinates:
 *
 *     0 ... 4800
 *
 * Genesis:
 *
 *     2400, 2400
 *
 * Three.js:
 *
 *     Genesis = 0, 0
 *
 * Therefore:
 *
 *     centered = world coordinate - 2400
 * =========================================================
 */

const WORLD_CENTER = 2400;

const ROAD_SURFACE_Y = 0.04;

const AREA_SURFACE_Y = 0.015;

const AREA_HEIGHT = 0.025;

const ROAD_COLOR = "#252b35";

const ROAD_EDGE_COLOR = "#475569";

const PLAZA_COLOR = "#64748b";

const PARK_COLOR = "#315c43";

const DISTRICT_COLOR = "#1e293b";

const GENESIS_COLOR = "#d4a72c";

function centerPoint(
  point: WorldPoint,
): WorldPoint {
  return {
    x:
      point.x -
      WORLD_CENTER,

    z:
      point.z -
      WORLD_CENTER,
  };
}

/**
 * =========================================================
 * ROAD SEGMENT
 * =========================================================
 */

function RoadSegment({
  from,
  to,
  width,
}: {
  from: WorldPoint;
  to: WorldPoint;
  width: number;
}) {
  const geometry = useMemo(() => {
    const dx =
      to.x -
      from.x;

    const dz =
      to.z -
      from.z;

    const length =
      Math.hypot(
        dx,
        dz,
      );

    if (length <= 0) {
      return null;
    }

    return {
      length,

      angle:
        Math.atan2(
          dz,
          dx,
        ),

      centerX:
        (from.x +
          to.x) /
        2,

      centerZ:
        (from.z +
          to.z) /
        2,
    };
  }, [from, to]);

  if (!geometry) {
    return null;
  }

  return (
    <group
      position={[
        geometry.centerX,
        ROAD_SURFACE_Y,
        geometry.centerZ,
      ]}
      rotation={[
        0,
        -geometry.angle,
        0,
      ]}
    >
      <mesh>
        <boxGeometry
          args={[
            geometry.length,
            0.05,
            width,
          ]}
        />

        <meshStandardMaterial
          color={ROAD_COLOR}
          roughness={0.95}
        />
      </mesh>

      <mesh
        position={[
          0,
          0.009,
          width / 2,
        ]}
      >
        <boxGeometry
          args={[
            geometry.length,
            0.012,
            0.12,
          ]}
        />

        <meshStandardMaterial
          color={ROAD_EDGE_COLOR}
        />
      </mesh>

      <mesh
        position={[
          0,
          0.009,
          -width / 2,
        ]}
      >
        <boxGeometry
          args={[
            geometry.length,
            0.012,
            0.12,
          ]}
        />

        <meshStandardMaterial
          color={ROAD_EDGE_COLOR}
        />
      </mesh>
    </group>
  );
}

/**
 * =========================================================
 * ROAD
 * =========================================================
 */

function Road({
  road,
}: {
  road: WorldRoad;
}) {
  const points = useMemo(
    () =>
      road.points.map(
        centerPoint,
      ),
    [road.points],
  );

  if (points.length < 2) {
    return null;
  }

  const labelPoint =
    points[
      Math.floor(
        points.length / 2,
      )
    ];

  return (
    <group
      name={`road-${road.id}`}
    >
      {points
        .slice(0, -1)
        .map(
          (
            point,
            index,
          ) => (
            <RoadSegment
              key={`${road.id}-${index}`}
              from={point}
              to={
                points[
                  index + 1
                ]
              }
              width={
                road.width
              }
            />
          ),
        )}

      {road.name && (
        <Text
          position={[
            labelPoint.x,
            road.kind ===
            "PRIMARY"
              ? 2.5
              : 1.8,
            labelPoint.z,
          ]}
          fontSize={
            road.kind ===
            "PRIMARY"
              ? 3.2
              : 2.2
          }
          color="#e2e8f0"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.08}
          outlineColor="#0b1220"
          renderOrder={5}
          raycast={() => null}
        >
          {road.name}
        </Text>
      )}
    </group>
  );
}

/**
 * =========================================================
 * AREA
 * =========================================================
 */

function Area({
  area,
  showLabel,
}: {
  area: WorldArea;
  showLabel: boolean;
}) {
  const center =
    useMemo(
      () =>
        centerPoint(
          area.center,
        ),
      [area.center],
    );

  const isGenesis =
    area.id ===
    "genesis-core";

  const color =
    isGenesis
      ? GENESIS_COLOR
      : area.kind ===
          "PARK"
        ? PARK_COLOR
        : area.kind ===
            "PLAZA"
          ? PLAZA_COLOR
          : DISTRICT_COLOR;

  const opacity =
    area.kind ===
    "DISTRICT"
      ? 0.12
      : area.kind ===
          "PARK"
        ? 0.32
        : 0.38;

  return (
    <group
      name={`area-${area.id}`}
    >
      <mesh
        position={[
          center.x,
          AREA_SURFACE_Y,
          center.z,
        ]}
        renderOrder={1}
      >
        <boxGeometry
          args={[
            area.width,
            AREA_HEIGHT,
            area.depth,
          ]}
        />

        <meshStandardMaterial
          color={color}
          roughness={0.9}
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </mesh>

      {isGenesis && (
        <mesh
          position={[
            center.x,
            0.065,
            center.z,
          ]}
          rotation={[
            -Math.PI / 2,
            0,
            0,
          ]}
          renderOrder={2}
        >
          <ringGeometry
            args={[
              72,
              76,
              96,
            ]}
          />

          <meshStandardMaterial
            color="#f5d76e"
            emissive="#7a5b00"
            emissiveIntensity={0.5}
            side={
              THREE.DoubleSide
            }
            depthWrite={false}
          />
        </mesh>
      )}

      {showLabel && (
        <Text
          position={[
            center.x,
            isGenesis
              ? 4
              : area.kind ===
                  "DISTRICT"
                ? 3.2
                : 2.5,
            center.z,
          ]}
          fontSize={
            isGenesis
              ? 7
              : area.kind ===
                  "DISTRICT"
                ? 4
                : 3
          }
          color={
            isGenesis
              ? "#fff4bd"
              : "#ffffff"
          }
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.12}
          outlineColor="#000000"
          renderOrder={3}
          raycast={() => null}
        >
          {area.name}
        </Text>
      )}
    </group>
  );
}

/**
 * =========================================================
 * MAP LAYER
 * =========================================================
 */

export default function CypherVerseMapLayer({
  showLabels = true,
}: {
  showLabels?: boolean;
}) {
  return (
    <group
      name="cypherverse-map"
    >
      {CYPHERVERSE_MAP.areas.map(
        (area) => (
          <Area
            key={area.id}
            area={area}
            showLabel={
              showLabels
            }
          />
        ),
      )}

      {CYPHERVERSE_MAP.roads.map(
        (road) => (
          <Road
            key={road.id}
            road={road}
          />
        ),
      )}
    </group>
  );
}