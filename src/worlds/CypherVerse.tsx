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

import CypherVerseMapLayer from "./CypherVerseMapLayer";

import {
  CITY_CENTER,
} from "../parcels/parcelCoordinates";

/**
 * =========================================================
 * WORLD CONFIGURATION
 * =========================================================
 */

const CHUNK_SIZE = 512;

/**
 * The player starts at the centered world position:
 *
 *     Three.js: 0, 0
 *
 * which corresponds to database:
 *
 *     2400, 2400
 *
 * The initial 512 × 512 database chunk therefore covers:
 *
 *     2048 → 2560
 *
 * This contains the world center.
 */

const INITIAL_WORLD_MIN =
  CITY_CENTER -
  CHUNK_SIZE / 2;

const INITIAL_WORLD_MAX =
  CITY_CENTER +
  CHUNK_SIZE / 2;

/**
 * =========================================================
 * CYPHERVERSE
 * =========================================================
 */

export default function CypherVerse() {
  /**
   * =======================================================
   * PARCEL DATA
   * =======================================================
   *
   * IMPORTANT:
   *
   * These are DATABASE coordinates.
   *
   * We start around the database world center rather than
   * around database coordinate 0.
   */

  const {
    parcels: fetchedParcels,
    loading,
    error,
    refresh,
    loadChunk,
  } = useParcels({
    enabled: true,

    minX: INITIAL_WORLD_MIN,

    maxX: INITIAL_WORLD_MAX,

    minY: INITIAL_WORLD_MIN,

    maxY: INITIAL_WORLD_MAX,

    chunkSize: CHUNK_SIZE,
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

  useEffect(() => {
    setParcels(
      fetchedParcels,
    );
  }, [fetchedParcels]);

  /**
   * =======================================================
   * SELECTED PARCEL
   * =======================================================
   */

  const [
    selectedParcelId,
    setSelectedParcelId,
  ] = useState<string | null>(
    null,
  );

  const selectedParcel =
    useMemo(
      () =>
        parcels.find(
          (parcel) =>
            parcel.id ===
            selectedParcelId,
        ) ?? null,
      [
        parcels,
        selectedParcelId,
      ],
    );

  const selectedParcelProject =
    selectedParcel?.project ??
    null;

  /**
   * =======================================================
   * LOADED PARCEL PROJECT
   * =======================================================
   */

  const [
    loadedParcelProject,
    setLoadedParcelProject,
  ] = useState<Project | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    setLoadedParcelProject(null);

    const slug =
      selectedParcelProject?.slug ??
      null;

    if (!slug) {
      return () => {
        cancelled = true;
      };
    }

    void fetchPublicProject(slug)
      .then((project) => {
        if (!cancelled) {
          setLoadedParcelProject(
            project,
          );
        }
      })
      .catch((projectError) => {
        if (!cancelled) {
          console.error(
            "Failed to load parcel project scene:",
            projectError,
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
          parcel.id,
        );

        clearAction();
      },
      [clearAction],
    );

  /**
   * =======================================================
   * BUY PARCEL
   * =======================================================
   */

  const handleBuyParcel =
    useCallback(
      async (parcel: Parcel) => {
        if (
          actionParcelId ||
          !parcel?.id
        ) {
          return;
        }

        const result =
          await buyParcel(
            parcel,
          );

        if (!result.success) {
          return;
        }

        await refresh();

        setSelectedParcelId(
          parcel.id,
        );
      },
      [
        actionParcelId,
        buyParcel,
        refresh,
      ],
    );

  /**
   * =======================================================
   * RESERVE PARCEL
   * =======================================================
   */

  const handleReserveParcel =
    useCallback(
      async (parcel: Parcel) => {
        if (actionParcelId) {
          return;
        }

        const result =
          await reserveParcel(
            parcel,
          );

        if (!result.success) {
          return;
        }

        if (result.parcel) {
          setParcels(
            (currentParcels) =>
              currentParcels.map(
                (currentParcel) =>
                  currentParcel.id ===
                  result.parcel!.id
                    ? result.parcel!
                    : currentParcel,
              ),
          );

          setSelectedParcelId(
            result.parcel.id,
          );
        }

        await refresh();
      },
      [
        actionParcelId,
        reserveParcel,
        refresh,
      ],
    );

  /**
   * =======================================================
   * LIST PARCEL
   * =======================================================
   */

  const handleListParcel =
    useCallback(
      async (parcel: Parcel) => {
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
          String(rawPrice).trim();

        if (
          !/^\d+(\.\d{1,2})?$/.test(
            price,
          ) ||
          Number(price) <= 0
        ) {
          return;
        }

        const result =
          await listParcel(
            parcel,
            price,
          );

        if (!result.success) {
          return;
        }

        if (result.parcel) {
          setParcels(
            (currentParcels) =>
              currentParcels.map(
                (currentParcel) =>
                  currentParcel.id ===
                  result.parcel!.id
                    ? result.parcel!
                    : currentParcel,
              ),
          );

          setSelectedParcelId(
            result.parcel.id,
          );
        }

        await refresh();
      },
      [
        actionParcelId,
        listParcel,
        refresh,
      ],
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
   * ERROR
   * =======================================================
   */

  useEffect(() => {
    if (!error) {
      return;
    }

    console.error(
      "CypherVerse parcel loading error:",
      error,
    );
  }, [error]);

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
        (parcel) =>
          parcel.id ===
          selectedParcelId,
      );

    if (!stillLoaded) {
      setSelectedParcelId(null);

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
          frameloop: "demand",
        },
      }}
      playerProps={{
        flying: true,
      }}
    >
      {/* =================================================
          PUBLISHED PROJECT
          ================================================= */}

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

      {/* =================================================
          WORLD ENVIRONMENT
          ================================================= */}

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

      {/* =================================================
          PHYSICAL PARCEL WORLD
          =================================================
          
          Database coordinates are translated into centered
          Three.js coordinates by ParcelLayer through:

              origin = [-2400, 0, -2400]
          */}

      <group position-y={0}>
        <ParcelLayer
          parcels={parcels}
          tileSize={16}
          origin={[
            -CITY_CENTER,
            0,
            -CITY_CENTER,
          ]}
          interactive={true}
          selectedParcelId={
            selectedParcelId
          }
          onParcelSelect={({
            parcel,
          }) => {
            handleParcelSelect(
              parcel,
            );
          }}
          onParcelClose={() => {
            setSelectedParcelId(
              null,
            );
          }}
          onBuy={handleBuyParcel}
          onReserve={
            handleReserveParcel
          }
          onList={handleListParcel}
          actionParcelId={
            actionParcelId
          }
          actionType={
            parcelActionType
          }
          actionError={
            actionError
          }
          onRequestBounds={({
            minX,
            maxX,
            minY,
            maxY,
          }) => {
            void loadChunk(
              minX,
              maxX,
              minY,
              maxY,
            );
          }}
        />

        <CypherVerseMapLayer
          showLabels={true}
        />

        
      </group>

      {/* =================================================
          3D LAND DIRECTORY
          ================================================= */}

      <ParcelDirectory
        parcels={parcels}
        selectedParcelId={
          selectedParcelId
        }
        onSelect={
          handleParcelSelect
        }
        onBuy={handleBuyParcel}
        onReserve={
          handleReserveParcel
        }
        onList={handleListParcel}
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

      {/* =================================================
          WORLD TERRAIN
          ================================================= */}

      <Ground />

      {loading && null}
    </StandardReality>
  );
}