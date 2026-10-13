
import { useCallback } from "react";
import { useLoader } from "@react-three/fiber";
import * as THREE from "three";

import { useGridMap } from "../hooks/useGridMap";
import { worldToGrid } from "./utils/grid";

type GroundProps = {
  size?: number;
  gridSize?: number;
  y?: number;
};

export default function Ground({
  size = 2560,
  gridSize = 160,
  y = 0,
}: GroundProps) {
  const { get, set } = useGridMap(gridSize);

  const texture = useLoader(
    THREE.TextureLoader,
    "/Rocks02.png",
  );

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(100, 100);

  const handleClick = useCallback(
    (e: THREE.Event) => {
      const point = (e as unknown as {
        point: THREE.Vector3;
      }).point;

      const [gx, gz] = worldToGrid(
        point.x,
        point.z,
        gridSize,
        size,
      );

      const current = get(gx, gz);
      set(gx, gz, current === 0 ? 1 : 0);
    },
    [get, set, gridSize, size],
  );

  return (
    <mesh
      position={[0, y, 0]}
      rotation-x={-Math.PI / 2}
      receiveShadow
      onClick={handleClick}
    >
      <planeGeometry
        args={[size, size, gridSize, gridSize]}
      />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}