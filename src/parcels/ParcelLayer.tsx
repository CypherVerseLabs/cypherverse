import {
  useCallback,
  useMemo,
  useState,
} from "react";

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
 * PARCEL LAYER
 * =========================================================
 *
 * Physical 3D parcel system.
 *
 * Responsibilities:
 *
 *   - Render parcel tiles
 *   - Track/select a parcel
 *   - Display the selected parcel panel
 *   - Forward marketplace callbacks to ParcelPanel
 *
 * Marketplace business logic remains owned by CypherVerse
 * and useMarketplace().
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
}: ParcelLayerProps) {



  /**
   * =======================================================
   * INTERNAL SELECTION
   * =======================================================
   */

  const [
    internalSelectedId,
    setInternalSelectedId,
  ] = useState<string | null>(
    null
  );


  /**
   * =======================================================
   * ACTIVE SELECTION
   * =======================================================
   *
   * Parent-controlled selection always wins.
   */

  const activeSelectedId =
    selectedParcelId !== undefined
      ? selectedParcelId
      : internalSelectedId;


  /**
   * =======================================================
   * SELECTED PARCEL
   * =======================================================
   */

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
      {/* ===================================================
          PHYSICAL PARCEL WORLD
          =================================================== */}

      <group
        name="parcel-layer"
      >

        {parcels.map(
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


      {/* ===================================================
          SELECTED PARCEL PANEL
          =================================================== */}

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
