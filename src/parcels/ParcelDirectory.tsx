import {
  Button,
} from "cyengine";

import {
  useMemo,
  useState,
} from "react";

import {
  Text,
} from "@react-three/drei";

import type {
  Parcel,
  ParcelActionType,
} from "./types";


/**
 * =========================================================
 * PARCEL DIRECTORY PROPS
 * =========================================================
 */

interface ParcelDirectoryProps {

  /**
   * Parcels displayed by the directory.
   */

  parcels?: Parcel[];


  /**
   * Currently selected parcel.
   */

  selectedParcelId?: string | null;


  /**
   * Called when a parcel is selected.
   */

  onSelect?: (
    parcel: Parcel
  ) => void;


  /**
   * Marketplace actions.
   */

  onBuy?: (
    parcel: Parcel
  ) => void | Promise<void>;

  onReserve?: (
    parcel: Parcel
  ) => void | Promise<void>;

  onList?: (
    parcel: Parcel
  ) => void | Promise<void>;


  /**
   * Directory visibility.
   */

  visible?: boolean;


  /**
   * 3D position.
   */

  position?: [
    number,
    number,
    number
  ];


  /**
   * 3D rotation.
   */

  rotation?: [
    number,
    number,
    number
  ];


  /**
   * 3D scale.
   */

  scale?: number;


  /**
   * Marketplace action currently running.
   */

  actionParcelId?: string | null;

  actionType?: ParcelActionType | null;

  actionError?: string | null;
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
 * STATUS LABEL
 * =========================================================
 */

function getStatusLabel(
  status: Parcel["status"]
): string {

  switch (status) {

    case "available":
      return "AVAILABLE";

    case "owned":
      return "OWNED";

    case "reserved":
      return "RESERVED";

    case "for_sale":
      return "FOR SALE";

    default:
      return "UNKNOWN";
  }
}


/**
 * =========================================================
 * PARCEL ROW
 * =========================================================
 */

function ParcelRow({
  parcel,
  selected,
  onSelect,
  onBuy,
  onReserve,
  onList,
  index,
  actionParcelId,
  actionType,
}: {
  parcel: Parcel;

  selected: boolean;

  onSelect: (
    parcel: Parcel
  ) => void;

  onBuy?: (
    parcel: Parcel
  ) => void | Promise<void>;

  onReserve?: (
    parcel: Parcel
  ) => void | Promise<void>;

  onList?: (
    parcel: Parcel
  ) => void | Promise<void>;

  index: number;

  actionParcelId?: string | null;

  actionType?: ParcelActionType | null;
}) {

  const statusColor =
    getStatusColor(
      parcel.status
    );

  const statusLabel =
    getStatusLabel(
      parcel.status
    );

  const actionRunning =
    actionParcelId ===
      parcel.id &&
    actionType !== null &&
    actionType !== undefined;


  /**
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <group
      position={[
        0,
        -index * 0.72,
        0,
      ]}
    >

      {/* =========================================
          PARCEL NAME
          ========================================= */}

      <Text
        position={[
          -1.05,
          0.17,
          0,
        ]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="left"
        anchorY="middle"
        maxWidth={1.15}
      >
        {parcel.name ||
          parcel.estateId ||
          `Parcel ${parcel.id}`}
      </Text>


      {/* =========================================
          COORDINATES
          ========================================= */}

      <Text
        position={[
          -1.05,
          -0.04,
          0,
        ]}
        fontSize={0.07}
        color="#94a3b8"
        anchorX="left"
        anchorY="middle"
      >
        {`X ${parcel.x}  Y ${parcel.y}`}
      </Text>


      {/* =========================================
          PRICE
          ========================================= */}

      {parcel.price !== null &&
        parcel.price !== undefined && (

          <Text
            position={[
              -0.15,
              0.10,
              0,
            ]}
            fontSize={0.075}
            color="#f8fafc"
            anchorX="center"
            anchorY="middle"
          >
            {`${parcel.price.toLocaleString()} CV`}
          </Text>

        )}


      {/* =========================================
          STATUS
          ========================================= */}

      <Text
        position={[
          0.30,
          -0.08,
          0,
        ]}
        fontSize={0.065}
        color={statusColor}
        anchorX="center"
        anchorY="middle"
      >
        {statusLabel}
      </Text>


      {/* =========================================
          VIEW
          ========================================= */}

      <Button
        position={[
          0.86,
          0.14,
          0,
        ]}
        fontSize={0.065}
        onClick={() =>
          onSelect(parcel)
        }
      >
        {selected
          ? "SELECTED"
          : "VIEW"}
      </Button>


      {/* =========================================
          BUY
          ========================================= */}

      {parcel.status ===
        "for_sale" &&
        onBuy && (

          <Button
            position={[
              0.86,
              -0.15,
              0,
            ]}
            fontSize={0.06}
            onClick={() =>
              onBuy(parcel)
            }
          >
            {actionRunning &&
            actionType === "buy"
              ? "BUYING..."
              : "BUY"}
          </Button>

        )}


      {/* =========================================
          RESERVE
          ========================================= */}

      {parcel.status ===
        "available" &&
        onReserve && (

          <Button
            position={[
              0.86,
              -0.15,
              0,
            ]}
            fontSize={0.06}
            onClick={() =>
              onReserve(parcel)
            }
          >
            {actionRunning &&
            actionType === "reserve"
              ? "RESERVING..."
              : "RESERVE"}
          </Button>

        )}


      {/* =========================================
          LIST
          ========================================= */}

      {parcel.status ===
        "owned" &&
        onList && (

          <Button
            position={[
              0.86,
              -0.15,
              0,
            ]}
            fontSize={0.06}
            onClick={() =>
              onList(parcel)
            }
          >
            {actionRunning &&
            actionType === "list"
              ? "LISTING..."
              : "LIST"}
          </Button>

        )}

    </group>
  );
}


