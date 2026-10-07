import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  Parcel,
} from "./types";


/**
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

const DEFAULT_CHUNK_SIZE = 512;


/**
 * =========================================================
 * TYPES
 * =========================================================
 */

export interface UseParcelsOptions {

  enabled?: boolean;

  minX?: number;
  maxX?: number;

  minY?: number;
  maxY?: number;

  chunkSize?: number;
}


export interface UseParcelsResult {

  parcels: Parcel[];

  loading: boolean;

  error: string | null;

  refresh: () => Promise<void>;

  loadChunk: (
    minX: number,
    maxX: number,
    minY: number,
    maxY: number
  ) => Promise<void>;
}


/**
 * =========================================================
 * USE PARCELS
 * =========================================================
 */

export function useParcels(
  options: UseParcelsOptions = {}
): UseParcelsResult {

  const {
    enabled = true,

    minX,
    maxX,

    minY,
    maxY,

    chunkSize =
      DEFAULT_CHUNK_SIZE,

  } = options;


  const [
    parcels,
    setParcels,
  ] = useState<Parcel[]>([]);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState<string | null>(null);


  /**
   * =======================================================
   * LOADED CHUNKS
   * =======================================================
   */

  const loadedChunksRef =
    useRef<Set<string>>(
      new Set()
    );


  /**
   * =======================================================
   * LOADING CHUNKS
   * =======================================================
   */

  const loadingChunksRef =
    useRef<Set<string>>(
      new Set()
    );


  /**
   * =======================================================
   * ABORT CONTROLLERS
   * =======================================================
   */

  const controllersRef =
    useRef<
      Map<
        string,
        AbortController
      >
    >(
      new Map()
    );


  /**
   * =======================================================
   * LOAD CHUNK
   * =======================================================
   */

  const loadChunk =
    useCallback(
      async (
        chunkMinX: number,
        chunkMaxX: number,
        chunkMinY: number,
        chunkMaxY: number
      ) => {

        if (!enabled) {
          return;
        }


        /**
         * Normalize the chunk bounds.
         */

        const normalizedMinX =
          Math.min(
            chunkMinX,
            chunkMaxX
          );


        const normalizedMaxX =
          Math.max(
            chunkMinX,
            chunkMaxX
          );


        const normalizedMinY =
          Math.min(
            chunkMinY,
            chunkMaxY
          );


        const normalizedMaxY =
          Math.max(
            chunkMinY,
            chunkMaxY
          );


        const chunkKey =
          [
            normalizedMinX,
            normalizedMaxX,
            normalizedMinY,
            normalizedMaxY,
          ].join(":");


        /**
         * Already loaded.
         */

        if (
          loadedChunksRef.current.has(
            chunkKey
          )
        ) {

          return;

        }


        /**
         * Already loading.
         */

        if (
          loadingChunksRef.current.has(
            chunkKey
          )
        ) {

          return;

        }


        loadingChunksRef.current.add(
          chunkKey
        );


        const controller =
          new AbortController();


        controllersRef.current.set(
          chunkKey,
          controller
        );


        setLoading(true);
        setError(null);


        try {

          const params =
            new URLSearchParams();


          params.set(
            "minX",
            String(
              normalizedMinX
            )
          );


          params.set(
            "maxX",
            String(
              normalizedMaxX
            )
          );


          params.set(
            "minY",
            String(
              normalizedMinY
            )
          );


          params.set(
            "maxY",
            String(
              normalizedMaxY
            )
          );


          const apiUrl =
            process.env
              .NEXT_PUBLIC_API_URL ||
            "http://localhost:5000";


          const response =
            await fetch(
              `${apiUrl}/api/parcels?${params.toString()}`,
              {
                credentials:
                  "include",

                signal:
                  controller.signal,
              }
            );


          if (!response.ok) {

            throw new Error(
              `Failed to load parcels (${response.status})`
            );

          }


          const data =
            await response.json();


          /**
           * =================================================
           * API RESPONSE
           * =================================================
           *
           * Expected:
           *
           * {
           *   parcels: [...]
           * }
           */

          if (
            !data ||
            !Array.isArray(
              data.parcels
            )
          ) {

            throw new Error(
              "Invalid parcel response"
            );

          }


          const incomingParcels =
            data.parcels as Parcel[];


          /**
           * =================================================
           * MERGE
           * =================================================
           *
           * Never replace the complete world.
           *
           * The newly loaded chunk is merged into the
           * existing parcel collection.
           *
           * Same ID = authoritative newer parcel.
           */

          setParcels(
            currentParcels => {

              const byId =
                new Map<
                  string,
                  Parcel
                >();


              for (
                const parcel
                of currentParcels
              ) {

                byId.set(
                  parcel.id,
                  parcel
                );

              }


              for (
                const parcel
                of incomingParcels
              ) {

                byId.set(
                  parcel.id,
                  parcel
                );

              }


              return Array.from(
                byId.values()
              );

            }
          );


          /**
           * Mark chunk as successfully loaded only
           * after the request succeeded.
           */

          loadedChunksRef.current.add(
            chunkKey
          );

        } catch (requestError) {

          if (
            requestError instanceof
              DOMException &&
            requestError.name ===
              "AbortError"
          ) {

            return;

          }


          console.error(
            "Load parcel chunk error:",
            requestError
          );


          setError(
            requestError instanceof Error
              ? requestError.message
              : "Failed to load parcels"
          );

        } finally {

          loadingChunksRef.current.delete(
            chunkKey
          );


          controllersRef.current.delete(
            chunkKey
          );


          setLoading(
            loadingChunksRef.current.size >
              0
          );

        }

      },
      [
        enabled,
      ]
    );


  /**
   * =======================================================
   * REFRESH
   * =======================================================
   *
   * Completely resets the streamed world.
   *
   * Use this when:
   *
   * - the world needs a full reload
   * - the user changes world
   * - the initial bounds change
   *
   * Do NOT use this merely because a marketplace action
   * completed.
   */

  const refresh =
    useCallback(
      async () => {

        if (!enabled) {
          return;
        }


        /**
         * Cancel active requests.
         */

        for (
          const controller
          of controllersRef
            .current
            .values()
        ) {

          controller.abort();

        }


        controllersRef.current.clear();

        loadingChunksRef.current.clear();


        /**
         * Reset streamed state.
         */

        loadedChunksRef.current.clear();

        setParcels([]);

        setError(null);


        const startMinX =
          minX ??
          0;


        const startMaxX =
          maxX ??
          (
            startMinX +
            chunkSize
          );


        const startMinY =
          minY ??
          0;


        const startMaxY =
          maxY ??
          (
            startMinY +
            chunkSize
          );


        await loadChunk(
          startMinX,
          startMaxX,
          startMinY,
          startMaxY
        );

      },
      [
        enabled,
        minX,
        maxX,
        minY,
        maxY,
        chunkSize,
        loadChunk,
      ]
    );


  /**
   * =======================================================
   * INITIAL LOAD
   * =======================================================
   */

  useEffect(() => {

    void refresh();


    return () => {

      for (
        const controller
        of controllersRef
          .current
          .values()
      ) {

        controller.abort();

      }


      controllersRef.current.clear();

      loadingChunksRef.current.clear();

    };

  }, [
    refresh,
  ]);


  /**
   * =======================================================
   * RETURN
   * =======================================================
   */

  return {
    parcels,
    loading,
    error,
    refresh,
    loadChunk,
  };
}