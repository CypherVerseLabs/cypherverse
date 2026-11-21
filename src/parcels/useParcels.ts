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
 * CONFIGURATION
 * =========================================================
 */

const DEFAULT_CHUNK_SIZE = 512;

const DEFAULT_API_URL = "http://localhost:5000";

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

interface ParcelApiResponse {
  parcels: Parcel[];
  count?: number;
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
    chunkSize = DEFAULT_CHUNK_SIZE,
  } = options;

  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Successfully loaded chunks.
   */
  const loadedChunksRef = useRef<Set<string>>(
    new Set()
  );

  /**
   * Requests currently in progress.
   *
   * Store their promises so simultaneous requests for the
   * same chunk can await the same operation.
   */
  const loadingChunksRef = useRef<
    Map<string, Promise<void>>
  >(new Map());

  /**
   * Abort controllers for active requests.
   */
  const controllersRef = useRef<
    Map<string, AbortController>
  >(new Map());

  /**
   * Prevent requests from an older full refresh from
   * updating the current world.
   */
  const generationRef = useRef(0);

  /**
   * Track mounted state for safe asynchronous updates.
   */
  const mountedRef = useRef(false);

  /**
   * =======================================================
   * MERGE PARCELS
   * =======================================================
   *
   * Keep one entry per parcel ID.
   * Incoming data replaces older data for the same parcel.
   */

  const mergeParcels = useCallback(
    (incomingParcels: Parcel[]) => {
      setParcels((currentParcels) => {
        const byId = new Map<string, Parcel>();

        for (const parcel of currentParcels) {
          byId.set(parcel.id, parcel);
        }

        for (const parcel of incomingParcels) {
          byId.set(parcel.id, parcel);
        }

        return Array.from(byId.values());
      });
    },
    []
  );

  /**
   * =======================================================
   * LOAD CHUNK
   * =======================================================
   */

  const loadChunk = useCallback(
    async (
      requestedMinX: number,
      requestedMaxX: number,
      requestedMinY: number,
      requestedMaxY: number
    ): Promise<void> => {
      if (!enabled || !mountedRef.current) {
        return;
      }

      /**
       * Normalize bounds.
       */
      const normalizedMinX = Math.min(
        requestedMinX,
        requestedMaxX
      );

      const normalizedMaxX = Math.max(
        requestedMinX,
        requestedMaxX
      );

      const normalizedMinY = Math.min(
        requestedMinY,
        requestedMaxY
      );

      const normalizedMaxY = Math.max(
        requestedMinY,
        requestedMaxY
      );

      /**
       * Use exact bounds as the cache key.
       *
       * Callers should request consistent chunk boundaries.
       */
      const chunkKey = [
        normalizedMinX,
        normalizedMaxX,
        normalizedMinY,
        normalizedMaxY,
      ].join(":");

      /**
       * Do not reload a successfully loaded chunk.
       */
      if (loadedChunksRef.current.has(chunkKey)) {
        return;
      }

      /**
       * Reuse an in-flight request for this chunk.
       */
      const existingRequest =
        loadingChunksRef.current.get(chunkKey);

      if (existingRequest) {
        return existingRequest;
      }

      const generation = generationRef.current;
      const controller = new AbortController();

      controllersRef.current.set(
        chunkKey,
        controller
      );

      setLoading(true);
      setError(null);

      const request = (async () => {
        try {
          const params = new URLSearchParams({
            minX: String(normalizedMinX),
            maxX: String(normalizedMaxX),
            minY: String(normalizedMinY),
            maxY: String(normalizedMaxY),
          });

          const configuredApiUrl =
            process.env.NEXT_PUBLIC_API_URL ||
            DEFAULT_API_URL;

          const apiUrl = configuredApiUrl.replace(
            /\/+$/,
            ""
          );

          const response = await fetch(
            `${apiUrl}/api/parcels?${params.toString()}`,
            {
              credentials: "include",
              signal: controller.signal,
              headers: {
                Accept: "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error(
              `Failed to load parcel chunk (${response.status})`
            );
          }

          const data =
            (await response.json()) as ParcelApiResponse;

          if (
            !data ||
            !Array.isArray(data.parcels)
          ) {
            throw new Error(
              "Invalid parcel API response: expected a parcels array"
            );
          }

          /**
           * Ignore results belonging to an outdated refresh
           * or a component that has already unmounted.
           */
          if (
            !mountedRef.current ||
            generation !== generationRef.current
          ) {
            return;
          }

          /**
           * Merge instead of replacing the entire world.
           */
          mergeParcels(data.parcels);

          /**
           * Mark the chunk loaded only after success.
           */
          loadedChunksRef.current.add(chunkKey);
        } catch (requestError) {
          if (
            requestError instanceof Error &&
            requestError.name === "AbortError"
          ) {
            return;
          }

          if (
            mountedRef.current &&
            generation === generationRef.current
          ) {
            const message =
              requestError instanceof Error
                ? requestError.message
                : "Failed to load parcels";

            console.error(
              "Load parcel chunk error:",
              requestError
            );

            setError(message);
          }
        } finally {
          /**
           * Only remove this request's bookkeeping.
           */
          loadingChunksRef.current.delete(chunkKey);

          if (
            controllersRef.current.get(chunkKey) ===
            controller
          ) {
            controllersRef.current.delete(chunkKey);
          }

          if (
            mountedRef.current &&
            generation === generationRef.current
          ) {
            setLoading(
              loadingChunksRef.current.size > 0
            );
          }
        }
      })();

      loadingChunksRef.current.set(
        chunkKey,
        request
      );

      return request;
    },
    [
      enabled,
      mergeParcels,
    ]
  );

  /**
   * =======================================================
   * REFRESH
   * =======================================================
   *
   * Performs a full world-data reset and loads the initial
   * bounds. Do not use refresh for ordinary marketplace
   * updates because it clears the currently loaded world.
   */

  const refresh = useCallback(
    async (): Promise<void> => {
      if (!enabled || !mountedRef.current) {
        return;
      }

      /**
       * Invalidate older requests before aborting them.
       */
      generationRef.current += 1;

      for (const controller of controllersRef.current.values()) {
        controller.abort();
      }

      controllersRef.current.clear();
      loadingChunksRef.current.clear();
      loadedChunksRef.current.clear();

      setParcels([]);
      setError(null);
      setLoading(false);

      const startMinX = minX ?? 0;
      const startMaxX =
        maxX ?? startMinX + chunkSize;

      const startMinY = minY ?? 0;
      const startMaxY =
        maxY ?? startMinY + chunkSize;

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
   * MOUNT / INITIAL LOAD / CLEANUP
   * =======================================================
   */

  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      void refresh();
    }

    return () => {
      mountedRef.current = false;

      /**
       * Invalidate outstanding responses.
       */
      generationRef.current += 1;

      for (const controller of controllersRef.current.values()) {
        controller.abort();
      }

      controllersRef.current.clear();
      loadingChunksRef.current.clear();
      loadedChunksRef.current.clear();
    };
  }, [
    enabled,
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