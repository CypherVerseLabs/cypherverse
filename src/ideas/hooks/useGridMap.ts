// ideas/hooks/useGridMap.ts
import { useRef } from "react";

export function useGridMap(size: number, defaultValue = 0) {
  // 2D array initialized once
  const gridRef = useRef<number[][]>(
    Array.from({ length: size }, () =>
      Array.from({ length: size }, () => defaultValue)
    )
  );

  const get = (x: number, z: number) => gridRef.current[x]?.[z];
  const set = (x: number, z: number, value: number) => {
    if (
      x >= 0 && x < size &&
      z >= 0 && z < size
    ) {
      gridRef.current[x][z] = value;
    }
  };

  return { get, set, grid: gridRef.current };
}
