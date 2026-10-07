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

import {
  parcelToWorldPosition,
} from "./parcelCoordinates";

import ParcelTile from "./ParcelTile";
import ParcelPanel from "./ParcelPanel";


/**
 * =========================================================
 * CONFIGURATION
 * =========================================================
 */

const DEFAULT_RENDER_DISTANCE = 256;

const CAMERA_UPDATE_INTERVAL = 150;

const LOAD_CHUNK_SIZE = 512;

/**
 * Start loading the next chunk before the player actually
 * reaches the edge.
 */
const LOAD_MARGIN = 256;


/**
 * =========================================================
 * OPTIONAL DYNAMIC LOADER
 * =========================================================
 *
 * ParcelLayer can receive a callback from CypherVerse.
 */

interface ExtendedParcelLayerProps
  extends ParcelLayerProps {

  onRequestBounds?: (
    bounds: {
      minX: number;
      maxX: number;
      minY: number;
      maxY: number;
    }
  ) => void;
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

  const camera =
    useThree(
      (state) =>
        state.camera
    );


  const [
    internalSelectedId,
    setInternalSelectedId,
  ] = useState<string | null>(
    null
  );


  const activeSelectedId =
    selectedParcelId !== undefined
      ? selectedParcelId
      : internalSelectedId;


  const selectedParcel =
    useMemo(() => {

      if (!activeSelectedId) {
        return null;
      }


      return (
        parcels.find(
          (parcel) =>
            parcel.id ===
            activeSelectedId
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


  const lastCameraUpdate =
    useRef(0);


  /**
   * Prevent repeatedly requesting the same chunk.
   */
  const requestedChunksRef =
    useRef<
      Set<string>
    >(
      new Set()
    );


  /**
   * =======================================================
   * REQUEST WORLD CHUNK
   * =======================================================
   */

  const requestChunk =
    useCallback(
      (
        chunkX: number,
        chunkY: number
      ) => {

        if (!onRequestBounds) {
          return;
        }


        const minX =
          Math.floor(
            chunkX /
              LOAD_CHUNK_SIZE
          ) *
          LOAD_CHUNK_SIZE;


        const minY =
          Math.floor(
            chunkY /
              LOAD_CHUNK_SIZE
          ) *
          LOAD_CHUNK_SIZE;


        const maxX =
          minX +
          LOAD_CHUNK_SIZE;


        const maxY =
          minY +
          LOAD_CHUNK_SIZE;


        const key =
          [
            minX,
            maxX,
            minY,
            maxY,
          ].join(":");


        if (
          requestedChunksRef.current.has(
            key
          )
        ) {
          return;
        }


        requestedChunksRef.current.add(
          key
        );


        onRequestBounds({
          minX,
          maxX,
          minY,
          maxY,
        });

      },
      [
        onRequestBounds,
      ]
    );


  /**
   * =======================================================
   * FIND NEARBY PARCELS
   * =======================================================
   */

  const calculateNearby =
    useCallback(() => {

      if (
        parcels.length === 0
      ) {

        setNearbyParcels([]);

        return;

      }


      const cameraX =
        camera.position.x;


      const cameraZ =
        camera.position.z;


      const distance =
        DEFAULT_RENDER_DISTANCE;


      const minWorldX =
        cameraX -
        distance;


      const maxWorldX =
        cameraX +
        distance;


      const minWorldZ =
        cameraZ -
        distance;


      const maxWorldZ =
        cameraZ +
        distance;


      const minParcelX =
        Math.floor(
          (
            minWorldX -
            origin[0]
          ) /
          tileSize
        ) *
        tileSize;


      const maxParcelX =
        Math.ceil(
          (
            maxWorldX -
            origin[0]
          ) /
          tileSize
        ) *
        tileSize;


      const minParcelY =
        Math.floor(
          (
            minWorldZ -
            origin[2]
          ) /
          tileSize
        ) *
        tileSize;


      const maxParcelY =
        Math.ceil(
          (
            maxWorldZ -
            origin[2]
          ) /
          tileSize
        ) *
        tileSize;


      const visibleParcels =
        parcels.filter(
          (parcel) =>
            parcel.x >=
              minParcelX &&
            parcel.x <=
              maxParcelX &&
            parcel.y >=
              minParcelY &&
            parcel.y <=
              maxParcelY
        );


      /**
       * Keep selected parcel visible.
       */

      if (
        activeSelectedId
      ) {

        const selected =
          parcels.find(
            (parcel) =>
              parcel.id ===
              activeSelectedId
          );


        if (
          selected &&
          !visibleParcels.some(
            (parcel) =>
              parcel.id ===
              selected.id
          )
        ) {

          visibleParcels.push(
            selected
          );

        }

      }


      setNearbyParcels(
        visibleParcels
      );


      /**
       * =====================================================
       * DYNAMIC CHUNK LOADING
       * =====================================================
       *
       * Ask for the chunk underneath the camera and the
       * surrounding chunks.
       */


      const loadX =
        cameraX -
        origin[0];


      const loadY =
        cameraZ -
        origin[2];


      const chunkX =
        Math.floor(
          loadX /
            LOAD_CHUNK_SIZE
        ) *
        LOAD_CHUNK_SIZE;


      const chunkY =
        Math.floor(
          loadY /
            LOAD_CHUNK_SIZE
        ) *
        LOAD_CHUNK_SIZE;


      /**
       * Current chunk.
       */
      requestChunk(
        chunkX,
        chunkY
      );


      /**
       * Neighboring chunks.
       */
      requestChunk(
        chunkX -
          LOAD_CHUNK_SIZE,
        chunkY
      );


      requestChunk(
        chunkX +
          LOAD_CHUNK_SIZE,
        chunkY
      );


      requestChunk(
        chunkX,
        chunkY -
          LOAD_CHUNK_SIZE
      );


      requestChunk(
        chunkX,
        chunkY +
          LOAD_CHUNK_SIZE
      );


      /**
       * Diagonal chunks.
       */
      requestChunk(
        chunkX -
          LOAD_CHUNK_SIZE,
        chunkY -
          LOAD_CHUNK_SIZE
      );


      requestChunk(
        chunkX +
          LOAD_CHUNK_SIZE,
        chunkY -
          LOAD_CHUNK_SIZE
      );


      requestChunk(
        chunkX -
          LOAD_CHUNK_SIZE,
        chunkY +
          LOAD_CHUNK_SIZE
      );


      requestChunk(
        chunkX +
          LOAD_CHUNK_SIZE,
        chunkY +
          LOAD_CHUNK_SIZE
      );

    }, [
      parcels,
      camera,
      tileSize,
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


    const now =
      performance.now();


    if (
      now -
        lastCameraUpdate.current <
      CAMERA_UPDATE_INTERVAL
    ) {
      return;
    }


    lastCameraUpdate.current =
      now;


    calculateNearby();

  });


  /**
   * =======================================================
   * SELECT PARCEL
   * =======================================================
   */

  const handleSelect =
    useCallback(
      (parcel: Parcel) => {

        if (!interactive) {
          return;
        }


        setInternalSelectedId(
          parcel.id
        );


        onParcelSelect?.({
          parcel,
          source: "world",
        });

      },
      [
        interactive,
        onParcelSelect,
      ]);


  /**
   * =======================================================
   * CLOSE PANEL
   * =======================================================
   */

  const handleClose =
    useCallback(() => {

      setInternalSelectedId(
        null
      );


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
      <group
        name="parcel-layer"
      >

        {nearbyParcels.map(
          (parcel) => {

            const position =
              parcelToWorldPosition(
                parcel.x,
                parcel.y,
                tileSize,
                origin
              );


            return (
              <ParcelTile
                key={
                  parcel.id
                }

                parcel={
                  parcel
                }

                position={
                  position
                }

                size={
                  tileSize
                }

                selected={
                  activeSelectedId ===
                  parcel.id
                }

                interactive={
                  interactive
                }

                onSelect={
                  handleSelect
                }
              />
            );

          }
        )}

      </group>


      <ParcelPanel
        parcel={
          selectedParcel
        }

        onClose={
          handleClose
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

        actionError={
          actionError
        }
      />

    </>
  );
}
