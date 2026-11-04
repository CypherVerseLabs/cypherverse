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
 * USE PARCELS
 * =========================================================
 *
 * Loads parcel data from:
 *
 *     GET /api/parcels
 *
 * Supports optional coordinate bounds so large worlds
 * do not need to load every parcel at once.
 *
 * Example:
 *
 *     useParcels({
 *       minX: -50,
 *       maxX: 50,
 *       minY: -50,
 *       maxY: 50,
 *     });
 *
 * This will be important for CypherVerse, where the
 * world may eventually contain a very large number of
 * parcels.
 */

export interface UseParcelsOptions {
  enabled?: boolean;

  minX?: number;
  maxX?: number;

  minY?: number;
  maxY?: number;
}

export interface UseParcelsResult {
  parcels: Parcel[];

  loading: boolean;

  error: string | null;

  refresh: () => Promise<void>;
}

export function useParcels(
  options: UseParcelsOptions = {}
): UseParcelsResult {
  const {
    enabled = true,
    minX,
    maxX,
    minY,
    maxY,
  } = options;

  const [parcels, setParcels] =
    useState<Parcel[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /**
   * Track the current request so an older request
   * cannot overwrite a newer one.
   */
  const abortControllerRef =
    useRef<AbortController | null>(
      null
    );

  const refresh =
    useCallback(async () => {
      if (!enabled) {
        return;
      }

      /**
       * Cancel any previous request.
       */
      abortControllerRef.current?.abort();

      const controller =
        new AbortController();

      abortControllerRef.current =
        controller;

      try {
        setLoading(true);
        setError(null);

        const params =
          new URLSearchParams();

        if (minX !== undefined) {
          params.set(
            "minX",
            String(minX)
          );
        }

        if (maxX !== undefined) {
          params.set(
            "maxX",
            String(maxX)
          );
        }

        if (minY !== undefined) {
          params.set(
            "minY",
            String(minY)
          );
        }

        if (maxY !== undefined) {
          params.set(
            "maxY",
            String(maxY)
          );
        }

        const query =
          params.toString();

        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
         "http://localhost:5000";

        const response =
          await fetch(
            `${apiUrl}/api/parcels${
              query
                ? `?${query}`
                : ""
            }`,
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

        setParcels(
          data.parcels
        );
      } catch (error) {
        /**
         * Abort errors are expected when a newer
         * request replaces the current request.
         */
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        console.error(
          "Load parcels error:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load parcels"
        );
      } finally {
        /**
         * Only the current request should change
         * the loading state.
         */
        if (
          !controller.signal.aborted
        ) {
          setLoading(false);
        }
      }
    }, [
      enabled,
      minX,
      maxX,
      minY,
      maxY,
    ]);

  useEffect(() => {
    void refresh();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [refresh]);

  return {
    parcels,
    loading,
    error,
    refresh,
  };
}
