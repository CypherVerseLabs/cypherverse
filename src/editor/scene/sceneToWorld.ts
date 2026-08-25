import { World } from "cyengine";
import { Scene } from "./objectTypes";

export function sceneToWorld(
  scene: Scene,
  projectId?: string
): World {
  const world = new World();

  world.tree = scene.objects.map((object) => ({
    id: object.id,
    props: {
      type: object.type,
      ...object.props,
    },
  }));

  /*
   * World.getUpNorm() and World.getRange()
   * expect this ID format.
   *
   * For now we use a deterministic ID derived from
   * the project ID. If no project ID exists, fall
   * back to the test ID.
   */
  world.id =
    projectId
      ? projectIdToWorldId(projectId)
      : "12345678-1234-5678-9abc";

  return world;
}


/**
 * Convert an arbitrary project ID into the
 * hexadecimal format expected by World.
 */
function projectIdToWorldId(
  projectId: string
): string {
  let hash = 0;

  for (let i = 0; i < projectId.length; i++) {
    hash =
      (hash * 31 +
        projectId.charCodeAt(i)) |
      0;
  }

  const hex = (
    Math.abs(hash)
      .toString(16)
      .padStart(8, "0")
  ).slice(0, 8);

  return `${hex}-1234-5678-9abc`;
}