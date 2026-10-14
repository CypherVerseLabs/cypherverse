import {
  Button,
} from "cyengine";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Html,
  Text,
} from "@react-three/drei";

import type {
  Parcel,
  ParcelActionType,
} from "./types";

import {
  getDistrictAt,
  WORLD_DISTRICTS,
} from "../worlds/districts";

import ParcelOverviewMap from "./ParcelOverviewMap";


/**
 * =========================================================
 * CONFIGURATION
 * =========================================================
 */

const PAGE_SIZE = 8;


/**
 * =========================================================
 * PROPS
 * =========================================================
 */

interface ParcelDirectoryProps {

  parcels?: Parcel[];

  selectedParcelId?: string | null;

  onSelect?: (
    parcel: Parcel
  ) => void;

  onBuy?: (
    parcel: Parcel
  ) => void | Promise<void>;

  onReserve?: (
    parcel: Parcel
  ) => void | Promise<void>;

  onList?: (
    parcel: Parcel,
    price?: string
  ) => void | Promise<void>;

  visible?: boolean;

  position?: [
    number,
    number,
    number
  ];

  rotation?: [
    number,
    number,
    number
  ];

  scale?: number;

  actionParcelId?: string | null;

  actionType?: ParcelActionType | null;

  actionError?: string | null;
}


/**
 * =========================================================
 * STATUS
 * =========================================================
 */

function getStatusColor(
  status: Parcel["status"],
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


function getStatusLabel(
  status: Parcel["status"],
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
 * FILTER BAR
 * =========================================================
 */

function FilterBar({
  search,
  setSearch,
  status,
  setStatus,
  district,
  setDistrict,
  coordinateX,
  setCoordinateX,
  coordinateY,
  setCoordinateY,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
}: {
  search: string;
  setSearch: (
    value: string
  ) => void;

  status:
    | "all"
    | Parcel["status"];

  setStatus: (
    value:
      | "all"
      | Parcel["status"]
  ) => void;

  district: string;

  setDistrict: (
    value: string
  ) => void;

  coordinateX: string;

  setCoordinateX: (
    value: string
  ) => void;

  coordinateY: string;

  setCoordinateY: (
    value: string
  ) => void;

  minPrice: string;

  setMinPrice: (
    value: string
  ) => void;

  maxPrice: string;

  setMaxPrice: (
    value: string
  ) => void;
}) {

  return (
    <Html
      position={[
        0,
        0.82,
        0,
      ]}
      center
      distanceFactor={8}
      zIndexRange={[
        100,
        0,
      ]}
    >

      <div
        style={{
          width: "700px",
          padding: "12px",
          borderRadius: "10px",
          background:
            "rgba(10,14,24,0.96)",
          border:
            "1px solid rgba(148,163,184,0.35)",
          boxShadow:
            "0 12px 40px rgba(0,0,0,0.35)",
          color: "#ffffff",
          fontFamily:
            "Arial, sans-serif",
          boxSizing:
            "border-box",
          pointerEvents:
            "auto",
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "2fr 1fr 1.4fr",
            gap: "8px",
            marginBottom: "8px",
          }}
        >

          <input
            name="parcel-search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.currentTarget.value,
              )
            }
            placeholder="Search name, estate or parcel ID"
            style={inputStyle}
          />

          <select
            name="parcel-status"
            value={status}
            onChange={(event) =>
              setStatus(
                event.currentTarget.value as
                  | "all"
                  | Parcel["status"],
              )
            }
            style={inputStyle}
          >

            <option value="all">
              All Status
            </option>

            <option value="available">
              Available
            </option>

            <option value="for_sale">
              For Sale
            </option>

            <option value="owned">
              Owned
            </option>

            <option value="reserved">
              Reserved
            </option>

          </select>

          <select
            name="parcel-district"
            value={district}
            onChange={(event) =>
              setDistrict(
                event.currentTarget.value,
              )
            }
            style={inputStyle}
          >

            <option value="all">
              All Districts
            </option>

            {WORLD_DISTRICTS.map(
              (worldDistrict) => (
                <option
                  key={
                    worldDistrict.id
                  }
                  value={
                    worldDistrict.id
                  }
                >
                  {
                    worldDistrict.name
                  }
                </option>
              ),
            )}

          </select>

        </div>


        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 1fr 1fr 1fr",
            gap: "8px",
          }}
        >

          <input
            name="parcel-x"
            type="number"
            value={coordinateX}
            onChange={(event) =>
              setCoordinateX(
                event.currentTarget.value,
              )
            }
            placeholder="X"
            style={inputStyle}
          />

          <input
            name="parcel-y"
            type="number"
            value={coordinateY}
            onChange={(event) =>
              setCoordinateY(
                event.currentTarget.value,
              )
            }
            placeholder="Y"
            style={inputStyle}
          />

          <input
            name="parcel-min-price"
            type="number"
            min="0"
            value={minPrice}
            onChange={(event) =>
              setMinPrice(
                event.currentTarget.value,
              )
            }
            placeholder="Min price"
            style={inputStyle}
          />

          <input
            name="parcel-max-price"
            type="number"
            min="0"
            value={maxPrice}
            onChange={(event) =>
              setMaxPrice(
                event.currentTarget.value,
              )
            }
            placeholder="Max price"
            style={inputStyle}
          />

        </div>

      </div>

    </Html>
  );
}


