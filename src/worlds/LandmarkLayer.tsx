import { useMemo } from "react";

import { Text } from "@react-three/drei";

import type { Parcel } from "../parcels/types";

import {
  landmarkToWorldPosition,
  worldPositionToDatabaseCoordinates,
} from "../parcels/parcelCoordinates";

import { CITY_LANDMARKS } from "./CityLandmarks";

/**
 * =========================================================
 * LANDMARK LAYER
 * =========================================================
 *
 * Displays the configured CypherVerse landmarks.
 *
 * Landmark coordinates are offsets from Genesis.
 *
 * Genesis:
 *
 *     Three.js (0, 0)
 *
 * Database Genesis/world center:
 *
 *     (2400, 2400)
 *
 * Landmark positions are visual overlays only.
 *
 * They do not:
 *
 * - create database parcels
 * - modify parcel coordinates
 * - reserve land
 * - purchase land
 * - change ownership
 * - execute marketplace actions
 * =========================================================
 */

interface LandmarkLayerProps {
  parcels: Parcel[];

  tileSize?: number;

  origin?: [
    number,
    number,
    number,
  ];
}

export default function LandmarkLayer({
  parcels = [],
  tileSize: _tileSize = 16,
  origin = [0, 0, 0],
}: LandmarkLayerProps) {
  const resolvedLandmarks =
    useMemo(() => {
      return CITY_LANDMARKS.map(
        (landmark) => {
          const [
            worldX,
            ,
            worldZ,
          ] =
            landmarkToWorldPosition(
              landmark.x,
              landmark.y,
              origin,
            );

          const database =
            worldPositionToDatabaseCoordinates(
              worldX,
              worldZ,
            );

          const parcel =
            parcels.find(
              (candidate) =>
                candidate.x ===
                  database.x &&
                candidate.y ===
                  database.y,
            ) ?? null;

          return {
            landmark,
            parcel,
            worldX,
            worldZ,
          };
        },
      );
    }, [parcels, origin]);

  return (
    <group
      name="city-landmarks"
    >
      {resolvedLandmarks.map(
        ({
          landmark,
          parcel,
          worldX,
          worldZ,
        }) => {
          const isGenesis =
            landmark.estateId ===
            "landmark-genesis";

          const height =
            isGenesis ? 10 : 6;

          return (
            <group
              key={landmark.estateId}
              position={[
                worldX,
                origin[1],
                worldZ,
              ]}
            >
              <mesh
                position={[
                  0,
                  0.35,
                  0,
                ]}
                raycast={() => null}
              >
                <cylinderGeometry
                  args={[
                    2.5,
                    2.5,
                    0.7,
                    32,
                  ]}
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

              <mesh
                position={[
                  0,
                  height / 2,
                  0,
                ]}
                raycast={() => null}
              >
                <cylinderGeometry
                  args={[
                    0.35,
                    0.8,
                    height,
                    16,
                  ]}
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

              <pointLight
                position={[
                  0,
                  height,
                  0,
                ]}
                color={
                  isGenesis
                    ? "#ffd166"
                    : "#38bdf8"
                }
                intensity={
                  isGenesis
                    ? 25
                    : 10
                }
                distance={40}
              />

              <Text
                position={[
                  0,
                  height + 2,
                  0,
                ]}
                fontSize={
                  isGenesis
                    ? 2
                    : 1.5
                }
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.08}
                outlineColor="#000000"
                raycast={() => null}
              >
                {landmark.name}
              </Text>

              {parcel && (
                <Text
                  position={[
                    0,
                    height + 0.5,
                    0,
                  ]}
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