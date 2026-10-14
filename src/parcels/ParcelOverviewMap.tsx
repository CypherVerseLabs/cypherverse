import {
  useEffect,
  useRef,
} from "react";

import {
  Html,
} from "@react-three/drei";

import type {
  Parcel,
} from "./types";

import {
  CYPHERVERSE_MAP,
} from "../worlds/CypherVerseMap";


/**
 * =========================================================
 * MAP CONFIGURATION
 * =========================================================
 *
 * The visual city configuration is authored in the
 * original 2400 × 2400 coordinate system.
 *
 * The rendered parcel world is centered around DB 2400.
 *
 * Therefore:
 *
 *     database parcel coordinate
 *             -
 *          1200
 *
 * becomes the visual map coordinate.
 */

const MAP_SIZE = 2400;

const PARCEL_SIZE = 16;

const MAP_CENTER_OFFSET = 1200;


/**
 * =========================================================
 * STATUS COLOR
 * =========================================================
 */

function getParcelColor(
  parcel: Parcel,
): string {

  if (parcel.color) {
    return parcel.color;
  }

  switch (parcel.status) {

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
 * COMPONENT
 * =========================================================
 */

export default function ParcelOverviewMap({
  parcels,
  selectedParcelId,
  onSelect,
  onClose,
}: {
  parcels: Parcel[];

  selectedParcelId:
    | string
    | null;

  onSelect?: (
    parcel: Parcel
  ) => void;

  onClose?: () => void;
}) {

  const canvasRef =
    useRef<HTMLCanvasElement | null>(
      null,
    );


  /**
   * =======================================================
   * DRAW MAP
   * =======================================================
   */

  useEffect(() => {

    const canvas =
      canvasRef.current;

    if (!canvas) {
      return;
    }

    const context =
      canvas.getContext(
        "2d",
      );

    if (!context) {
      return;
    }


    const width =
      canvas.width;

    const height =
      canvas.height;

    const scale =
      width / MAP_SIZE;


    /**
     * -----------------------------------------------------
     * BACKGROUND
     * -----------------------------------------------------
     */

    context.clearRect(
      0,
      0,
      width,
      height,
    );

    context.fillStyle =
      "#07111f";

    context.fillRect(
      0,
      0,
      width,
      height,
    );


    /**
     * -----------------------------------------------------
     * CITY AREAS
     * -----------------------------------------------------
     */

    for (
      const area of
        CYPHERVERSE_MAP.areas
    ) {

      const minX =
        area.center.x -
        area.width / 2;

      const minZ =
        area.center.z -
        area.depth / 2;

      if (
        area.kind ===
        "DISTRICT"
      ) {
        context.fillStyle =
          "rgba(59,130,246,0.12)";
      }
      else if (
        area.kind ===
        "PARK"
      ) {
        context.fillStyle =
          "rgba(34,197,94,0.24)";
      }
      else {
        context.fillStyle =
          "rgba(148,163,184,0.20)";
      }

      context.fillRect(
        minX * scale,
        minZ * scale,
        area.width * scale,
        area.depth * scale,
      );

      context.strokeStyle =
        area.kind ===
          "DISTRICT"
          ? "rgba(96,165,250,0.35)"
          : "rgba(148,163,184,0.28)";

      context.lineWidth =
        1;

      context.strokeRect(
        minX * scale,
        minZ * scale,
        area.width * scale,
        area.depth * scale,
      );

    }


    /**
     * -----------------------------------------------------
     * GRID
     * -----------------------------------------------------
     */

    context.strokeStyle =
      "rgba(148,163,184,0.12)";

    context.lineWidth =
      0.5;

    for (
      let coordinate = 0;
      coordinate <= MAP_SIZE;
      coordinate += PARCEL_SIZE
    ) {

      const position =
        coordinate * scale;

      context.beginPath();

      context.moveTo(
        position,
        0,
      );

      context.lineTo(
        position,
        height,
      );

      context.stroke();

      context.beginPath();

      context.moveTo(
        0,
        position,
      );

      context.lineTo(
        width,
        position,
      );

      context.stroke();
    }


    /**
     * -----------------------------------------------------
     * ROADS
     * -----------------------------------------------------
     */

    for (
      const road of
        CYPHERVERSE_MAP.roads
    ) {

      if (
        road.points.length <
        2
      ) {
        continue;
      }

      context.beginPath();

      road.points.forEach(
        (
          point,
          index,
        ) => {

          const x =
            point.x * scale;

          const y =
            point.z * scale;

          if (
            index === 0
          ) {
            context.moveTo(
              x,
              y,
            );
          }
          else {
            context.lineTo(
              x,
              y,
            );
          }
        },
      );

      context.strokeStyle =
        "#263241";

      context.lineWidth =
        Math.max(
          2,
          road.width *
            scale,
        );

      context.lineCap =
        "round";

      context.lineJoin =
        "round";

      context.stroke();

      context.strokeStyle =
        "#475569";

      context.lineWidth =
        Math.max(
          0.5,
          road.width *
            scale *
            0.08,
        );

      context.stroke();

    }


    /**
     * -----------------------------------------------------
     * PARCELS
     * -----------------------------------------------------
     *
     * Database coordinates are shifted by -1200 so they
     * align with the existing visual city configuration.
     */

    for (
      const parcel of
        parcels
    ) {

      const mapX =
        parcel.x -
        MAP_CENTER_OFFSET;

      const mapY =
        parcel.y -
        MAP_CENTER_OFFSET;

      const x =
        mapX * scale;

      const y =
        mapY * scale;

      const size =
        PARCEL_SIZE *
        scale;

      context.fillStyle =
        getParcelColor(
          parcel,
        );

      context.globalAlpha =
        parcel.id ===
        selectedParcelId
          ? 0.95
          : 0.65;

      context.fillRect(
        x,
        y,
        size,
        size,
      );

      context.globalAlpha =
        1;

      context.strokeStyle =
        parcel.id ===
        selectedParcelId
          ? "#ffffff"
          : "rgba(255,255,255,0.20)";

      context.lineWidth =
        parcel.id ===
        selectedParcelId
          ? 2
          : 0.5;

      context.strokeRect(
        x,
        y,
        size,
        size,
      );
    }


    /**
     * -----------------------------------------------------
     * GENESIS
     * -----------------------------------------------------
     */

    const genesis =
      CYPHERVERSE_MAP.areas.find(
        (area) =>
          area.id ===
          "genesis-core",
      );

    if (genesis) {

      context.beginPath();

      context.arc(
        genesis.center.x *
          scale,
        genesis.center.z *
          scale,
        30 * scale,
        0,
        Math.PI * 2,
      );

      context.strokeStyle =
        "#f5d76e";

      context.lineWidth =
        3;

      context.stroke();

    }


    /**
     * -----------------------------------------------------
     * LABELS
     * -----------------------------------------------------
     */

    context.font =
      "600 14px Arial";

    context.textAlign =
      "center";

    context.textBaseline =
      "middle";

    for (
      const area of
        CYPHERVERSE_MAP.areas
    ) {

      if (
        area.kind !==
        "DISTRICT" &&
        area.id !==
          "genesis-core"
      ) {
        continue;
      }

      context.fillStyle =
        "rgba(255,255,255,0.88)";

      context.fillText(
        area.name,
        area.center.x *
          scale,
        area.center.z *
          scale,
      );
    }


    /**
     * -----------------------------------------------------
     * RESET
     * -----------------------------------------------------
     */

    context.globalAlpha =
      1;

  }, [
    parcels,
    selectedParcelId,
  ]);


  /**
   * =======================================================
   * MAP CLICK
   * =======================================================
   */

  const handleMapClick =
    (
      event: React.MouseEvent<HTMLCanvasElement>,
    ) => {

      if (!onSelect) {
        return;
      }

      const canvas =
        canvasRef.current;

      if (!canvas) {
        return;
      }

      const rect =
        canvas.getBoundingClientRect();

      const localX =
        event.clientX -
        rect.left;

      const localY =
        event.clientY -
        rect.top;

      const mapX =
        (localX /
          rect.width) *
        MAP_SIZE;

      const mapY =
        (localY /
          rect.height) *
        MAP_SIZE;

      const databaseX =
        mapX +
        MAP_CENTER_OFFSET;

      const databaseY =
        mapY +
        MAP_CENTER_OFFSET;

      const selected =
        parcels.find(
          (parcel) =>
            databaseX >=
              parcel.x &&
            databaseX <
              parcel.x +
                PARCEL_SIZE &&
            databaseY >=
              parcel.y &&
            databaseY <
              parcel.y +
                PARCEL_SIZE,
        );

      if (selected) {
        onSelect(
          selected,
        );
      }
    };


  /**
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <Html
      position={[
        0,
        0,
        0,
      ]}
      center
      distanceFactor={5.5}
      zIndexRange={[
        200,
        0,
      ]}
    >

      <div
        style={{
          width: "760px",
          padding: "14px",
          borderRadius: "14px",
          background:
            "rgba(5,10,20,0.98)",
          border:
            "1px solid rgba(148,163,184,0.4)",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.55)",
          color:
            "#ffffff",
          fontFamily:
            "Arial, sans-serif",
          pointerEvents:
            "auto",
        }}
        onPointerDown={(event) =>
          event.stopPropagation()
        }
        onClick={(event) =>
          event.stopPropagation()
        }
      >

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            marginBottom:
              "10px",
          }}
        >

          <div>

            <div
              style={{
                fontSize:
                  "18px",
                fontWeight:
                  700,
              }}
            >
              CYPHERVERSE LAND MAP
            </div>

            <div
              style={{
                fontSize:
                  "12px",
                color:
                  "#94a3b8",
                marginTop:
                  "3px",
              }}
            >
              Top-down view of roads, districts and loaded parcels
            </div>

          </div>


          {onClose && (

            <button
              type="button"
              onClick={
                onClose
              }
              style={{
                border:
                  "1px solid #334155",
                borderRadius:
                  "6px",
                background:
                  "#111827",
                color:
                  "#ffffff",
                padding:
                  "6px 10px",
                cursor:
                  "pointer",
              }}
            >
              CLOSE
            </button>

          )}

        </div>


        <canvas
          ref={
            canvasRef
          }
          width={720}
          height={720}
          onClick={
            handleMapClick
          }
          style={{
            display:
              "block",
            width:
              "720px",
            height:
              "720px",
            borderRadius:
              "8px",
            border:
              "1px solid #334155",
            cursor:
              "crosshair",
            background:
              "#07111f",
          }}
        >
          CypherVerse top-down land map.
        </canvas>


        <div
          style={{
            display:
              "flex",
            flexWrap:
              "wrap",
            gap:
              "14px",
            marginTop:
              "10px",
            fontSize:
              "11px",
            color:
              "#cbd5e1",
          }}
        >

          <Legend
            color="#28e07b"
            label="Available"
          />

          <Legend
            color="#4d7cff"
            label="Owned"
          />

          <Legend
            color="#ffc857"
            label="Reserved"
          />

          <Legend
            color="#ff6b6b"
            label="For Sale"
          />

          <span>
            Loaded parcels:{" "}
            {parcels.length}
          </span>

        </div>

      </div>

    </Html>
  );
}


/**
 * =========================================================
 * LEGEND
 * =========================================================
 */

function Legend({
  color,
  label,
}: {
  color: string;
  label: string;
}) {

  return (
    <span
      style={{
        display:
          "inline-flex",
        alignItems:
          "center",
        gap:
          "5px",
      }}
    >

      <span
        style={{
          width:
            "10px",
          height:
            "10px",
          borderRadius:
            "2px",
          background:
            color,
          display:
            "inline-block",
        }}
      />

      {label}

    </span>
  );
}