const inputStyle = {
  width: "100%",
  boxSizing:
    "border-box" as const,
  padding:
    "7px 9px",
  borderRadius:
    "6px",
  border:
    "1px solid #334155",
  background:
    "#111827",
  color:
    "#ffffff",
  outline:
    "none",
  fontSize:
    "12px",
};


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

  index: number;

  actionParcelId?: string | null;

  actionType?: ParcelActionType | null;
}) {

  const statusColor =
    getStatusColor(
      parcel.status,
    );

  const statusLabel =
    getStatusLabel(
      parcel.status,
    );

  const district =
    getDistrictAt(
      parcel.x,
      parcel.y,
    );

  const districtName =
    district?.name ??
    "Unassigned District";

  const actionRunning =
    actionParcelId ===
      parcel.id &&
    actionType !== null &&
    actionType !== undefined;


  return (
    <group
      position={[
        0,
        -index * 0.72,
        0,
      ]}
    >

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


      <Text
        position={[
          -1.05,
          -0.17,
          0,
        ]}
        fontSize={0.065}
        color="#7dd3fc"
        anchorX="left"
        anchorY="middle"
        maxWidth={1.7}
      >
        {`District: ${districtName}`}
      </Text>


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
            actionType ===
              "buy"
              ? "BUYING..."
              : "BUY"}
          </Button>

        )}


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
            actionType ===
              "reserve"
              ? "RESERVING..."
              : "RESERVE"}
          </Button>

        )}


      {parcel.status ===
        "owned" && (

          <Button
            position={[
              0.86,
              -0.15,
              0,
            ]}
            fontSize={0.06}
            onClick={() =>
              onSelect(parcel)
            }
          >
            SET PRICE
          </Button>

        )}

    </group>
  );
}


