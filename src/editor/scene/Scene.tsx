import {
  useEditor,
} from "../context/EditorContext";

import SceneObject from "./SceneObject";


export default function Scene() {
  const {
    scene,
    selectedId,
    select,
    editorActive,
  } = useEditor();


  const objectIds =
    new Set(
      scene.objects.map(
        (object) =>
          object.id
      )
    );


  /*
   * Only render root objects here.
   *
   * Child objects continue to be rendered
   * recursively by SceneObject.
   */
  const roots =
    scene.objects.filter(
      (object) =>
        object.parentId ===
          undefined ||
        !objectIds.has(
          object.parentId
        )
    );


  /*
   * Clicking empty scene space clears
   * the current Idea selection.
   *
   * This is what makes the gizmo, highlight,
   * toolbar and selected-object UI disappear
   * when the user clicks away from an Idea.
   */
  const handlePointerMissed =
    () => {
      if (!editorActive) {
        return;
      }

      if (selectedId) {
        select(undefined);

        if (
          process.env.NODE_ENV ===
          "development"
        ) {
          console.log(
            "[Editor] Selection cleared"
          );
        }
      }
    };


  return (
    <group
      name="editor-scene"
      onPointerMissed={
        handlePointerMissed
      }
    >
      {roots.map(
        (object) => (
          <SceneObject
            key={object.id}
            object={object}
          />
        )
      )}
    </group>
  );
}