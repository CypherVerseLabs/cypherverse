import type {
  Parcel,
} from "./types";


/**
 * =========================================================
 * PARCEL MAP PROPS
 * =========================================================
 */

interface ParcelMapProps {

  /**
   * Parcels displayed on the map.
   */

  parcels: Parcel[];


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
   * Whether the map accepts interaction.
   */

  interactive?: boolean;
}


/**
 * =========================================================
 * STATUS COLOR
 * =========================================================
 */

function getColor(
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
      return "Available";

    case "owned":
      return "Owned";

    case "reserved":
      return "Reserved";

    case "for_sale":
      return "For Sale";

    default:
      return "Unknown";
  }
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
 * PARCEL MAP
 * =========================================================
 *
 * 2D HTML representation of the parcel world.
 *
 * This component:
 *
 *   - displays parcel locations
 *   - displays parcel status
 *   - displays parcel names
 *   - displays parcel prices
 *   - handles selection
 *
 * It does NOT:
 *
 *   - fetch parcels
 *   - buy parcels
 *   - reserve parcels
 *   - list parcels
 *   - modify marketplace state
 *
 * Those responsibilities remain outside the map.
 *
 * =========================================================
 */

export default function ParcelMap({
  parcels,
  selectedParcelId = null,
  onSelect,
  interactive = true,
}: ParcelMapProps) {

  /**
   * =======================================================
   * EMPTY STATE
   * =======================================================
   */

  if (parcels.length === 0) {

    return (
      <div
        style={{
          padding: 24,
          textAlign: "center",
          color: "#8d99ae",
          background: "#111827",
          borderRadius: 8,
        }}
      >
        No parcels available.
      </div>
    );
  }


  /**
   * =======================================================
   * WORLD BOUNDS
   * =======================================================
   *
   * Determine the smallest rectangular grid that contains
   * every parcel.
   *
   * Example:
   *
   *   X: -10 ... 10
   *   Y: -5  ... 5
   *
   * produces:
   *
   *   width  = 21
   *   height = 11
   *
   * =======================================================
   */

  const xs =
    parcels.map(
      (parcel) =>
        parcel.x
    );

  const ys =
    parcels.map(
      (parcel) =>
        parcel.y
    );


  const minX =
    Math.min(...xs);

  const maxX =
    Math.max(...xs);

  const minY =
    Math.min(...ys);

  const maxY =
    Math.max(...ys);


  /**
   * Number of grid cells.
   */

  const width =
    maxX -
    minX +
    1;

  const height =
    maxY -
    minY +
    1;


  /**
   * =======================================================
   * CELL DIMENSIONS
   * =======================================================
   *
   * Every parcel occupies one equal-sized cell.
   */

  const cellWidth =
    100 / width;

  const cellHeight =
    100 / height;


  /**
   * =======================================================
   * MAP
   * =======================================================
 */

  return (
    <div
      role="grid"
      aria-label="CypherVerse parcel map"
      style={{
        position: "relative",

        width: "100%",

        aspectRatio:
          `${width}/${height}`,

        minHeight: 220,

        background:
          "#0b1220",

        overflow: "hidden",

        borderRadius: 8,

        border:
          "1px solid rgba(255,255,255,0.08)",

        backgroundImage:
          `
            linear-gradient(
              rgba(255,255,255,0.035) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(255,255,255,0.035) 1px,
              transparent 1px
            )
          `,

        backgroundSize:
          `${cellWidth}% ${cellHeight}%`,
      }}
    >

      {/* ===================================================
          PARCELS
          =================================================== */}

      {parcels.map(
        (parcel) => {

          /**
           * Convert world coordinates into map coordinates.
           */

          const column =
            parcel.x -
            minX;

          const row =
            parcel.y -
            minY;


          const left =
            column *
            cellWidth;

          const top =
            row *
            cellHeight;


          const selected =
            selectedParcelId ===
            parcel.id;


          const color =
            parcel.color ||
            getColor(
              parcel.status
            );


          const displayName =
            parcel.name ||
            parcel.estateId ||
            `Parcel ${parcel.id}`;


          const statusLabel =
            getStatusLabel(
              parcel.status
            );


          return (
            <button
              key={
                parcel.id
              }

              type="button"

              disabled={
                !interactive
              }

              role="gridcell"

              aria-selected={
                selected
              }

              aria-label={
                `${displayName}, ${statusLabel}, ${formatPrice(parcel.price)}`
              }

              title={
                `${displayName} — ${statusLabel} — ${formatPrice(parcel.price)}`
              }

              onClick={() => {

                if (!interactive) {
                  return;
                }

                onSelect?.(
                  parcel
                );
              }}

              style={{
                position:
                  "absolute",

                left:
                  `${left}%`,

                top:
                  `${top}%`,

                width:
                  `${cellWidth}%`,

                height:
                  `${cellHeight}%`,

                boxSizing:
                  "border-box",

                padding: 1,

                border:
                  selected
                    ? "2px solid #ffffff"
                    : "1px solid rgba(0,0,0,0.30)",

                background:
                  color,

                cursor:
                  interactive
                    ? "pointer"
                    : "default",

                opacity:
                  selected
                    ? 1
                    : 0.78,

                transition:
                  "opacity 120ms ease, filter 120ms ease, border-color 120ms ease",

                zIndex:
                  selected
                    ? 2
                    : 1,

                overflow:
                  "hidden",
              }}

              onMouseEnter={(
                event
              ) => {

                if (!interactive) {
                  return;
                }

                event.currentTarget.style.opacity =
                  "1";

                event.currentTarget.style.filter =
                  "brightness(1.15)";
              }}

              onMouseLeave={(
                event
              ) => {

                event.currentTarget.style.opacity =
                  selected
                    ? "1"
                    : "0.78";

                event.currentTarget.style.filter =
                  "none";
              }}
            >

              {/* =========================================
                  PARCEL NAME
                  ========================================= */}

              <span
                style={{
                  display:
                    "block",

                  overflow:
                    "hidden",

                  whiteSpace:
                    "nowrap",

                  textOverflow:
                    "ellipsis",

                  color:
                    "#ffffff",

                  fontSize:
                    9,

                  lineHeight:
                    1,

                  fontWeight:
                    selected
                      ? 700
                      : 500,

                  textShadow:
                    "0 1px 2px rgba(0,0,0,.7)",

                  pointerEvents:
                    "none",
                }}
              >
                {
                  displayName
                }
              </span>

            </button>
          );
        }
      )}


      {/* ===================================================
          MAP LEGEND
          =================================================== */}

      <div
        aria-hidden="true"
        style={{
          position:
            "absolute",

          left: 10,

          bottom: 10,

          display:
            "flex",

          flexWrap:
            "wrap",

          gap: 8,

          padding:
            "7px 9px",

          borderRadius:
            8,

          background:
            "rgba(5, 10, 18, 0.82)",

          backdropFilter:
            "blur(6px)",

          color:
            "#ffffff",

          fontSize:
            10,

          pointerEvents:
            "none",
        }}
      >

        <LegendItem
          color="#28e07b"
          label="Available"
        />

        <LegendItem
          color="#4d7cff"
          label="Owned"
        />

        <LegendItem
          color="#ffc857"
          label="Reserved"
        />

        <LegendItem
          color="#ff6b6b"
          label="For Sale"
        />

      </div>


      {/* ===================================================
          COORDINATE RANGE
          =================================================== */}

      <div
        aria-hidden="true"
        style={{
          position:
            "absolute",

          right: 10,

          top: 10,

          padding:
            "5px 8px",

          borderRadius:
            6,

          background:
            "rgba(5, 10, 18, 0.72)",

          color:
            "#9ca8ba",

          fontSize:
            10,

          pointerEvents:
            "none",
        }}
      >

        X {minX} → {maxX}

        {"  "}

        Y {minY} → {maxY}

      </div>

    </div>
  );
}


/**
 * =========================================================
 * LEGEND ITEM
 * =========================================================
 */

function LegendItem({
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

        gap: 5,
      }}
    >

      <span
        style={{
          width: 7,

          height: 7,

          borderRadius:
            "50%",

          background:
            color,
        }}
      />

      {label}

    </span>
  );
}