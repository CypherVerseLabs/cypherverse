import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  StandardReality,
  LostWorld,
  Fog,
} from "cyengine";

import CloudySky from "ideas/CloudySky";
import Ground from "ideas/Ground";

import ParcelLayer from "../parcels/ParcelLayer";
import ParcelDirectory from "../parcels/ParcelDirectory";

import {
  useParcels,
} from "../parcels/useParcels";

import type {
  Parcel,
} from "../parcels/types";

import {
  useMarketplace,
} from "../marketplace";


/**
 * =========================================================
 * TYPES
 * =========================================================
 */

interface WorldBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}


/**
 * =========================================================
 * WORLD CONFIGURATION
 * =========================================================
 *
 * These bounds define the initial parcel region loaded from
 * the backend.
 *
 * IMPORTANT:
 *
 * The backend /api/parcels endpoint now accepts:
 *
 *   minX
 *   maxX
 *   minY
 *   maxY
 *
 * so only parcels inside this region are requested.
 *
 * Change these values as the playable world expands.
 */

const WORLD_BOUNDS: WorldBounds = {
  minX: -50,
  maxX: 50,
  minY: -50,
  maxY: 50,
};


/**
 * =========================================================
 * CYPHERVERSE
 * =========================================================
 *
 * Parent owner of the parcel world.
 *
 * Responsibilities:
 *
 *   - Load parcels for the current world bounds
 *   - Track selected parcel
 *   - Run marketplace actions
 *   - Update visible parcel state immediately
 *   - Keep ParcelLayer and ParcelDirectory synchronized
 *
 * Architecture:
 *
 *   useParcels(bounds)
 *        ↓
 *   CypherVerse
 *        ↓
 *   ParcelLayer / ParcelDirectory
 *
 *   useMarketplace()
 *        ↓
 *   marketplace service
 *        ↓
 *   authenticated API
 *
 * =========================================================
 */

