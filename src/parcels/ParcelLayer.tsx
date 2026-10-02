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

const DEFAULT_RENDER_DISTANCE = 256;

const CAMERA_UPDATE_INTERVAL = 150;

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
}: ParcelLayerProps) {

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
        cameraX - distance;

      const maxWorldX =
        cameraX + distance;

      const minWorldZ =
        cameraZ - distance;

      const maxWorldZ =
        cameraZ + distance;

      const minParcelX =
        Math.floor(
          (minWorldX -
            origin[0]) /
            tileSize
        ) *
        tileSize;

      const maxParcelX =
        Math.ceil(
          (maxWorldX -
            origin[0]) /
            tileSize
        ) *
        tileSize;

      const minParcelY =
        Math.floor(
          (minWorldZ -
            origin[2]) /
            tileSize
        ) *
        tileSize;

      const maxParcelY =
        Math.ceil(
          (maxWorldZ -
            origin[2]) /
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
       * Keep the selected parcel rendered even when
       * the player is far away from it.
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

    }, [
      parcels,
      camera,
      tileSize,
      origin,
      activeSelectedId,
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
      ]
    );


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