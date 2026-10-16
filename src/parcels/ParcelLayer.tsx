import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useFrame,
  useThree,
} from "@react-three/fiber";

import type {
  Parcel,
  ParcelLayerProps,
} from "./types";

import ParcelTile from "./ParcelTile";
import ParcelPanel from "./ParcelPanel";

import {
  PARCEL_SIZE,
  WORLD_MIN,
  WORLD_MAX,
  parcelToWorldPosition,
  worldPositionToDatabaseCoordinates,
} from "./parcelCoordinates";

/**
 * =========================================================
 * CONFIGURATION
 * =========================================================
 */

const DEFAULT_RENDER_DISTANCE = 256;

const CAMERA_UPDATE_INTERVAL = 150;

const LOAD_CHUNK_SIZE = 512;

/**
 * =========================================================
 * OPTIONAL DYNAMIC LOADER
 * =========================================================
 */

interface ExtendedParcelLayerProps
  extends ParcelLayerProps {
  onRequestBounds?: (bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  }) => void;
}

/**
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function ParcelLayer({
  parcels = [],
  visible = true,
  tileSize = 1,
  origin = [0, 0, 0],
  interactive = true,
  selectedParcelId,
  onParcelSelect,
  onParcelClose,
  onBuy,
  onReserve,
  onList,
  actionParcelId,
  actionType,
  actionError,
  onRequestBounds,
}: ExtendedParcelLayerProps) {
  const camera = useThree(
    (state) => state.camera,
  );

  const [
    internalSelectedId,
    setInternalSelectedId,
  ] = useState<string | null>(null);

  const activeSelectedId =
    selectedParcelId !== undefined
      ? selectedParcelId
      : internalSelectedId;

  const selectedParcel = useMemo(() => {
    if (!activeSelectedId) {
      return null;
    }

    return (
      parcels.find(
        (parcel) =>
          parcel.id === activeSelectedId,
      ) ?? null
    );
  }, [
    parcels,
    activeSelectedId,
  ]);

  const [
    nearbyParcels,
    setNearbyParcels,
  ] = useState<Parcel[]>([]);

  const lastCameraUpdate = useRef(0);

  /**
   * Prevent repeatedly requesting the same chunk.
   */
  const requestedChunksRef = useRef<Set<string>>(
    new Set(),
  );

  /**
   * =======================================================
   * REQUEST DATABASE CHUNK
   * =======================================================
   *
   * Chunk coordinates and API bounds use database
   * coordinates, not centered Three.js coordinates.
   */

  const requestChunk = useCallback(
    (
      chunkX: number,
      chunkY: number,
    ) => {
      if (!onRequestBounds) {
        return;
      }

      const minX =
        Math.floor(
          chunkX / LOAD_CHUNK_SIZE,
        ) * LOAD_CHUNK_SIZE;

      const minY =
        Math.floor(
          chunkY / LOAD_CHUNK_SIZE,
        ) * LOAD_CHUNK_SIZE;

      const maxX =
        minX + LOAD_CHUNK_SIZE;

      const maxY =
        minY + LOAD_CHUNK_SIZE;

      /**
       * Skip chunks entirely outside the valid world.
       *
       * The maximum parcel origin is WORLD_MAX. A chunk
       * ending at WORLD_MIN or starting beyond WORLD_MAX
       * cannot contain a valid parcel origin.
       */
      if (
        maxX <= WORLD_MIN ||
        maxY <= WORLD_MIN ||
        minX > WORLD_MAX ||
        minY > WORLD_MAX
      ) {
        return;
      }

      const key = [
        minX,
        maxX,
        minY,
        maxY,
      ].join(":");

      if (
        requestedChunksRef.current.has(key)
      ) {
        return;
      }

      requestedChunksRef.current.add(key);

      onRequestBounds({
        minX,
        maxX,
        minY,
        maxY,
      });
    },
    [
      onRequestBounds,
    ],
  );

  /**
   * =======================================================
   * FIND NEARBY PARCELS
   * =======================================================
   *
   * Camera coordinates are centered Three.js coordinates.
   * Parcel coordinates are database coordinates.
   *
   * Convert the camera bounds before comparing them with
   * parcel records.
   */

  const calculateNearby = useCallback(() => {
    const cameraX = camera.position.x;
    const cameraZ = camera.position.z;

    /**
     * Convert the camera position from world space to
     * database space.
     *
     * Subtract the optional world origin offset first.
     */
    const databasePosition =
      worldPositionToDatabaseCoordinates(
        cameraX - origin[0],
        cameraZ - origin[2],
      );

    /**
     * Calculate the visible world-space bounds.
     */
    const distance = DEFAULT_RENDER_DISTANCE;

    const minWorldX = cameraX - distance;
    const maxWorldX = cameraX + distance;

    const minWorldZ = cameraZ - distance;
    const maxWorldZ = cameraZ + distance;

    /**
     * Convert the bounds to database coordinates.
     */
    const minDatabase =
      worldPositionToDatabaseCoordinates(
        minWorldX - origin[0],
        minWorldZ - origin[2],
      );

    const maxDatabase =
      worldPositionToDatabaseCoordinates(
        maxWorldX - origin[0],
        maxWorldZ - origin[2],
      );

    /**
     * Align the bounds to the parcel grid and clamp
     * them to the valid database world.
     */
    const minParcelX = Math.max(
      WORLD_MIN,
      Math.floor(
        minDatabase.x / PARCEL_SIZE,
      ) * PARCEL_SIZE,
    );

    const maxParcelX = Math.min(
      WORLD_MAX,
      Math.ceil(
        maxDatabase.x / PARCEL_SIZE,
      ) * PARCEL_SIZE,
    );

    const minParcelY = Math.max(
      WORLD_MIN,
      Math.floor(
        minDatabase.y / PARCEL_SIZE,
      ) * PARCEL_SIZE,
    );

    const maxParcelY = Math.min(
      WORLD_MAX,
      Math.ceil(
        maxDatabase.y / PARCEL_SIZE,
      ) * PARCEL_SIZE,
    );

    /**
     * Select parcels inside the visible database bounds.
     */
    const visibleParcels =
      parcels.filter(
        (parcel) =>
          parcel.x >= minParcelX &&
          parcel.x <= maxParcelX &&
          parcel.y >= minParcelY &&
          parcel.y <= maxParcelY,
      );

    /**
     * Keep the selected parcel visible even when it is
     * outside the normal render distance.
     */
    if (activeSelectedId) {
      const selected = parcels.find(
        (parcel) =>
          parcel.id === activeSelectedId,
      );

      if (
        selected &&
        !visibleParcels.some(
          (parcel) =>
            parcel.id === selected.id,
        )
      ) {
        visibleParcels.push(selected);
      }
    }

    setNearbyParcels(visibleParcels);

    /**
     * =====================================================
     * DYNAMIC CHUNK LOADING
     * =====================================================
     *
     * Use database coordinates when requesting API chunks.
     *
     * At world position (0, 0), the database position is
     * (2400, 2400), so the central chunk begins at
     * (2048, 2048).
     */

    const chunkX =
      Math.floor(
        databasePosition.x / LOAD_CHUNK_SIZE,
      ) * LOAD_CHUNK_SIZE;

    const chunkY =
      Math.floor(
        databasePosition.y / LOAD_CHUNK_SIZE,
      ) * LOAD_CHUNK_SIZE;

    /**
     * Current chunk.
     */
    requestChunk(chunkX, chunkY);

    /**
     * Neighboring chunks.
     */
    requestChunk(
      chunkX - LOAD_CHUNK_SIZE,
      chunkY,
    );

    requestChunk(
      chunkX + LOAD_CHUNK_SIZE,
      chunkY,
    );

    requestChunk(
      chunkX,
      chunkY - LOAD_CHUNK_SIZE,
    );

    requestChunk(
      chunkX,
      chunkY + LOAD_CHUNK_SIZE,
    );

    /**
     * Diagonal chunks.
     */
    requestChunk(
      chunkX - LOAD_CHUNK_SIZE,
      chunkY - LOAD_CHUNK_SIZE,
    );

    requestChunk(
      chunkX + LOAD_CHUNK_SIZE,
      chunkY - LOAD_CHUNK_SIZE,
    );

    requestChunk(
      chunkX - LOAD_CHUNK_SIZE,
      chunkY + LOAD_CHUNK_SIZE,
    );

    requestChunk(
      chunkX + LOAD_CHUNK_SIZE,
      chunkY + LOAD_CHUNK_SIZE,
    );
  }, [
    parcels,
    camera,
    origin,
    activeSelectedId,
    requestChunk,
  ]);

  /**
   * =======================================================
   * INITIAL LOAD
   * =======================================================
   */

  useEffect(() => {
    calculateNearby();
  }, [
    calculateNearby,
  ]);

  /**
   * =======================================================
   * CAMERA MOVEMENT
   * =======================================================
   */

  useFrame(() => {
    if (!visible) {
      return;
    }

    const now = performance.now();

    if (
      now - lastCameraUpdate.current <
      CAMERA_UPDATE_INTERVAL
    ) {
      return;
    }

    lastCameraUpdate.current = now;

    calculateNearby();
  });

  /**
   * =======================================================
   * SELECT PARCEL
   * =======================================================
   */

  const handleSelect = useCallback(
    (parcel: Parcel) => {
      if (!interactive) {
        return;
      }

      setInternalSelectedId(parcel.id);

      onParcelSelect?.({
        parcel,
        source: "world",
      });
    },
    [
      interactive,
      onParcelSelect,
    ],
  );

  /**
   * =======================================================
   * CLOSE PANEL
   * =======================================================
   */

  const handleClose = useCallback(() => {
    setInternalSelectedId(null);

    onParcelClose?.();
  }, [
    onParcelClose,
  ]);

  /**
   * =======================================================
   * VISIBILITY
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
    <>
      <group name="parcel-layer">
        {nearbyParcels.map((parcel) => {
          const position =
            parcelToWorldPosition(
              parcel.x,
              parcel.y,
              tileSize,
              origin,
            );

          return (
            <ParcelTile
              key={parcel.id}
              parcel={parcel}
              position={position}
              size={tileSize}
              selected={
                activeSelectedId === parcel.id
              }
              interactive={interactive}
              onSelect={handleSelect}
            />
          );
        })}
      </group>

      <ParcelPanel
        parcel={selectedParcel}
        onClose={handleClose}
        onBuy={onBuy}
        onReserve={onReserve}
        onList={onList}
        actionParcelId={actionParcelId}
        actionType={actionType}
        actionError={actionError}
      />
    </>
  );
}