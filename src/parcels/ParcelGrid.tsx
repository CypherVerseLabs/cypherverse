import Words from "ideas/inputs/Text";

import type {
  Parcel,
} from "./types";

/**
 * =========================================================
 * PARCEL GRID
 * =========================================================
 *
 * Presentation component for rendering a collection of
 * parcels in the 3D world.
 *
 * ParcelGrid does NOT:
 *
 * - fetch parcel data
 * - modify parcel state
 * - reserve parcels
 * - purchase parcels
 * - manage the selected parcel
 *
 * Those responsibilities belong to ParcelLayer and the
 * parcel API/system.
 *
 * Coordinate system:
 *
 *   parcel.x -> world X
 *   parcel.y -> world Z
 *
 * Example:
 *
 *   parcel = {
 *     x: 10,
 *     y: 4
 *   }
 *
 * becomes:
 *
 *   [10 * tileSize, height, 4 * tileSize]
 *
 * =========================================================
 */

export interface ParcelGridProps {
  parcels: Parcel[];

  /**
   * Physical size of one parcel in world units.
   */
  parcelSize?: number;

  /**
   * Vertical position of the parcel grid.
   */
  height?: number;

  /**
   * Called when a parcel is clicked.
   */
  onParcelClick?: (
    parcel: Parcel
  ) => void;

  /**
   * Optional selected parcel.
   *
   * This allows ParcelLayer to visually highlight
   * the parcel selected from either the 3D world or
   * the map.
   */
  selectedParcelId?: string | null;
}

export default function ParcelGrid({
  parcels,
  parcelSize = 2,
  height = 0,
  onParcelClick,
  selectedParcelId = null,
}: ParcelGridProps) {
  return (
    <group
      name="parcel-grid"
      position={[
        0,
        height,
        0,
      ]}
    >
      {parcels.map(
        (parcel) => (
          <ParcelTile
            key={parcel.id}
            parcel={parcel}
            parcelSize={parcelSize}
            selected={
              parcel.id ===
              selectedParcelId
            }
            onClick={
              onParcelClick
            }
          />
        )
      )}
    </group>
  );
}

/**
 * =========================================================
 * PARCEL TILE
 * =========================================================
 *
 * Kept in this file for now.
 *
 * We can move this into ParcelTile.tsx once the basic
 * parcel system is wired up.
 * =========================================================
 */

interface ParcelTileProps {
  parcel: Parcel;

  parcelSize: number;

  selected: boolean;

  onClick?: (
    parcel: Parcel
  ) => void;
}

function ParcelTile({
  parcel,
  parcelSize,
  selected,
  onClick,
}: ParcelTileProps) {
  /**
   * Parcel color is based on marketplace status.
   *
   * An explicit API color overrides the default.
   */
  const color =
    parcel.color ??
    getParcelStatusColor(
      parcel.status
    );

  /**
   * Convert parcel coordinates into 3D coordinates.
   *
   * Database:
   *
   *   x
   *   y
   *
   * World:
   *
   *   X
   *   Y
   *   Z
   */
  const position: [
    number,
    number,
    number
  ] = [
    parcel.x * parcelSize,
    parcel.top ?? 0,
    parcel.y * parcelSize,
  ];

  /**
   * Keep a small gap between neighboring parcels.
   */
  const surfaceSize =
    parcelSize * 0.95;

  /**
   * Selected parcels get a brighter surface.
   */
  const opacity =
    selected
      ? 1
      : 0.85;

  return (
    <group
      name={`parcel-${parcel.id}`}
      position={position}
      onClick={(event) => {
        event.stopPropagation();

        onClick?.(parcel);
      }}
    >
      {/* ===================================================
          PARCEL SURFACE
          =================================================== */}

      <mesh
        receiveShadow
        castShadow={false}
      >
        <boxGeometry
          args={[
            surfaceSize,
            0.05,
            surfaceSize,
          ]}
        />

        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          emissive={
            selected
              ? color
              : "#000000"
          }
          emissiveIntensity={
            selected
              ? 0.35
              : 0
          }
        />
      </mesh>

      {/* ===================================================
          SELECTION BORDER
          =================================================== */}

      {selected && (
        <mesh
          position={[
            0,
            0.035,
            0,
          ]}
        >
          <boxGeometry
            args={[
              surfaceSize * 1.02,
              0.015,
              surfaceSize * 1.02,
            ]}
          />

          <meshBasicMaterial
            color="#ffffff"
            wireframe
            transparent
            opacity={0.9}
          />
        </mesh>
      )}

      {/* ===================================================
          PARCEL NAME
          =================================================== */}

      {parcel.name && (
        <Words
          position={[
            0,
            0.15,
            0,
          ]}
          color="#ffffff"
        >
          {parcel.name}
        </Words>
      )}
    </group>
  );
}

/**
 * =========================================================
 * STATUS COLORS
 * =========================================================
 */

function getParcelStatusColor(
  status: Parcel["status"]
): string {
  switch (status) {
    case "available":
      return "#555555";

    case "owned":
      return "#4f8cff";

    case "reserved":
      return "#ffaa00";

    case "for_sale":
      return "#00ff88";

    default:
      return "#555555";
  }
}