import { useEditor } from "../context/EditorContext";
import SceneObject from "./SceneObject";

export default function Scene() {
  const { scene } = useEditor();

  const objectIds = new Set(
    scene.objects.map(
      (object) => object.id
    )
  );

  const roots = scene.objects.filter(
    (object) =>
      object.parentId === undefined ||
      !objectIds.has(object.parentId)
  );

  return (
    <group name="editor-scene">
      {roots.map((object) => (
        <SceneObject
          key={object.id}
          object={object}
        />
      ))}
    </group>
  );
}