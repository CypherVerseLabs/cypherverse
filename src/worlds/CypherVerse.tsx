import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  StandardReality,
  LostWorld,
  Fog,
} from "cyengine";

import {
  useFrame,
  useThree,
} from "@react-three/fiber";

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
import WorldInfrastructure from "parcels/WorldInfrastructure";


/**
 * =========================================================
 * WORLD CONFIGURATION
 * =========================================================
 */

const CHUNK_SIZE = 512;


/**
 * =========================================================
 * CHUNK STREAMER
 * =========================================================
 *
 * This component must live inside StandardReality because
 * useThree/useFrame require the React Three Fiber context.
 *
 * It watches the player camera and asks useParcels() to load
 * the chunk containing the player.
 *
 * =========================================================
 */

interface ParcelChunkStreamerProps {
  loadChunk: (
    minX: number,
    maxX: number,
    minY: number,
    maxY: number
  ) => void | Promise<void>;
}


function ParcelChunkStreamer({
  loadChunk,
}: ParcelChunkStreamerProps) {

  const camera =
    useThree(
      (state) =>
        state.camera
    );


  const lastChunkRef =
    useRef<string | null>(
      null
    );


  const lastLoadRef =
    useRef(0);


  useFrame(() => {

    const now =
      performance.now();


    /**
     * Avoid repeatedly checking/loading chunks every frame.
     */

    if (
      now -
        lastLoadRef.current <
      150
    ) {
      return;
    }


    lastLoadRef.current =
      now;


    const worldX =
      camera.position.x;


    const worldZ =
      camera.position.z;


    const chunkX =
      Math.floor(
        worldX /
        CHUNK_SIZE
      );


    const chunkY =
      Math.floor(
        worldZ /
        CHUNK_SIZE
      );


    const minX =
      chunkX *
      CHUNK_SIZE;


    const maxX =
      minX +
      CHUNK_SIZE;


    const minY =
      chunkY *
      CHUNK_SIZE;


    const maxY =
      minY +
      CHUNK_SIZE;


    const chunkKey =
      `${chunkX}:${chunkY}`;


    if (
      lastChunkRef.current ===
      chunkKey
    ) {
      return;
    }


    lastChunkRef.current =
      chunkKey;


    void loadChunk(
      minX,
      maxX,
      minY,
      maxY
    );

  });


  return null;
}


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
   */

  const {
  parcels: fetchedParcels,
  loading,
  error,
  refresh,
  loadChunk,
} = useParcels({


    enabled: true,

    /**
     * Initial world chunk.
     *
     * The chunk streamer will load additional chunks when
     * the player moves into them.
     */

    minX: 0,
    maxX: CHUNK_SIZE,
    minY: 0,
    maxY: CHUNK_SIZE,

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
      .then(
        (project) => {

          if (!cancelled) {

            setLoadedParcelProject(
              project
            );

          }

        }
      )
      .catch(
        (projectError) => {

          if (!cancelled) {

            console.error(
              "Failed to load parcel project scene:",
              projectError
            );

          }

        }
      );


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


        await refresh();


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
   * ERROR
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
          CAMERA CHUNK STREAMER
          =================================================== */}

      <ParcelChunkStreamer
        loadChunk={
          loadChunk
        }
      />


      {/* ===================================================
          PUBLISHED PROJECT
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

      <group
        position-y={0}
      >

        <group position-y={0}>

  <WorldInfrastructure
    parcels={parcels}
    tileSize={16}
    origin={[
      0,
      0,
      0,
    ]}
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


        <ParcelLayer

          parcels={
            parcels
          }

          tileSize={
            16
          }

          origin={[
            0,
            0,
            0,
          ]}

          interactive={
            true
          }

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

          parcels={
            parcels
          }

          tileSize={
            16
          }

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