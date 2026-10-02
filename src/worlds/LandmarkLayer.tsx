import {
  useMemo,
} from "react";

import {
  Text,
} from "@react-three/drei";

import type {
  Parcel,
} from "../parcels/types";

import {
  parcelToWorldPosition,
} from "../parcels/parcelCoordinates";

import {
  CITY_LANDMARKS,
} from "./CityLandmarks";

interface LandmarkLayerProps {
  parcels: Parcel[];

  tileSize?: number;

  origin?: [
    number,
    number,
    number
  ];
}

/**
 * =========================================================
 * LANDMARK LAYER
 * =========================================================
 *
 * Renders the major named locations of CypherVerse.
 *
 * Landmarks are NOT separate parcels.
 *
 * Instead, each landmark points at an existing parcel
 * using its x/y coordinate.
 *
 * This means the backend remains authoritative for:
 *
 *   - estate ID
 *   - ownership
 *   - parcel status
 *   - project
 *
 * =========================================================
 */

export default function LandmarkLayer({
  parcels,
  tileSize = 16,
  origin = [0, 0, 0],
}: LandmarkLayerProps) {

  /**
   * =======================================================
   * RESOLVE LANDMARK PARCELS
   * =======================================================
   */

  const resolvedLandmarks =
    useMemo(() => {

      return CITY_LANDMARKS.map(
        (landmark) => {

          const parcel =
            parcels.find(
              (candidate) =>
                candidate.x ===
                  landmark.x &&
                candidate.y ===
                  landmark.y
            );

          return {
            landmark,
            parcel,
          };
        }
      );

    }, [
      parcels,
    ]);


  /**
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <group
      name="city-landmarks"
    >

      {resolvedLandmarks.map(
        ({
          landmark,
          parcel,
        }) => {

          /**
           * Genesis is the central landmark and receives
           * the larger beacon treatment.
           */

          const isGenesis =
            landmark.estateId ===
            "landmark-genesis";

          /**
           * The landmark can still be positioned even
           * when its parcel hasn't been loaded yet.
           */

          const position =
            parcelToWorldPosition(
              landmark.x,
              landmark.y,
              tileSize,
              origin
            );

          const [
            worldX,
            worldY,
            worldZ,
          ] = position;

          const height =
            isGenesis
              ? 10
              : 6;


          return (
            <group
              key={`${landmark.x}-${landmark.y}-${landmark.name}`}
              position={[
                worldX,
                worldY,
                worldZ,
              ]}
            >

              {/* =================================================
                  LANDMARK BASE
                  ================================================= */}

              <mesh
                position={[
                  0,
                  0.35,
                  0,
                ]}
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


              {/* =================================================
                  LANDMARK BEACON
                  ================================================= */}

              <mesh
                position={[
                  0,
                  height / 2,
                  0,
                ]}
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


              {/* =================================================
                  LANDMARK LIGHT
                  ================================================= */}

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


              {/* =================================================
                  LANDMARK NAME
                  ================================================= */}

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


              {/* =================================================
                  DEBUG / PARCEL CONNECTION
                  ================================================= */}

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
        }
      )}

    </group>
  );
}

