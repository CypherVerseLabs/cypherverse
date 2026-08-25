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
  size = 500,
  gridSize = 100,
  y = 0, // default height
}: GroundProps) {
  const { get, set } = useGridMap(gridSize);

  const texture = useLoader(THREE.TextureLoader, "/Rocks02.png");
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(100, 100); // or adjust to your preference

  const handleClick = useCallback(
    (e: any) => {
      const [x, z] = [e.point.x, e.point.z];
      const [gx, gz] = worldToGrid(x, z, gridSize, size);
      const current = get(gx, gz);
      const newValue = current === 0 ? 1 : 0;
      set(gx, gz, newValue);
      console.log(`Clicked grid cell: (${gx}, ${gz}) = ${newValue}`);
    },
    [get, set, gridSize, size]
  );

  return (
    <mesh
      position={[0, y, 0]} // Lock X/Z, only Y is adjustable
      rotation-x={-Math.PI / 2}
      receiveShadow
      onClick={handleClick}
    >
      <planeGeometry args={[size, size, gridSize, gridSize]} />
      <meshStandardMaterial map={texture} />
    </mesh>
  );
}
