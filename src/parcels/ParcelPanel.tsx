import {
  Button,
} from "cyengine";

import {
  Text,
} from "@react-three/drei";

import type {
  Parcel,
  ParcelActionType,
} from "./types";


/**
 * =========================================================
 * PARCEL PANEL PROPS
 * =========================================================
 */

interface ParcelPanelProps {

  parcel:
    | Parcel
    | null;

  onClose?: () => void;

  onBuy?: (
    parcel: Parcel
  ) => void | Promise<void>;

  onReserve?: (
    parcel: Parcel
  ) => void | Promise<void>;

  onList?: (
    parcel: Parcel
  ) => void | Promise<void>;

  actionParcelId?:
    | string
    | null;

  actionType?:
    | ParcelActionType
    | null;

  actionError?:
    | string
    | null;
}


/**
 * =========================================================
 * PRICE FORMATTER
 * =========================================================
 */

function formatPrice(
  price?: number | null
): string {

  if (
    price === undefined ||
    price === null
  ) {
    return "Not listed";
  }

  return `${price.toLocaleString()} CV`;
}


/**
 * =========================================================
 * STATUS LABEL
 * =========================================================
 */

function formatStatus(
  status: Parcel["status"]
): string {

  switch (status) {

    case "available":
      return "Available";

    case "owned":
      return "Owned";

    case "reserved":
      return "Reserved";

    case "for_sale":
      return "For Sale";

    default:
      return status;
  }
}


/**
 * =========================================================
 * STATUS COLOR
 * =========================================================
 */

