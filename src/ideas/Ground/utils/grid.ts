export function worldToGrid(
  x: number,
  z: number,
  gridSize: number,
  size: number
): [number, number] {
  const cellSize = size / gridSize;
  const half = size / 2;
  const gx = Math.floor((x + half) / cellSize);
  const gz = Math.floor((z + half) / cellSize);
  return [gx, gz];
}

export function gridToWorld(
  gx: number,
  gz: number,
  gridSize: number,
  size: number
): [number, number] {
  const cellSize = size / gridSize;
  const half = size / 2;
  const x = gx * cellSize - half + cellSize / 2;
  const z = gz * cellSize - half + cellSize / 2;
  return [x, z];
}
