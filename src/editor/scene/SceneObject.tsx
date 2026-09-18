import {
  TransformControls,
} from "@react-three/drei";

import {
  ReactElement,
  useRef,
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

  const groupRef = useRef<Group>(null);

  const isSelected =
    selectedId === object.id;

  const {
    position,
    rotation,
    scale,
  } = object.transform;

  const children =
    scene.objects.filter(
      (child) =>
        child.parentId === object.id
    );


  const handleClick = (
    event: ThreeEvent<MouseEvent>
  ) => {
    if (!editorActive) {
      return;
    }

    event.stopPropagation();

    select(object.id);
  };


  const handleObjectChange = () => {
    const group = groupRef.current;

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

    updateTransform(
      object.id,
      transform
    );
  };


  const content = (
    <group
      ref={groupRef}
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


  if (
    !isSelected ||
    !editorActive ||
    object.locked
  ) {
    return content;
  }


  return (
    <TransformControls
      mode={transformMode}
      enabled={
        editorActive &&
        isSelected &&
        !object.locked
      }
      onMouseDown={() => {
        beginTransform(object.id);
      }}
      onObjectChange={
        handleObjectChange
      }
      onMouseUp={() => {
        endTransform();
      }}
    >
      {content}
    </TransformControls>
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
   SELECTED OBJECT OUTLINE
========================================= */

function SelectionIndicator(): ReactElement {
  return (
    <mesh
      raycast={() => null}
    >
      <boxGeometry
        args={[
          1.05,
          1.05,
          1.05,
        ]}
      />

      <meshBasicMaterial
        color="#4c7dff"
        wireframe
        transparent
        opacity={0.35}
        depthTest={false}
      />
    </mesh>
  );
}