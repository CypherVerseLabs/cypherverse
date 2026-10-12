import { useMemo } from "react";

import { Text } from "@react-three/drei";

import {
  CYPHERVERSE_MAP,
  type WorldArea,
  type WorldRoad,
  type WorldPoint,
} from "./CypherVerseMap";

/**
 * =========================================================
 * COLORS
 * =========================================================
 */

const ROAD_COLOR = "#252b35";
const ROAD_EDGE_COLOR = "#475569";

const PLAZA_COLOR = "#64748b";
const PARK_COLOR = "#315c43";
const DISTRICT_COLOR = "#1e293b";
const GENESIS_COLOR = "#d4a72c";

/**
 * =========================================================
 * RENDERING CONFIGURATION
 * =========================================================
 *
 * Roads and areas are visual overlays only.
 *
 * Y positions are deliberately kept above the ground plane
 * to reduce z-fighting between meshes.
 */

const ROAD_SURFACE_Y = 0.04;
const ROAD_EDGE_Y = 0.009;
const AREA_SURFACE_Y = 0.015;
const AREA_HEIGHT = 0.025;

const ROAD_EDGE_WIDTH = 0.12;
const ROAD_EDGE_HEIGHT = 0.012;

interface CypherVerseMapLayerProps {
  showLabels?: boolean;
}

/**
 * =========================================================
 * ROAD GEOMETRY
 * =========================================================
 *
 * Each segment uses a centered box.
 *
 * The box's local X axis follows the segment direction.
 * Its local Z axis represents road width.
 *
 * Segment ends are extended slightly so adjacent segments
 * do not show gaps at bends and intersections.
 *
 * These are visual meshes, not parcel reservations.
 */

interface RoadSegmentProps {
  from: WorldPoint;
  to: WorldPoint;
  width: number;
  isFirst: boolean;
  isLast: boolean;
}

function RoadSegment({
  from,
  to,
  width,
  isFirst,
  isLast,
}: RoadSegmentProps) {
  const geometry = useMemo(() => {
    const dx = to.x - from.x;
    const dz = to.z - from.z;

    const length = Math.hypot(dx, dz);

    if (length <= 0) {
      return null;
    }

    const angle = Math.atan2(dz, dx);

    const extension = width * 0.08;

    return {
      length:
        length +
        (isFirst ? extension / 2 : extension) +
        (isLast ? extension / 2 : extension),

      angle,

      centerX: (from.x + to.x) / 2,
      centerZ: (from.z + to.z) / 2,
    };
  }, [
    from.x,
    from.z,
    to.x,
    to.z,
    width,
    isFirst,
    isLast,
  ]);

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
      {/* Main road surface */}

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

      {/* Left road edge */}

      <mesh
        position={[
          0,
          ROAD_EDGE_Y,
          width / 2,
        ]}
      >
        <boxGeometry
          args={[
            geometry.length,
            ROAD_EDGE_HEIGHT,
            ROAD_EDGE_WIDTH,
          ]}
        />

        <meshStandardMaterial
          color={ROAD_EDGE_COLOR}
          roughness={0.9}
        />
      </mesh>

      {/* Right road edge */}

      <mesh
        position={[
          0,
          ROAD_EDGE_Y,
          -width / 2,
        ]}
      >
        <boxGeometry
          args={[
            geometry.length,
            ROAD_EDGE_HEIGHT,
            ROAD_EDGE_WIDTH,
          ]}
        />

        <meshStandardMaterial
          color={ROAD_EDGE_COLOR}
          roughness={0.9}
        />
      </mesh>
    </group>
  );
}

/**
 * =========================================================
 * ROAD
 * =========================================================
 *
 * Every consecutive pair of points creates a segment.
 *
 * Duplicate consecutive points are safely ignored by
 * RoadSegment.
 */

function Road({
  road,
}: {
  road: WorldRoad;
}) {
  if (road.points.length < 2) {
    return null;
  }

  return (
    <group name={`road-${road.id}`}>
      {road.points.slice(0, -1).map((point, index) => {
        const next = road.points[index + 1];

        return (
          <RoadSegment
            key={`${road.id}-${index}`}
            from={point}
            to={next}
            width={road.width}
            isFirst={index === 0}
            isLast={index === road.points.length - 2}
          />
        );
      })}
    </group>
  );
}

/**
 * =========================================================
 * AREA
 * =========================================================
 *
 * Districts are translucent visual overlays.
 *
 * They may overlap parks, plazas, and roads intentionally.
 * This does not mean that any underlying parcel is public,
 * reserved, or unavailable for sale.
 */

function Area({
  area,
  showLabel,
}: {
  area: WorldArea;
  showLabel: boolean;
}) {
  const isGenesis = area.id === "genesis-core";

  const color =
    isGenesis
      ? GENESIS_COLOR
      : area.kind === "PARK"
        ? PARK_COLOR
        : area.kind === "PLAZA"
          ? PLAZA_COLOR
          : DISTRICT_COLOR;

  const opacity =
    area.kind === "DISTRICT"
      ? 0.16
      : area.kind === "PARK"
        ? 0.38
        : 0.42;

  const labelFontSize = isGenesis
    ? 7
    : area.kind === "DISTRICT"
      ? 4
      : 3;

  return (
    <group name={`area-${area.id}`}>
      {/* Area footprint */}

      <mesh
        position={[
          area.center.x,
          AREA_SURFACE_Y,
          area.center.z,
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

      {/* Genesis decorative ring */}

      {isGenesis && (
        <mesh
          position={[
            area.center.x,
            0.065,
            area.center.z,
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
            side={2}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Area label */}

      {showLabel && (
        <Text
          position={[
            area.center.x,
            isGenesis ? 3 : 2.5,
            area.center.z,
          ]}
          fontSize={labelFontSize}
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
 *
 * Responsibilities:
 *
 * - Render map roads.
 * - Render public-area visualizations.
 * - Render optional labels.
 *
 * Non-responsibilities:
 *
 * - Creating or modifying parcels.
 * - Changing parcel coordinates.
 * - Reserving or selling land.
 * - Handling parcel selection.
 * - Executing marketplace actions.
 * - Loading Projects or published Scenes.
 *
 * ParcelLayer remains the authoritative interaction layer.
 * =========================================================
 */

export default function CypherVerseMapLayer({
  showLabels = true,
}: CypherVerseMapLayerProps) {
  return (
    <group name="cypherverse-map">
      {/* Areas render first so the road surfaces remain visible. */}

      {CYPHERVERSE_MAP.areas.map((area) => (
        <Area
          key={area.id}
          area={area}
          showLabel={showLabels}
        />
      ))}

      {/* Roads render above the area overlays. */}

      {CYPHERVERSE_MAP.roads.map((road) => (
        <Road
          key={road.id}
          road={road}
        />
      ))}
    </group>
  );
}