/**
 * =========================================================
 * DIRECTORY
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
   * FILTER STATE
   * =======================================================
   */

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState<
    "all" | Parcel["status"]
  >("all");

  const [
    district,
    setDistrict,
  ] = useState("all");

  const [
    coordinateX,
    setCoordinateX,
  ] = useState("");

  const [
    coordinateY,
    setCoordinateY,
  ] = useState("");

  const [
    minPrice,
    setMinPrice,
  ] = useState("");

  const [
    maxPrice,
    setMaxPrice,
  ] = useState("");


  /**
   * =======================================================
   * PAGINATION
   * =======================================================
   */

  const [
    pageIndex,
    setPageIndex,
  ] = useState(0);


  /**
   * =======================================================
   * MAP
   * =======================================================
   */

  const [
    showMap,
    setShowMap,
  ] = useState(false);


  /**
   * =======================================================
   * LISTING PRICE
   * =======================================================
   */

  const [
    listingPrice,
    setListingPrice,
  ] = useState("");


  /**
   * =======================================================
   * FILTERED PARCELS
   * =======================================================
   */

  const filteredParcels =
    useMemo(
      () => {

        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        const parsedX =
          coordinateX.trim() === ""
            ? null
            : Number(
                coordinateX,
              );

        const parsedY =
          coordinateY.trim() === ""
            ? null
            : Number(
                coordinateY,
              );

        const parsedMinPrice =
          minPrice.trim() === ""
            ? null
            : Number(
                minPrice,
              );

        const parsedMaxPrice =
          maxPrice.trim() === ""
            ? null
            : Number(
                maxPrice,
              );

        return parcels.filter(
          (parcel) => {

            /**
             * SEARCH
             */

            if (
              normalizedSearch
            ) {

              const searchFields = [
                parcel.id,
                parcel.name ?? "",
                parcel.estateId != null
                  ? String(
                      parcel.estateId,
                    )
                  : "",
                parcel.description ?? "",
              ];

              const matchesSearch =
                searchFields.some(
                  (field) =>
                    field
                      .toLowerCase()
                      .includes(
                        normalizedSearch,
                      ),
                );

              if (
                !matchesSearch
              ) {
                return false;
              }
            }


            /**
             * STATUS
             */

            if (
              status !== "all" &&
              parcel.status !==
                status
            ) {
              return false;
            }


            /**
             * DISTRICT
             */

            if (
              district !== "all"
            ) {

              const parcelDistrict =
                getDistrictAt(
                  parcel.x,
                  parcel.y,
                );

              if (
                parcelDistrict?.id !==
                district
              ) {
                return false;
              }
            }


            /**
             * X COORDINATE
             */

            if (
              parsedX !== null &&
              parcel.x !== parsedX
            ) {
              return false;
            }


            /**
             * Y COORDINATE
             */

            if (
              parsedY !== null &&
              parcel.y !== parsedY
            ) {
              return false;
            }


            /**
             * PRICE
             */

            if (
              parsedMinPrice !== null
            ) {

              if (
                parcel.price ===
                  null ||
                parcel.price ===
                  undefined ||
                parcel.price <
                  parsedMinPrice
              ) {
                return false;
              }
            }

            if (
              parsedMaxPrice !== null
            ) {

              if (
                parcel.price ===
                  null ||
                parcel.price ===
                  undefined ||
                parcel.price >
                  parsedMaxPrice
              ) {
                return false;
              }
            }

            return true;
          },
        );

      },
      [
        parcels,
        search,
        status,
        district,
        coordinateX,
        coordinateY,
        minPrice,
        maxPrice,
      ],
    );


  /**
   * =======================================================
   * PAGED PARCELS
   * =======================================================
   */

  const pageCount =
    Math.max(
      1,
      Math.ceil(
        filteredParcels.length /
          PAGE_SIZE,
      ),
    );

  useEffect(() => {
    setPageIndex(0);
  }, [
    search,
    status,
    district,
    coordinateX,
    coordinateY,
    minPrice,
    maxPrice,
  ]);

  useEffect(() => {

    if (
      pageIndex >= pageCount
    ) {
      setPageIndex(
        pageCount - 1,
      );
    }

  }, [
    pageIndex,
    pageCount,
  ]);

  const pagedParcels =
    filteredParcels.slice(
      pageIndex *
        PAGE_SIZE,
      (pageIndex + 1) *
        PAGE_SIZE,
    );


  /**
   * =======================================================
   * SELECTED OWNED PARCEL
   * =======================================================
   */

  const selectedOwnedParcel =
    useMemo(
      () => {

        if (
          !selectedParcelId
        ) {
          return null;
        }

        const parcel =
          parcels.find(
            (item) =>
              item.id ===
              selectedParcelId,
          );

        if (
          !parcel ||
          parcel.status !==
            "owned"
        ) {
          return null;
        }

        return parcel;

      },
      [
        parcels,
        selectedParcelId,
      ],
    );


  /**
   * =======================================================
   * INITIALIZE LIST PRICE
   * =======================================================
   */

  useEffect(() => {

    if (
      !selectedOwnedParcel
    ) {

      setListingPrice("");

      return;
    }

    setListingPrice(
      selectedOwnedParcel.price !==
        null &&
      selectedOwnedParcel.price !==
        undefined
        ? String(
            selectedOwnedParcel.price,
          )
        : "",
    );

  }, [
    selectedOwnedParcel?.id,
    selectedOwnedParcel?.price,
  ]);


  /**
   * =======================================================
   * LIST SELECTED PARCEL
   * =======================================================
   */

  const handleListSelected =
    () => {

      if (
        !selectedOwnedParcel ||
        !onList ||
        actionParcelId
      ) {
        return;
      }

      void onList(
        selectedOwnedParcel,
        listingPrice,
      );
    };


  /**
   * =======================================================
   * SELECT
   * =======================================================
   */

  const handleSelect =
    (
      parcel: Parcel,
    ) => {

      onSelect?.(
        parcel,
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

      {/* =================================================
          TITLE
          ================================================= */}

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
        Browse, filter and list CypherVerse parcels
      </Text>


      {/* =================================================
          FILTERS
          ================================================= */}

      <FilterBar
        search={
          search
        }
        setSearch={
          setSearch
        }
        status={
          status
        }
        setStatus={
          setStatus
        }
        district={
          district
        }
        setDistrict={
          setDistrict
        }
        coordinateX={
          coordinateX
        }
        setCoordinateX={
          setCoordinateX
        }
        coordinateY={
          coordinateY
        }
        setCoordinateY={
          setCoordinateY
        }
        minPrice={
          minPrice
        }
        setMinPrice={
          setMinPrice
        }
        maxPrice={
          maxPrice
        }
        setMaxPrice={
          setMaxPrice
        }
      />


      {/* =================================================
          MAP TOGGLE
          ================================================= */}

      <Button
        position={[
          1.02,
          0.42,
          0,
        ]}
        fontSize={0.065}
        onClick={() =>
          setShowMap(
            (current) =>
              !current,
          )
        }
      >
        {showMap
          ? "CLOSE MAP"
          : "MAP"}
      </Button>


      {/* =================================================
          ACTION ERROR
          ================================================= */}

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


      {/* =================================================
          LISTING PRICE
          ================================================= */}

      {selectedOwnedParcel &&
        onList &&
        !showMap && (

          <Html
            position={[
              0,
              -0.55,
              0,
            ]}
            center
            distanceFactor={8}
            zIndexRange={[
              100,
              0,
            ]}
          >

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                borderRadius: "8px",
                background:
                  "rgba(15,23,42,0.96)",
                border:
                  "1px solid rgba(148,163,184,0.35)",
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

              <span
                style={{
                  fontSize: "12px",
                  whiteSpace:
                    "nowrap",
                }}
              >
                List{" "}
                {selectedOwnedParcel.name ||
                  selectedOwnedParcel.estateId ||
                  "parcel"}{" "}
                for:
              </span>

              <input
                name="listing-price"
                type="number"
                min="0.01"
                step="0.01"
                value={
                  listingPrice
                }
                onChange={(event) =>
                  setListingPrice(
                    event.currentTarget.value,
                  )
                }
                placeholder="Price in CV"
                style={{
                  width: "110px",
                  padding:
                    "6px 8px",
                  borderRadius:
                    "6px",
                  border:
                    "1px solid #334155",
                  background:
                    "#111827",
                  color:
                    "#ffffff",
                }}
              />

              <button
                type="button"
                disabled={
                  Boolean(
                    actionParcelId,
                  ) ||
                  !listingPrice
                }
                onClick={
                  handleListSelected
                }
                style={{
                  padding:
                    "6px 10px",
                  border: "0",
                  borderRadius:
                    "6px",
                  background:
                    "#2563eb",
                  color:
                    "#ffffff",
                  cursor:
                    "pointer",
                  fontWeight:
                    600,
                }}
              >
                {actionParcelId ===
                  selectedOwnedParcel.id &&
                actionType ===
                  "list"
                  ? "LISTING..."
                  : "LIST FOR SALE"}
              </button>

            </div>

          </Html>

        )}


      {/* =================================================
          MAP
          ================================================= */}

      {showMap && (

        <ParcelOverviewMap
          parcels={
            parcels
          }
          selectedParcelId={
            selectedParcelId
          }
          onSelect={
            handleSelect
          }
          onClose={() =>
            setShowMap(false)
          }
        />

      )}


      {/* =================================================
          EMPTY STATE
          ================================================= */}

      {!showMap &&
        filteredParcels.length ===
          0 && (

          <Text
            position={[
              0,
              -0.85,
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


      {/* =================================================
          PARCEL LIST
          ================================================= */}

      {!showMap && (

        <group
          position={[
            0,
            -1.20,
            0,
          ]}
        >

          {pagedParcels.map(
            (
              parcel,
              index,
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

                actionParcelId={
                  actionParcelId
                }

                actionType={
                  actionType
                }
              />

            ),
          )}

        </group>

      )}


      {/* =================================================
          PAGINATION
          ================================================= */}

      {!showMap &&
        filteredParcels.length >
          PAGE_SIZE && (

          <group
            position={[
              0,
              -7.00,
              0,
            ]}
          >

            <Button
              position={[
                -0.55,
                0,
                0,
              ]}
              fontSize={0.065}
              onClick={() =>
                setPageIndex(
                  (current) =>
                    Math.max(
                      0,
                      current - 1,
                    ),
                )
              }
            >
              PREVIOUS
            </Button>


            <Text
              position={[
                0,
                0,
                0,
              ]}
              fontSize={0.07}
              color="#94a3b8"
              anchorX="center"
              anchorY="middle"
            >
              {`PAGE ${
                pageIndex + 1
              } / ${pageCount}`}
            </Text>


            <Button
              position={[
                0.55,
                0,
                0,
              ]}
              fontSize={0.065}
              onClick={() =>
                setPageIndex(
                  (current) =>
                    Math.min(
                      pageCount - 1,
                      current + 1,
                    ),
                )
              }
            >
              NEXT
            </Button>

          </group>

        )}


      {/* =================================================
          COUNT
          ================================================= */}

      {!showMap && (

        <Text
          position={[
            0,
            -7.55,
            0,
          ]}
          fontSize={0.07}
          color="#64748b"
          anchorX="center"
          anchorY="middle"
        >
          {`${filteredParcels.length} matching parcels · ${parcels.length} loaded`}
        </Text>

      )}

    </group>
  );
}