export default function CypherVerse() {

  /**
   * =======================================================
   * WORLD BOUNDS
   * =======================================================
   *
   * Memoized so the object identity remains stable.
   *
   * This prevents useParcels() from unnecessarily reloading
   * because of a newly-created options object on every render.
   */

  const worldBounds =
    useMemo<WorldBounds>(
      () => WORLD_BOUNDS,
      []
    );


  /**
   * =======================================================
   * PARCEL DATA
   * =======================================================
   *
   * Only parcels inside the configured bounds are requested.
   */

  const {
    parcels: fetchedParcels,
    loading,
    error,
    refresh,
  } = useParcels({
    enabled: true,

    minX:
      worldBounds.minX,

    maxX:
      worldBounds.maxX,

    minY:
      worldBounds.minY,

    maxY:
      worldBounds.maxY,
  });


  /**
   * =======================================================
   * DISPLAYED PARCELS
   * =======================================================
   *
   * Local displayed state allows successful marketplace
   * operations to update the world immediately.
   *
   * The backend remains authoritative.
   */

  const [
    parcels,
    setParcels,
  ] = useState<Parcel[]>([]);


  /**
   * =======================================================
   * SYNC SERVER PARCELS
   * =======================================================
   *
   * Whenever useParcels() receives a new bounded result,
   * replace the displayed parcel collection.
   */

  useEffect(() => {
    setParcels(
      fetchedParcels
    );
  }, [
    fetchedParcels,
  ]);


  /**
   * =======================================================
   * SELECTED PARCEL
   * =======================================================
   */

  const [
    selectedParcelId,
    setSelectedParcelId,
  ] = useState<string | null>(
    null
  );


  /**
   * =======================================================
   * MARKETPLACE
   * =======================================================
   */

  const {
    actionParcelId,
    actionType,
    actionError,

    buyParcel,
    reserveParcel,
    listParcel,

    clearAction,
  } = useMarketplace();


  /**
   * =======================================================
   * SELECT PARCEL
   * =======================================================
   */

  const handleParcelSelect =
    useCallback(
      (parcel: Parcel) => {

        setSelectedParcelId(
          parcel.id
        );

        clearAction();
      },
      [
        clearAction,
      ]
    );


  /**
   * =======================================================
   * UPDATE DISPLAYED PARCEL
   * =======================================================
   *
   * Updates the local parcel immediately after a successful
   * marketplace operation.
   *
   * The next refresh() then replaces it with authoritative
   * backend state.
   */

  const updateDisplayedParcel =
    useCallback(
      (
        updatedParcel: Parcel
      ) => {

        setParcels(
          currentParcels =>
            currentParcels.map(
              parcel =>
                parcel.id ===
                updatedParcel.id
                  ? updatedParcel
                  : parcel
            )
        );
      },
      []
    );


    /**
   * =======================================================
   * BUY PARCEL
   * =======================================================
   *
   * buyParcel() performs the complete TEST purchase flow:
   *
   *   order
   *      ↓
   *   payment
   *      ↓
   *   test confirmation
   *      ↓
   *   backend purchase completion
   *
   * Ownership remains backend-authoritative.
   */

  const handleBuyParcel =
    useCallback(
      async (
        parcel: Parcel
      ) => {

        if (actionParcelId) {
          return;
        }


        const result =
          await buyParcel(
            parcel
          );


        if (!result.success) {
          return;
        }


        /**
         * The backend has completed the purchase.
         *
         * Do not manually mutate ownership here.
         *
         * Reload the bounded parcel collection so the
         * displayed world reflects authoritative backend
         * state.
         */

        await refresh();


        /**
         * Keep the purchased parcel selected if it still
         * exists in the refreshed world.
         */

        setSelectedParcelId(
          parcel.id
        );

      },
      [
        actionParcelId,
        buyParcel,
        refresh,
      ]
    );




  /**
   * =======================================================
   * RESERVE PARCEL
   * =======================================================
   */

  const handleReserveParcel =
    useCallback(
      async (
        parcel: Parcel
      ) => {

        if (actionParcelId) {
          return;
        }


        const result =
          await reserveParcel(
            parcel
          );


        if (!result.success) {
          return;
        }


        if (!result.parcel) {
          return;
        }


        /**
         * Immediately update the visible parcel.
         */

        updateDisplayedParcel(
          result.parcel
        );


        setSelectedParcelId(
          result.parcel.id
        );


        /**
         * Reload authoritative bounded state.
         */

        await refresh();

      },
      [
        actionParcelId,
        reserveParcel,
        refresh,
        updateDisplayedParcel,
      ]
    );


  /**
   * =======================================================
   * LIST PARCEL
   * =======================================================
   *
   * useMarketplace().listParcel() expects the price as a
   * decimal string.
   *
   * Parcel.price may arrive as:
   *
   *   string
   *   number
   *   null
   *   undefined
   *
   * Normalize it before passing it to the marketplace hook.
   */

  const handleListParcel =
    useCallback(
      async (
        parcel: Parcel
      ) => {

        if (actionParcelId) {
          return;
        }


        const rawPrice =
          parcel.price;


        if (
          rawPrice === null ||
          rawPrice === undefined
        ) {
          return;
        }


        const price =
          String(
            rawPrice
          ).trim();


        /**
         * Backend remains authoritative, but validate
         * locally so obviously invalid requests never leave
         * the browser.
         */

        if (
          !/^\d+(\.\d{1,2})?$/.test(
            price
          ) ||
          Number(price) <= 0
        ) {
          return;
        }


        const result =
          await listParcel(
            parcel,
            price
          );


        if (!result.success) {
          return;
        }


        if (!result.parcel) {
          return;
        }


        /**
         * Immediately update visible state.
         */

        updateDisplayedParcel(
          result.parcel
        );


        setSelectedParcelId(
          result.parcel.id
        );


        /**
         * Reload authoritative bounded state.
         */

        await refresh();

      },
      [
        actionParcelId,
        listParcel,
        refresh,
        updateDisplayedParcel,
      ]
    );


  /**
   * =======================================================
   * PARCEL ACTION TYPE
   * =======================================================
   *
   * Only the actions supported by ParcelLayer and
   * ParcelDirectory are passed through.
   */

  const parcelActionType =
    actionType === "buy" ||
    actionType === "reserve" ||
    actionType === "list"
      ? actionType
      : null;


  /**
   * =======================================================
   * PARCEL API ERROR
   * =======================================================
   */

  useEffect(() => {

    if (!error) {
      return;
    }


    console.error(
      "CypherVerse parcel loading error:",
      error
    );

  }, [
    error,
  ]);


  /**
   * =======================================================
   * CLEAR INVALID SELECTION
   * =======================================================
   *
   * If a bounded reload no longer contains the selected
   * parcel, clear the selection.
   *
   * This matters later when the world uses dynamically
   * changing bounds.
   */

  useEffect(() => {

    if (!selectedParcelId) {
      return;
    }


    const stillLoaded =
      parcels.some(
        parcel =>
          parcel.id ===
          selectedParcelId
      );


    if (!stillLoaded) {
      setSelectedParcelId(
        null
      );

      clearAction();
    }

  }, [
    parcels,
    selectedParcelId,
    clearAction,
  ]);


  /**
   * =======================================================
   * WORLD
   * =======================================================
   */

  return (
    <StandardReality

      environmentProps={{
        dev:
          process.env.NODE_ENV ===
          "development",

        canvasProps: {
          frameloop:
            "demand",
        },
      }}

      playerProps={{
        flying: false,
      }}

    >

      {/* ===================================================
          WORLD
          =================================================== */}

      <LostWorld />


      <CloudySky

        position={[
          0,
          0,
          0,
        ]}

        colors={[
          0.7,
          0.85,
          1,

          0.4,
          0.65,
          0.9,

          0.2,
          0.45,
          0.7,

          0.1,
          0.2,
          0.5,
        ]}

      />


      <Fog
        color="#6f766f"
        near={100}
        far={1000}
      />


      <ambientLight />


      {/* ===================================================
          PHYSICAL PARCEL WORLD
          =================================================== */}
<group position-y={-0.0}>

          {/* WORLD NAME */}
        
        
      <ParcelLayer
  parcels={parcels}
  tileSize={16}
  origin={[0, 0, 0]}
  interactive={true}

  selectedParcelId={
    selectedParcelId
  }

  onParcelSelect={({
    parcel,
  }) => {
    handleParcelSelect(
      parcel
    );
  }}

  onParcelClose={() => {
    setSelectedParcelId(null);
  }}

  onBuy={
    handleBuyParcel
  }

  onReserve={
    handleReserveParcel
  }

  onList={
    handleListParcel
  }

  actionParcelId={
    actionParcelId
  }

  actionType={
    parcelActionType
  }

  actionError={
    actionError
  }
/>
</group>


      {/* ===================================================
          3D LAND DIRECTORY
          =================================================== */}

      <ParcelDirectory

        parcels={
          parcels
        }

        selectedParcelId={
          selectedParcelId
        }

        onSelect={
          handleParcelSelect
        }

        onBuy={
          handleBuyParcel
        }

        onReserve={
          handleReserveParcel
        }

        onList={
          handleListParcel
        }

        actionParcelId={
          actionParcelId
        }

        actionType={
          parcelActionType
        }

        actionError={
          actionError
        }

      />


      {/* ===================================================
          WORLD TERRAIN
          =================================================== */}

      <Ground />


      {/* ===================================================
          LOADING
          ===================================================
          
          Loading state is intentionally silent here.
          ParcelLayer/Directory can continue rendering the
          previous state while a refresh is in progress.
          =================================================== */}

      {loading && null}

    </StandardReality>
  );
}