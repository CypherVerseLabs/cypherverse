import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  Parcel,
} from "./types";

export interface UseParcelChunksOptions {
  enabled?: boolean;

  chunkSize?: number;

  /**
   * Number of chunks loaded around the current chunk.
   *
   * radius = 1 means a 3x3 grid:
   *
   * [-1,-1] [0,-1] [1,-1]
   * [-1, 0] [0, 0] [1, 0]
   * [-1, 1] [0, 1] [1, 1]
   */
  radius?: number;
}

export interface UseParcelChunksResult {
  parcels: Parcel[];

  loading: boolean;

  error: string | null;

  loadAround: (
    worldX: number,
    worldZ: number
  ) => Promise<void>;

  refresh: () => Promise<void>;
}

interface Chunk {
  x: number;
  y: number;
}

function chunkKey(
  x: number,
  y: number
): string {
  return `${x}:${y}`;
}

function getChunkCoordinate(
  value: number,
  chunkSize: number
): number {
  return Math.floor(
    value / chunkSize
  );
}

export function useParcelChunks(
  options: UseParcelChunksOptions = {}
): UseParcelChunksResult {

  const {
    enabled = true,
    chunkSize = 512,
    radius = 1,
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
   * Chunks that have already been loaded.
   */
  const loadedChunksRef =
    useRef<Set<string>>(
      new Set()
    );

  /**
   * Chunks currently being requested.
   */
  const loadingChunksRef =
    useRef<Set<string>>(
      new Set()
    );

  /**
   * Prevent old requests from updating state
   * after the hook has been disabled/unmounted.
   */
  const mountedRef =
    useRef(true);

  useEffect(() => {

    mountedRef.current = true;

    return () => {

      mountedRef.current = false;

    };

  }, []);

  /**
   * =======================================================
   * LOAD SINGLE CHUNK
   * =======================================================
   */

  const loadChunk =
    useCallback(
      async (
        chunkX: number,
        chunkY: number
      ) => {

        const key =
          chunkKey(
            chunkX,
            chunkY
          );

        if (
          loadedChunksRef.current.has(
            key
          )
        ) {
          return;
        }

        if (
          loadingChunksRef.current.has(
            key
          )
        ) {
          return;
        }

        loadingChunksRef.current.add(
          key
        );

        try {

          const minX =
            chunkX *
            chunkSize;

          const maxX =
            minX +
            chunkSize;

          const minY =
            chunkY *
            chunkSize;

          const maxY =
            minY +
            chunkSize;

          const params =
            new URLSearchParams();

          params.set(
            "minX",
            String(minX)
          );

          params.set(
            "maxX",
            String(maxX)
          );

          params.set(
            "minY",
            String(minY)
          );

          params.set(
            "maxY",
            String(maxY)
          );

          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL ||
            "http://localhost:5000";

          const response =
            await fetch(
              `${apiUrl}/api/parcels?${params.toString()}`,
              {
                credentials:
                  "include",
              }
            );

          if (!response.ok) {

            throw new Error(
              `Failed to load parcel chunk (${response.status})`
            );

          }

          const data =
            await response.json();

          if (
            !data ||
            !Array.isArray(
              data.parcels
            )
          ) {

            throw new Error(
              "Invalid parcel chunk response"
            );

          }

          if (!mountedRef.current) {
            return;
          }

          /**
           * Merge the newly loaded chunk into the
           * existing parcel collection.
           */
          setParcels(
            current => {

              const byId =
                new Map<string, Parcel>();

              for (
                const parcel of current
              ) {

                byId.set(
                  parcel.id,
                  parcel
                );

              }

              for (
                const parcel of data.parcels
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

          loadedChunksRef.current.add(
            key
          );

        } catch (error) {

          if (!mountedRef.current) {
            return;
          }

          console.error(
            "Load parcel chunk error:",
            error
          );

          setError(
            error instanceof Error
              ? error.message
              : "Failed to load parcel chunk"
          );

        } finally {

          loadingChunksRef.current.delete(
            key
          );

        }

      },
      [
        chunkSize,
      ]
    );

  /**
   * =======================================================
   * LOAD AROUND WORLD POSITION
   * =======================================================
   */

  const loadAround =
    useCallback(
      async (
        worldX: number,
        worldZ: number
      ) => {

        if (!enabled) {
          return;
        }

        const centerChunkX =
          getChunkCoordinate(
            worldX,
            chunkSize
          );

        const centerChunkY =
          getChunkCoordinate(
            worldZ,
            chunkSize
          );

        const chunks: Chunk[] = [];

        for (
          let y = -radius;
          y <= radius;
          y++
        ) {

          for (
            let x = -radius;
            x <= radius;
            x++
          ) {

            chunks.push({
              x:
                centerChunkX + x,

              y:
                centerChunkY + y,
            });

          }

        }

        setLoading(true);

        await Promise.all(
          chunks.map(
            chunk =>
              loadChunk(
                chunk.x,
                chunk.y
              )
          )
        );

        if (mountedRef.current) {
          setLoading(false);
        }

      },
      [
        enabled,
        chunkSize,
        radius,
        loadChunk,
      ]
    );

  /**
   * =======================================================
   * INITIAL LOAD
   * =======================================================
   */

  useEffect(() => {

    if (!enabled) {
      return;
    }

    void loadAround(
      0,
      0
    );

  }, [
    enabled,
    loadAround,
  ]);

  /**
   * =======================================================
   * REFRESH
   * =======================================================
   */

  const refresh =
    useCallback(
      async () => {

        loadedChunksRef.current.clear();

        loadingChunksRef.current.clear();

        setParcels([]);

        setError(null);

        await loadAround(
          0,
          0
        );

      },
      [
        loadAround,
      ]
    );

  return {
    parcels,
    loading,
    error,
    loadAround,
    refresh,
  };
}
