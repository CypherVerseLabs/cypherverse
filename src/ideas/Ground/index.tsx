import { useGridMap } from "../hooks/useGridMap";
import { worldToGrid } from "../utils/grid";
import { useCallback } from "react";

type GroundProps = {
  size?: number;       // world size (default 500)
  gridSize?: number;   // number of cells per axis (default 100)
};

export default function Ground({ size = 500, gridSize = 100 }: GroundProps) {
  const { get, set } = useGridMap(gridSize);

  const handleClick = useCallback((e: any) => {
    const [x, z] = [e.point.x, e.point.z];
    const [gx, gz] = worldToGrid(x, z, gridSize, size);
    set(gx, gz, 1);
    console.log(`Clicked grid cell: (${gx}, ${gz}) =`, get(gx, gz));
  }, [get, set, gridSize, size]);

  return (
    <mesh
      rotation-x={-Math.PI / 2}
      receiveShadow
      onClick={handleClick}
    >
      <planeBufferGeometry args={[size, size, gridSize, gridSize]} />
      <meshStandardMaterial color="#dddddd" wireframe />
    </mesh>
  );
}