/**
 * =========================================================
 * PARCEL DIRECTORY
 * =========================================================
 */

export default function ParcelDirectory({
  parcels = [],

  selectedParcelId = null,

  onSelect,

  onBuy,

  onReserve,

  onList,

  visible = true,

  position = [
    0,
    2,
    -2,
  ],

  rotation = [
    0,
    0,
    0,
  ],

  scale = 1,

  actionParcelId,

  actionType,

  actionError,

}: ParcelDirectoryProps) {

  /**
   * =======================================================
   * FILTER
   * =======================================================
   */

  const [
    filter,
    setFilter,
  ] = useState<
    "all" | Parcel["status"]
  >("all");


  /**
   * =======================================================
   * FILTERED PARCELS
   * =======================================================
   */

  const filteredParcels =
    useMemo(
      () => {

        if (
          filter === "all"
        ) {
          return parcels;
        }

        return parcels.filter(
          (parcel) =>
            parcel.status ===
            filter
        );

      },
      [
        parcels,
        filter,
      ]
    );


  /**
   * =======================================================
   * SELECT
   * =======================================================
 */

  const handleSelect = (
    parcel: Parcel
  ) => {

    onSelect?.(
      parcel
    );
  };


  /**
   * =======================================================
   * HIDDEN
   * =======================================================
 */

  if (!visible) {
    return null;
  }


  /**
   * =======================================================
   * RENDER
   * =======================================================
 */

  return (
    <group
      position={position}
      rotation={rotation}
      scale={scale}
    >

      {/* ===================================================
          TITLE
          =================================================== */}

      <Text
        position={[
          0,
          0.45,
          0,
        ]}
        fontSize={0.20}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        LAND DIRECTORY
      </Text>


      {/* ===================================================
          SUBTITLE
          =================================================== */}

      <Text
        position={[
          0,
          0.22,
          0,
        ]}
        fontSize={0.08}
        color="#94a3b8"
        anchorX="center"
        anchorY="middle"
      >
        Browse parcels in CypherVerse
      </Text>


      {/* ===================================================
          FILTER BUTTONS
          =================================================== */}

      <group
        position={[
          0,
          0,
          0,
        ]}
      >

        <Button
          position={[
            -0.72,
            0,
            0,
          ]}
          fontSize={0.06}
          onClick={() =>
            setFilter("all")
          }
        >
          ALL
        </Button>


        <Button
          position={[
            -0.28,
            0,
            0,
          ]}
          fontSize={0.06}
          onClick={() =>
            setFilter(
              "available"
            )
          }
        >
          AVAILABLE
        </Button>


        <Button
          position={[
            0.22,
            0,
            0,
          ]}
          fontSize={0.06}
          onClick={() =>
            setFilter(
              "for_sale"
            )
          }
        >
          FOR SALE
        </Button>


        <Button
          position={[
            0.68,
            0,
            0,
          ]}
          fontSize={0.06}
          onClick={() =>
            setFilter(
              "owned"
            )
          }
        >
          OWNED
        </Button>

      </group>


      {/* ===================================================
          ACTION ERROR
          =================================================== */}

      {actionError && (

        <Text
          position={[
            0,
            -0.30,
            0,
          ]}
          fontSize={0.065}
          color="#ff6b6b"
          maxWidth={2.8}
          anchorX="center"
          anchorY="middle"
        >
          {actionError}
        </Text>

      )}


      {/* ===================================================
          EMPTY STATE
          =================================================== */}

      {filteredParcels.length ===
        0 && (

        <Text
          position={[
            0,
            -0.55,
            0,
          ]}
          fontSize={0.10}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
        >
          No parcels found.
        </Text>

      )}


      {/* ===================================================
          PARCEL LIST
          =================================================== */}

      <group
        position={[
          0,
          -0.55,
          0,
        ]}
      >

        {filteredParcels
          .slice(0, 8)
          .map(
            (
              parcel,
              index
            ) => (

              <ParcelRow
                key={
                  parcel.id
                }

                parcel={
                  parcel
                }

                index={
                  index
                }

                selected={
                  selectedParcelId ===
                  parcel.id
                }

                onSelect={
                  handleSelect
                }

                onBuy={
                  onBuy
                }

                onReserve={
                  onReserve
                }

                onList={
                  onList
                }

                actionParcelId={
                  actionParcelId
                }

                actionType={
                  actionType
                }
              />

            )
          )}

      </group>


      {/* ===================================================
          COUNT
          =================================================== */}

      <Text
        position={[
          0,
          -6.15,
          0,
        ]}
        fontSize={0.07}
        color="#64748b"
        anchorX="center"
        anchorY="middle"
      >
        {`${filteredParcels.length} parcels`}
      </Text>

    </group>
  );
}