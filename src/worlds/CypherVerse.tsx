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
  EditorProvider,
} from "../editor/context/EditorContext";

import Scene from "../editor/scene/Scene";

import {
  fetchPublicProject,
} from "../projects/useProjects";

import type {
  Project,
} from "../projects/useProjects";

import {
  useMarketplace,
} from "../marketplace";

import LandmarkLayer from "./LandmarkLayer";


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
 */

const WORLD_BOUNDS: WorldBounds = {
  minX: 0,
  maxX: 2384,
  minY: 0,
  maxY: 2384,
};


/**
 * =========================================================
 * CYPHERVERSE
 * =========================================================
 */

export default function CypherVerse() {

  /**
   * =======================================================
   * WORLD BOUNDS
   * =======================================================
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
   */

  const [
    parcels,
    setParcels,
  ] = useState<Parcel[]>([]);


  /**
   * =======================================================
   * SYNC SERVER PARCELS
   * =======================================================
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


  const selectedParcel =
    useMemo(
      () =>
        parcels.find(
          parcel =>
            parcel.id ===
            selectedParcelId
        ) ?? null,
      [
        parcels,
        selectedParcelId,
      ]
    );


  const selectedParcelProject =
    selectedParcel?.project ?? null;


  /**
   * =======================================================
   * LOADED PARCEL PROJECT
   * =======================================================
   */

  const [
    loadedParcelProject,
    setLoadedParcelProject,
  ] = useState<Project | null>(
    null
  );


  useEffect(() => {

    let cancelled = false;

    setLoadedParcelProject(
      null
    );


    const slug =
      selectedParcelProject?.slug ??
      null;


    if (!slug) {

      return () => {

        cancelled = true;

      };

    }


    void fetchPublicProject(
      slug
    )
      .then((project) => {

        if (!cancelled) {

          setLoadedParcelProject(
            project
          );

        }

      })
      .catch((error) => {

        if (!cancelled) {

          console.error(
            "Failed to load parcel project scene:",
            error
          );

        }

      });


    return () => {

      cancelled = true;

    };

  }, [
    selectedParcelProject?.slug,
  ]);


  /**
   * =======================================================
   * MARKETPLACE
   * =======================================================
   *
   * The hook owns the complete purchase operation:
   *
   *   buyParcel(parcel)
   *       ↓
   *   createOrder()
   *       ↓
   *   createPayment()
   *       ↓
   *   confirmTestPayment()
   *
   * CypherVerse only consumes the higher-level operation.
   *
   * marketplace.ts remains responsible for individual
   * API calls.
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
      (
        parcel: Parcel
      ) => {

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
   * BUY PARCEL
   * =======================================================
   *
   * IMPORTANT:
   *
   * Do NOT create the order/payment here.
   *
   * useMarketplace().buyParcel() is the higher-level
   * marketplace operation.
   */

  const handleBuyParcel =
    useCallback(
      async (
        parcel: Parcel
      ) => {

        if (actionParcelId) {

          return;

        }


        if (!parcel?.id) {

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
         * Reload authoritative parcel state after the
         * backend completes the purchase.
         */

        await refresh();


        /**
         * Keep the purchased parcel selected.
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


        /**
         * Update the selected parcel from the backend
         * response when available.
         */

        if (result.parcel) {

          setParcels(
            currentParcels =>
              currentParcels.map(
                currentParcel =>
                  currentParcel.id ===
                  result.parcel!.id
                    ? result.parcel!
                    : currentParcel
              )
          );


          setSelectedParcelId(
            result.parcel.id
          );

        }


        /**
         * Reload authoritative bounded state.
         */

        await refresh();

      },
      [
        actionParcelId,
        reserveParcel,
        refresh,
      ]
    );


  /**
   * =======================================================
   * LIST PARCEL
   * =======================================================
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
         * Client-side validation prevents obviously invalid
         * requests. The backend remains authoritative.
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


        /**
         * Update visible state immediately when the backend
         * returns the updated parcel.
         */

        if (result.parcel) {

          setParcels(
            currentParcels =>
              currentParcels.map(
                currentParcel =>
                  currentParcel.id ===
                  result.parcel!.id
                    ? result.parcel!
                    : currentParcel
              )
          );


          setSelectedParcelId(
            result.parcel.id
          );

        }


        /**
         * Reload authoritative bounded state.
         */

        await refresh();

      },
      [
        actionParcelId,
        listParcel,
        refresh,
      ]
    );


  /**
   * =======================================================
   * PARCEL ACTION TYPE
   * =======================================================
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
          PUBLISHED PROJECT ON SELECTED PARCEL
          =================================================== */}

      {loadedParcelProject?.scene && (
        <EditorProvider
          initialScene={
            loadedParcelProject.scene
          }
          editorActive={false}
        >
          <Scene />
        </EditorProvider>
      )}


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

        <ParcelLayer
          parcels={parcels}
          tileSize={16}
          origin={[
            0,
            0,
            0,
          ]}
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

            setSelectedParcelId(
              null
            );

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


        <ParcelLayer
          parcels={parcels}
          tileSize={16}
          origin={[
            0,
            0,
            0,
          ]}
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

            setSelectedParcelId(
              null
            );

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


        <LandmarkLayer
          parcels={parcels}
          tileSize={16}
          origin={[
            0,
            0,
            0,
          ]}
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
          =================================================== */}

      {loading && null}

    </StandardReality>
  );
}
