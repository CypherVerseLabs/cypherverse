import {
  TransformControls,
} from "@react-three/drei";

import {
  ReactElement,
  useCallback,
  useState,
} from "react";

import {
  ThreeEvent,
} from "@react-three/fiber";

import {
  Group,
} from "three";

import {
  useEditor,
} from "../context/EditorContext";

import {
  SceneObject as SceneObjectData,
  Transform,
} from "./objectTypes";

import SceneObjectContent from "./SceneObjectContent";


type SceneObjectProps = {
  object: SceneObjectData;
};


export default function SceneObject({
  object,
}: SceneObjectProps): ReactElement {
  const {
    scene,
    selectedId,
    select,
    updateTransform,
    beginTransform,
    endTransform,
    transformMode,
    editorActive,
  } = useEditor();

  /*
   * The actual Three.js Group for this SceneObject.
   *
   * TransformControls attaches directly to this
   * object when this SceneObject is selected.
   */
  const [
    gizmoTarget,
    setGizmoTarget,
  ] = useState<Group | null>(null);

  /*
   * Keep the callback ref stable.
   *
   * This avoids the React ref callback being
   * recreated on every render.
   */
  const setGroupRef = useCallback(
    (node: Group | null): void => {
      setGizmoTarget(node);
    },
    []
  );

  const isSelected =
    selectedId === object.id;

  const {
    position,
    rotation,
    scale,
  } = object.transform;

  /*
   * Scene hierarchy remains unchanged.
   */
  const children =
    scene.objects.filter(
      (child) =>
        child.parentId === object.id
    );


  /* =========================================
     OBJECT SELECTION
  ========================================= */

  const handleClick = (
    event: ThreeEvent<MouseEvent>
  ) => {
    if (!editorActive) {
      return;
    }

    event.stopPropagation();

    select(object.id);

    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.log(
        "[Editor] Selected Idea:",
        {
          id: object.id,
          type: object.type,
          position: object.transform.position,
          rotation: object.transform.rotation,
          scale: object.transform.scale,
          props: object.props,
        }
      );
    }
  };


  /* =========================================
     GIZMO TRANSFORM → EDITOR STATE
  ========================================= */

  const handleObjectChange = () => {
    const group =
      gizmoTarget;

    if (!group) {
      return;
    }

    const transform: Transform = {
      position: [
        group.position.x,
        group.position.y,
        group.position.z,
      ],

      rotation: [
        group.rotation.x,
        group.rotation.y,
        group.rotation.z,
      ],

      scale: [
        group.scale.x,
        group.scale.y,
        group.scale.z,
      ],
    };

    /*
     * EditorContext remains the single
     * authoritative transform state.
     */
    updateTransform(
      object.id,
      transform
    );

    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.log(
        "[Editor] Gizmo transform:",
        {
          id: object.id,
          type: object.type,
          mode: transformMode,
          position: transform.position,
          rotation: transform.rotation,
          scale: transform.scale,
        }
      );
    }
  };


  /* =========================================
     OBJECT CONTENT
  ========================================= */

  const content = (
    <group
      ref={setGroupRef}
      name={`scene-object-${object.id}`}
      position={position}
      rotation={rotation}
      scale={scale}
      visible={
        object.visible !== false
      }
      onClick={
        editorActive
          ? handleClick
          : undefined
      }
    >
      <SceneObjectContent
        object={object}
      />

      {editorActive && (
        <EditorSelectionMesh />
      )}

      {isSelected && editorActive && (
        <SelectionIndicator />
      )}

      {children.map(
        (child) => (
          <SceneObject
            key={child.id}
            object={child}
          />
        )
      )}
    </group>
  );


  /*
   * Unselected objects render normally.
   *
   * No gizmo exists unless this object
   * is actually selected.
   */
  if (
    !isSelected ||
    !editorActive ||
    object.locked ||
    !gizmoTarget
  ) {
    return content;
  }


  /*
   * IMPORTANT:
   *
   * TransformControls is a sibling of the
   * selected Group and explicitly targets
   * that Group.
   *
   * It no longer wraps the object's content.
   */
  return (
    <>
      {content}

      <TransformControls
        object={
          gizmoTarget
        }

        mode={
          transformMode
        }

        enabled={
          editorActive &&
          isSelected &&
          !object.locked
        }

        onMouseDown={() => {
          beginTransform(
            object.id
          );

          if (
            process.env.NODE_ENV ===
            "development"
          ) {
            console.log(
              "[Editor] Gizmo mounted:",
              {
                id: object.id,
                type: object.type,
                mode: transformMode,
              }
            );
          }
        }}

        onObjectChange={
          handleObjectChange
        }

        onMouseUp={() => {
          endTransform();

          if (
            process.env.NODE_ENV ===
            "development"
          ) {
            console.log(
              "[Editor] Gizmo transform ended:",
              object.id
            );
          }
        }}
      />
    </>
  );
}


/* =========================================
   INVISIBLE EDITOR SELECTION MESH
========================================= */

function EditorSelectionMesh(): ReactElement {
  return (
    <mesh
      name="editor-selection-hit-area"
    >
      <boxGeometry
        args={[
          1.25,
          1.25,
          1.25,
        ]}
      />

      <meshBasicMaterial
        transparent
        opacity={0}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}


/* =========================================
   SELECTED OBJECT HIGHLIGHT
========================================= */

function SelectionIndicator(): ReactElement {
  return (
    <mesh
      name="editor-selected-indicator"
      raycast={() => null}
    >
      <boxGeometry
        args={[
          1.08,
          1.08,
          1.08,
        ]}
      />

      <meshBasicMaterial
        color="#4c7dff"
        wireframe
        transparent
        opacity={0.55}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}