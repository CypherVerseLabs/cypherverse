// ideas/utils/grid.ts

export function worldToGrid(
  x: number,
  z: number,
  gridSize: number,
  worldSize: number
): [number, number] {
  const cellSize = worldSize / gridSize;
  const half = worldSize / 2;

  const gridX = Math.floor((x + half) / cellSize);
  const gridZ = Math.floor((z + half) / cellSize);

  return [gridX, gridZ];
}
