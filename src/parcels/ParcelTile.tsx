import {
  Box,
  Edges,
  Text,
} from "@react-three/drei";

import type {
  Parcel,
} from "./types";

interface ParcelTileProps {
  parcel: Parcel;

  position: [
    number,
    number,
    number
  ];

  size: number;

  selected?: boolean;

  interactive?: boolean;

  onSelect?: (
    parcel: Parcel
  ) => void;
}

/**
 * =========================================================
 * PARCEL COLORS
 * =========================================================
 */

function getParcelColor(
  status: Parcel["status"]
): string {
  switch (status) {
    case "available":
      return "#28e07b";

    case "owned":
      return "#4d7cff";

    case "reserved":
      return "#ffc857";

    case "for_sale":
      return "#ff6b6b";

    default:
      return "#888888";
  }
}

/**
 * =========================================================
 * PARCEL TILE
 * =========================================================
 *
 * Presentation-only 3D parcel.
 *
 * ParcelTile does not fetch or mutate parcel data.
 * ParcelLayer owns the parcel-system behavior.
 */

export default function ParcelTile({
  parcel,
  position,
  size,
  selected = false,
  interactive = true,
  onSelect,
}: ParcelTileProps) {
  const color =
    parcel.color ||
    getParcelColor(
      parcel.status
    );

  const displayColor =
    selected
      ? "#ffffff"
      : color;

  const opacity =
    selected
      ? 0.8
      : 0.45;

  return (
    <group
      name={`parcel-${parcel.id}`}
      position={position}
      onClick={(event) => {
        if (!interactive) {
          return;
        }

        event.stopPropagation();

        onSelect?.(parcel);
      }}
    >
      {/* ===================================================
          PARCEL SURFACE
          =================================================== */}

      <Box
        args={[
          size,
          0.04,
          size,
        ]}
        position={[
          0,
          0.02,
          0,
        ]}
        receiveShadow
      >
        <meshStandardMaterial
          color={displayColor}
          transparent
          opacity={opacity}
        />
      </Box>

      {/* ===================================================
          PARCEL BORDER
          =================================================== */}

      <Box
        args={[
          size,
          0.04,
          size,
        ]}
        position={[
          0,
          0.05,
          0,
        ]}
      >
        <Edges
          color={displayColor}
        />
      </Box>

      {/* ===================================================
          PARCEL NAME
          =================================================== */}

      {parcel.name && (
        <Text
          position={[
            0,
            0.12,
            0,
          ]}
          rotation={[
            -Math.PI / 2,
            0,
            0,
          ]}
          fontSize={
            Math.min(
              size * 0.12,
              0.35
            )
          }
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          raycast={() => null}
        >
          {parcel.name}
        </Text>
      )}
    </group>
  );
}
