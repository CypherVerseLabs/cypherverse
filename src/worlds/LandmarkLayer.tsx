import { useMemo } from "react";

import { Text } from "@react-three/drei";

import type { Parcel } from "../parcels/types";

import { parcelToWorldPosition } from "../parcels/parcelCoordinates";

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
 * Renders named CypherVerse landmarks at their configured
 * database parcel coordinates.
 *
 * Landmarks are visual objects, not separate parcels.
 *
 * This component does not:
 * - Create or modify parcels.
 * - Change ownership or availability.
 * - Reserve land.
 * - Execute marketplace actions.
 *
 * Existing parcel coordinates remain authoritative.
 * =========================================================
 */

export default function LandmarkLayer({
  parcels,
  tileSize = 16,
  origin = [0, 0, 0],
}: LandmarkLayerProps) {
  /**
   * Resolve existing parcels without requiring them to be
   * loaded before a landmark can be displayed.
   */
  const resolvedLandmarks = useMemo(() => {
    return CITY_LANDMARKS.map((landmark) => {
      const parcel = parcels.find(
        (candidate) =>
          candidate.x === landmark.x &&
          candidate.y === landmark.y
      );

      return {
        landmark,
        parcel,
      };
    });
  }, [parcels]);

  return (
    <group name="city-landmarks">
      {resolvedLandmarks.map(({ landmark, parcel }) => {
        const isGenesis =
          landmark.estateId === "landmark-genesis";

        const [worldX, worldY, worldZ] =
          parcelToWorldPosition(
            landmark.x,
            landmark.y,
            tileSize,
            origin
          );

        const height = isGenesis ? 10 : 6;

        return (
          <group
            key={`${landmark.x}-${landmark.y}-${landmark.name}`}
            position={[worldX, worldY, worldZ]}
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
                color={isGenesis ? "#ffd166" : "#38bdf8"}
                emissive={isGenesis ? "#ff9f1c" : "#0369a1"}
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
                color={isGenesis ? "#fff3b0" : "#7dd3fc"}
                emissive={isGenesis ? "#f59e0b" : "#0ea5e9"}
                emissiveIntensity={2}
              />
            </mesh>

            {/* Landmark light */}
            <pointLight
              position={[0, height, 0]}
              color={isGenesis ? "#ffd166" : "#38bdf8"}
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

            {/* Existing parcel reference; debug label only */}
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
      })}
    </group>
  );
}