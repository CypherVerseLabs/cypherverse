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
 * Database coordinates are already world coordinates:
 *
 *   parcel.x -> world X
 *   parcel.y -> world Z
 *
 * A parcel is therefore NOT multiplied by parcelSize.
 *
 * Example:
 *
 *   x = 512
 *   y = 256
 *
 * becomes:
 *
 *   [512, height, 256]
 *
 * =========================================================
 */

export interface ParcelGridProps {
  parcels: Parcel[];

  /**
   * Physical size of one parcel in world units.
   *
   * Your current world uses 16 x 16 parcels.
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
   */
  selectedParcelId?: string | null;
}

export default function ParcelGrid({
  parcels,
  parcelSize = 16,
  height = 0,
  onParcelClick,
  selectedParcelId = null,
}: ParcelGridProps) {
  return (
    <group
      name="parcel-grid"
      position={[
        0,
        0,
        0,
      ]}
    >
      {parcels.map(
        (parcel) => (
          <ParcelTile
            key={parcel.id}
            parcel={parcel}
            parcelSize={parcelSize}
            height={height}
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
 */

interface ParcelTileProps {
  parcel: Parcel;

  parcelSize: number;

  height: number;

  selected: boolean;

  onClick?: (
    parcel: Parcel
  ) => void;
}


function ParcelTile({
  parcel,
  parcelSize,
  height,
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
   * =======================================================
   * WORLD POSITION
   * =======================================================
   *
   * IMPORTANT:
   *
   * Your database already stores coordinates in world units.
   *
   * Therefore:
   *
   *   parcel.x -> X
   *   parcel.y -> Z
   *
   * Do NOT do:
   *
   *   parcel.x * parcelSize
   *
   * because that would turn:
   *
   *   512
   *
   * into:
   *
   *   8192
   *
   * =======================================================
   */

  const position: [
    number,
    number,
    number
  ] = [
    parcel.x,
    parcel.top ?? height,
    parcel.y,
  ];


  /**
   * =======================================================
   * SURFACE
   * =======================================================
   *
   * A 16 x 16 parcel gets a small visual gap.
   *
   * This makes individual parcels readable without making
   * the world look like a giant spreadsheet.
   */

  const surfaceSize =
    parcelSize * 0.96;


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

        onClick?.(
          parcel
        );

      }}
    >

      {/* =================================================
          PARCEL SURFACE
          ================================================= */}

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


      {/* =================================================
          SELECTION BORDER
          ================================================= */}

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


      {/* =================================================
          PARCEL NAME
          ================================================= */}

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