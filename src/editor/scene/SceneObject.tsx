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

  const [
    gizmoTarget,
    setGizmoTarget,
  ] = useState<Group | null>(null);

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
        <EditorSelectionTarget
          object={object}
          onClick={handleClick}
        />
      )}

      {isSelected && editorActive && (
        <SelectionIndicator
          object={object}
        />
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
    object.locked ||
    !gizmoTarget
  ) {
    return content;
  }

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


type EditorSelectionTargetProps = {
  object: SceneObjectData;
  onClick: (
    event: ThreeEvent<MouseEvent>
  ) => void;
};


function EditorSelectionTarget({
  object,
  onClick,
}: EditorSelectionTargetProps): ReactElement | null {
  const size =
    getEditorSelectionSize(
      object
    );

  if (!size) {
    return null;
  }

  return (
    <mesh
      name={`editor-selection-target-${object.id}`}
      position={[
        0,
        size.offsetY,
        0,
      ]}
      onClick={onClick}
      
    >
      <boxGeometry
        args={[
          size.width,
          size.height,
          size.depth,
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


type EditorSelectionSize = {
  width: number;
  height: number;
  depth: number;
  offsetY: number;
};


function getEditorSelectionSize(
  object: SceneObjectData
): EditorSelectionSize | null {
  const props =
    object.props as Record<
      string,
      unknown
    >;

  switch (
    object.type
  ) {
    /*
     * These are scene-level settings rather
     * than spatial objects.
     */
    case "background":
    case "fog":
    case "hdri":
      return null;

    /*
     * Ground uses its configured size instead
     * of a fixed editor cube.
     */
    case "ground": {
      const configuredSize =
        typeof props.size ===
        "number"
          ? props.size
          : 500;

      const size =
        Math.max(
          0.5,
          configuredSize
        );

      return {
        width: size,
        height: 0.35,
        depth: size,
        offsetY: -0.175,
      };
    }

    /*
     * Infinite floor/environment.
     */
    case "infinitePlane": {
      const configuredSize =
        typeof props.size ===
        "number"
          ? props.size
          : 50;

      const size =
        Math.max(
          0.5,
          Math.min(
            configuredSize,
            50
          )
        );

      return {
        width: size,
        height: 0.35,
        depth: size,
        offsetY: -0.175,
      };
    }

    case "lostFloor":
      return {
        width: 4,
        height: 0.35,
        depth: 4,
        offsetY: -0.175,
      };

    /*
     * Dynamic environment/particle Ideas.
     * Do not derive selection from live particle
     * bounds because those bounds continuously move.
     */
    case "rain":
    case "toxicGass":
      return {
        width: 3,
        height: 3,
        depth: 3,
        offsetY: 1.5,
      };

    case "cloudySky":
      return {
        width: 4,
        height: 3,
        depth: 4,
        offsetY: 1.5,
      };

    case "transparentFloor":
      return {
        width: 4,
        height: 0.2,
        depth: 4,
        offsetY: 0,
      };

    /*
     * Common spatial Ideas.
     */
    case "image":
      return {
        width: 1.25,
        height: 1.25,
        depth: 0.12,
        offsetY: 0,
      };

    case "video":
      return {
        width: 1.6,
        height: 0.9,
        depth: 0.12,
        offsetY: 0,
      };

    case "model":
      return {
        width: 1.25,
        height: 1.25,
        depth: 1.25,
        offsetY: 0,
      };

    case "audio":
      return {
        width: 0.5,
        height: 0.5,
        depth: 0.5,
        offsetY: 0,
      };

    case "speaker":
      return {
        width: 1,
        height: 1.5,
        depth: 1,
        offsetY: 0.75,
      };

    case "speakerRadio":
      return {
        width: 1,
        height: 1.5,
        depth: 1,
        offsetY: 0.75,
      };

    case "videoPlayer":
      return {
        width: 1.6,
        height: 1,
        depth: 0.3,
        offsetY: 0,
      };

    case "youtubePlayer":
      return {
        width: 1.6,
        height: 0.9,
        depth: 0.3,
        offsetY: 0,
      };

    case "probe":
      return {
        width: 0.75,
        height: 0.75,
        depth: 0.75,
        offsetY: 0,
      };

    case "cyrus":
      return {
        width: 1,
        height: 2,
        depth: 1,
        offsetY: 1,
      };

    case "title":
      return {
        width: 2,
        height: 0.75,
        depth: 0.15,
        offsetY: 0,
      };

    case "link":
      return {
        width: 2,
        height: 0.75,
        depth: 0.15,
        offsetY: 0,
      };

    /*
     * Existing generic SceneObject types that
     * can still appear in saved projects.
     */
    

    default:
      return {
        width: 1,
        height: 1,
        depth: 1,
        offsetY: 0,
      };
  }
}


function SelectionIndicator({
  object,
}: {
  object: SceneObjectData;
}): ReactElement | null {
  const size =
    getEditorSelectionSize(
      object
    );

  if (!size) {
    return null;
  }

  return (
    <mesh
      name="editor-selected-indicator"
      position={[
        0,
        size.offsetY,
        0,
      ]}
      raycast={() => null}
    >
      <boxGeometry
        args={[
          size.width,
          size.height,
          size.depth,
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