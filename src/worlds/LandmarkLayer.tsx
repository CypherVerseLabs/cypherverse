import { useMemo } from "react";
import { Text } from "@react-three/drei";

import type { Parcel } from "../parcels/types";

import {
  landmarkToWorldPosition,
} from "../parcels/parcelCoordinates";

import { CITY_LANDMARKS } from "./CityLandmarks";

interface LandmarkLayerProps {
  parcels: Parcel[];
  tileSize?: number;
  origin?: [number, number, number];
}

/**
 * =========================================================
 * LANDMARK LAYER
 * =========================================================
 *
 * Displays the 45 configured CypherVerse landmarks.
 *
 * COORDINATES
 *
 * Landmark coordinates are offsets from Genesis.
 * landmarkToWorldPosition() converts those offsets into
 * the existing positive-world coordinate system.
 *
 * Genesis (0, 0) maps to (1192, 1192) when using the
 * existing 150 x 150 grid with 16-unit parcel spacing.
 *
 * SAFETY
 *
 * - Does not create database parcels.
 * - Does not modify parcel coordinates.
 * - Does not reserve or purchase land.
 * - Does not change parcel ownership.
 * - Does not execute marketplace actions.
 * - Does not assume every landmark has a parcel record.
 * =========================================================
 */

export default function LandmarkLayer({
  parcels = [],
  tileSize: _tileSize = 16,
  origin = [0, 0, 0],
}: LandmarkLayerProps) {
  /**
   * Resolve landmark world positions.
   *
   * Match an existing parcel only when its database
   * coordinates exactly match the landmark's world
   * position. A missing match does not create a parcel.
   */
  const resolvedLandmarks = useMemo(() => {
    return CITY_LANDMARKS.map((landmark) => {
      const [worldX, , worldZ] =
        landmarkToWorldPosition(
          landmark.x,
          landmark.y,
          origin,
        );

      const parcel = parcels.find(
        (candidate) =>
          candidate.x === worldX &&
          candidate.y === worldZ,
      ) ?? null;

      return {
        landmark,
        parcel,
        worldX,
        worldZ,
      };
    });
  }, [parcels, origin]);

  return (
    <group name="city-landmarks">
      {resolvedLandmarks.map(
        ({ landmark, parcel, worldX, worldZ }) => {
          const isGenesis =
            landmark.estateId === "landmark-genesis";

          const height = isGenesis ? 10 : 6;

          return (
            <group
              key={landmark.estateId}
              position={[
                worldX,
                origin[1],
                worldZ,
              ]}
            >
              {/* Landmark base */}
              <mesh
                position={[0, 0.35, 0]}
                raycast={() => null}
              >
                <cylinderGeometry
                  args={[2.5, 2.5, 0.7, 32]}
                />

                <meshStandardMaterial
                  color={
                    isGenesis
                      ? "#ffd166"
                      : "#38bdf8"
                  }
                  emissive={
                    isGenesis
                      ? "#ff9f1c"
                      : "#0369a1"
                  }
                  emissiveIntensity={1.5}
                />
              </mesh>

              {/* Landmark beacon */}
              <mesh
                position={[0, height / 2, 0]}
                raycast={() => null}
              >
                <cylinderGeometry
                  args={[0.35, 0.8, height, 16]}
                />

                <meshStandardMaterial
                  color={
                    isGenesis
                      ? "#fff3b0"
                      : "#7dd3fc"
                  }
                  emissive={
                    isGenesis
                      ? "#f59e0b"
                      : "#0ea5e9"
                  }
                  emissiveIntensity={2}
                />
              </mesh>

              {/* Landmark light */}
              <pointLight
                position={[0, height, 0]}
                color={
                  isGenesis
                    ? "#ffd166"
                    : "#38bdf8"
                }
                intensity={isGenesis ? 25 : 10}
                distance={40}
              />

              {/* Landmark name */}
              <Text
                position={[0, height + 2, 0]}
                fontSize={isGenesis ? 2 : 1.5}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.08}
                outlineColor="#000000"
                raycast={() => null}
              >
                {landmark.name}
              </Text>

              {/* Existing parcel reference, if available */}
              {parcel && (
                <Text
                  position={[0, height + 0.5, 0]}
                  fontSize={0.45}
                  color="#a5f3fc"
                  anchorX="center"
                  anchorY="middle"
                  raycast={() => null}
                >
                  {`Parcel ${parcel.id}`}
                </Text>
              )}
            </group>
          );
        },
      )}
    </group>
  );
}