function getStatusColor(
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
 * ACTION LABEL
 * =========================================================
 */

function getActionLabel(
  actionType:
    | ParcelActionType
    | null
): string {

  switch (actionType) {

    case "buy":
      return "Buying...";

    case "reserve":
      return "Reserving...";

    case "list":
      return "Listing...";

    case "release":
      return "Releasing...";

    default:
      return "Processing...";
  }
}


/**
 * =========================================================
 * PARCEL PANEL
 * =========================================================
 */

export default function ParcelPanel({

  parcel,

  onClose,

  onBuy,

  onReserve,

  onList,

  actionParcelId,

  actionType,

  actionError,

}: ParcelPanelProps) {


  /**
   * =======================================================
   * NO SELECTION
   * =======================================================
   */

  if (!parcel) {
    return null;
  }


  /**
   * =======================================================
   * ACTION STATE
   * =======================================================
   */

  const isProcessing =
    actionParcelId ===
    parcel.id;


  /**
   * =======================================================
   * PANEL DIMENSIONS
   * =======================================================
   *
   * Smaller than the previous 3.6 × 4.8 panel.
   */

  const panelWidth = 2.8;

  const panelHeight = 3.65;


  /**
   * =======================================================
   * PANEL
   * =======================================================
   */

  return (
    <group
      name="parcel-panel"
      position={[
        0,
        1.25,
        -1.35,
      ]}
    >

      {/* ===================================================
          OUTER BORDER
          =================================================== */}

      <mesh
        position={[
          0,
          0,
          -0.05,
        ]}
      >

        <planeGeometry
          args={[
            panelWidth + 0.06,
            panelHeight + 0.06,
          ]}
        />

        <meshBasicMaterial
          color="#263247"
          transparent
          opacity={0.95}
        />

      </mesh>


      {/* ===================================================
          PANEL BACKGROUND
          =================================================== */}

      <mesh
        position={[
          0,
          0,
          -0.04,
        ]}
      >

        <planeGeometry
          args={[
            panelWidth,
            panelHeight,
          ]}
        />

        <meshBasicMaterial
          color="#0a0e18"
          transparent
          opacity={0.97}
        />

      </mesh>


      {/* ===================================================
          CLOSE
          =================================================== */}

      {onClose && (

        <Button
          position={[
            1.16,
            1.55,
            0,
          ]}
          fontSize={0.10}
          onClick={() => {

            if (
              !isProcessing
            ) {
              onClose();
            }

          }}
        >
          ×
        </Button>

      )}


      {/* ===================================================
          TITLE
          =================================================== */}

      <Text
        color="#ffffff"
        fontSize={0.18}
        maxWidth={2.25}
        position={[
          0,
          1.45,
          0,
        ]}
        anchorX="center"
        anchorY="middle"
      >
        {typeof parcel.name === "string" &&
        parcel.name.trim()
          ? parcel.name
          : `Parcel ${
              parcel.estateId ??
              parcel.id
            }`}
      </Text>


      {/* ===================================================
          ID
          =================================================== */}

      <InfoRow
        label="Parcel ID"
        value={
          parcel.id
        }
        position={[
          0,
          1.08,
          0,
        ]}
      />


      {/* ===================================================
          ESTATE
          =================================================== */}

      <InfoRow
        label="Estate"
        value={
          parcel.estateId ??
          "—"
        }
        position={[
          0,
          0.82,
          0,
        ]}
      />


      {/* ===================================================
          COORDINATES
          =================================================== */}

      <InfoRow
        label="Coordinates"
        value={
          `${parcel.x}, ${parcel.y}`
        }
        position={[
          0,
          0.56,
          0,
        ]}
      />


      {/* ===================================================
          STATUS
          =================================================== */}

      <Text
        color="#8d99ae"
        fontSize={0.10}
        position={[
          -0.98,
          0.29,
          0,
        ]}
        anchorX="left"
        anchorY="middle"
      >
        Status
      </Text>


      <Text
        color={
          getStatusColor(
            parcel.status
          )
        }
        fontSize={0.11}
        position={[
          0.98,
          0.29,
          0,
        ]}
        anchorX="right"
        anchorY="middle"
      >
        {formatStatus(
          parcel.status
        )}
      </Text>


      {/* ===================================================
          PRICE
          =================================================== */}

      <InfoRow
        label="Price"
        value={
          formatPrice(
            parcel.price
          )
        }
        position={[
          0,
          0.02,
          0,
        ]}
        strong
      />


      {/* ===================================================
          DESCRIPTION
          =================================================== */}

      {typeof parcel.description === "string" &&
      parcel.description.trim() && (

        <Text
          color="#b7c0d0"
          fontSize={0.09}
          maxWidth={2.25}
          position={[
            0,
            -0.32,
            0,
          ]}
          anchorX="center"
          anchorY="middle"
        >
          {parcel.description}
        </Text>

      )}


      {/* ===================================================
          ACTION ERROR
          =================================================== */}

      {!isProcessing &&
      typeof actionError === "string" &&
      actionError.trim() && (

        <Text
          color="#ff8d8d"
          fontSize={0.085}
          maxWidth={2.25}
          position={[
            0,
            -0.70,
            0,
          ]}
          anchorX="center"
          anchorY="middle"
        >
          {actionError}
        </Text>

      )}


      {/* ===================================================
          PROCESSING
          =================================================== */}

      {isProcessing && (

        <Text
          color="#9eb7ff"
          fontSize={0.10}
          maxWidth={2.25}
          position={[
            0,
            -0.70,
            0,
          ]}
          anchorX="center"
          anchorY="middle"
        >
          {getActionLabel(
            actionType ?? null
          )}
        </Text>

      )}


      {/* ===================================================
          AVAILABLE → RESERVE
          =================================================== */}

      {parcel.status ===
        "available" &&
      onReserve && (

        <Button
          position={[
            0,
            -1.13,
            0,
          ]}
          fontSize={0.075}
          onClick={() => {

            if (
              !isProcessing
            ) {
              void onReserve(
                parcel
              );
            }

          }}
        >
          {isProcessing &&
          actionType ===
            "reserve"
            ? "Reserving..."
            : "Reserve Parcel"}
        </Button>

      )}


      {/* ===================================================
          FOR SALE → BUY
          =================================================== */}

      {parcel.status ===
        "for_sale" &&
      onBuy && (

        <Button
          position={[
            0,
            -1.13,
            0,
          ]}
          fontSize={0.075}
          onClick={() => {

            if (
              !isProcessing
            ) {
              void onBuy(
                parcel
              );
            }

          }}
        >
          {isProcessing &&
          actionType ===
            "buy"
            ? "Buying..."
            : "Buy Parcel"}
        </Button>

      )}


      {/* ===================================================
          OWNED → LIST
          =================================================== */}

      {parcel.status ===
        "owned" &&
      onList && (

        <Button
          position={[
            0,
            -1.13,
            0,
          ]}
          fontSize={0.075}
          onClick={() => {

            if (
              !isProcessing
            ) {
              void onList(
                parcel
              );
            }

          }}
        >
          {isProcessing &&
          actionType ===
            "list"
            ? "Listing..."
            : "List for Sale"}
        </Button>

      )}

    </group>
  );
}


/**
 * =========================================================
 * INFO ROW
 * =========================================================
 */

function InfoRow({
  label,
  value,
  position,
  strong = false,
}: {
  label: string;

  value: string;

  position: [
    number,
    number,
    number
  ];

  strong?: boolean;
}) {

  return (
    <group
      position={
        position
      }
    >

      <Text
        color="#8d99ae"
        fontSize={0.10}
        position={[
          -0.98,
          0,
          0,
        ]}
        anchorX="left"
        anchorY="middle"
      >
        {label}
      </Text>


      <Text
        color="#ffffff"
        fontSize={
          strong
            ? 0.115
            : 0.10
        }
        maxWidth={1.45}
        position={[
          0.98,
          0,
          0,
        ]}
        anchorX="right"
        anchorY="middle"
      >
        {value}
      </Text>

    </group>
  );
}
