import { Html } from "@react-three/drei";

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useEditor,
} from "../context/EditorContext";

import {
  createSceneObject,
  getIdeaDefinition,
} from "../ideas";

import {
  SceneObject,
} from "../scene/objectTypes";

import EditorLeftPanel from "./EditorLeftPanel";
import EditorContextualPanel from "./EditorContextualPanel";

type EditorUIProps = {
  projectId?: string;
};

type ActivePanel =
  | "add"
  | "move"
  | "rotate"
  | "scale"
  | "help"
  | null;

function cloneSceneObject(
  object: SceneObject
): SceneObject {
  const cloned =
    structuredClone(object);

  cloned.id =
    `${cloned.type}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

  cloned.transform.position = [
    cloned.transform.position[0] +
      0.75,
    cloned.transform.position[1],
    cloned.transform.position[2],
  ];

  return cloned;
}

export default function EditorUI({
  projectId,
}: EditorUIProps) {
  const [
    leftPanelCollapsed,
    setLeftPanelCollapsed,
  ] = useState(false);

  const [
    clipboardObject,
    setClipboardObject,
  ] = useState<SceneObject>();

  const [
    activePanel,
    setActivePanel,
  ] =
    useState<ActivePanel>(null);

  const [
    openIdeaFolders,
    setOpenIdeaFolders,
  ] =
    useState<Record<string, boolean>>({
      Media: true,
      Environment: true,
    });

  const fileInputRef =
    useRef<HTMLInputElement>(
      null
    );

  const [
    projectSaving,
    setProjectSaving,
  ] = useState(false);

  const [
    projectLoading,
    setProjectLoading,
  ] = useState(false);

  const {
    scene,
    selectedId,
    select,

    canUndo,
    canRedo,

    undo,
    redo,

    addObject,
    removeObject,
    duplicateObject,

    updateObject,
    updateTransform,

    transformMode,
    setTransformMode,

    editorActive,
    toggleEditor,

    saveScene,
    loadScene,

    publishProject,
    loadProject,
  } = useEditor();

  const selectedObject =
    scene.objects.find(
      (object) =>
        object.id === selectedId
    );

  const selectedDefinition =
    selectedObject
      ? getIdeaDefinition(
          selectedObject.type
        )
      : undefined;

  useEffect(() => {
    const handleKeyDown =
      (event: KeyboardEvent) => {
        const target =
          event.target as
            | HTMLElement
            | null;

        const tagName =
          target?.tagName?.toLowerCase();

        const isTyping =
          tagName === "input" ||
          tagName === "textarea" ||
          tagName === "select" ||
          target?.isContentEditable;

        if (isTyping) {
          return;
        }

        if (
          (event.ctrlKey ||
            event.metaKey) &&
          event.key.toLowerCase() ===
            "z" &&
          !event.shiftKey
        ) {
          event.preventDefault();
          event.stopPropagation();

          undo();

          return;
        }

        if (
          (event.ctrlKey ||
            event.metaKey) &&
          (
            (
              event.key.toLowerCase() ===
                "z" &&
              event.shiftKey
            ) ||
            event.key.toLowerCase() ===
              "y"
          )
        ) {
          event.preventDefault();
          event.stopPropagation();

          redo();

          return;
        }

        if (
          (event.ctrlKey ||
            event.metaKey) &&
          event.key.toLowerCase() ===
            "c"
        ) {
          if (!selectedId) {
            return;
          }

          const object =
            scene.objects.find(
              (item) =>
                item.id === selectedId
            );

          if (!object) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();

          setClipboardObject(
            structuredClone(
              object
            )
          );

          return;
        }

        if (
          (event.ctrlKey ||
            event.metaKey) &&
          event.key.toLowerCase() ===
            "v"
        ) {
          if (!clipboardObject) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();

          let pastedObject =
            cloneSceneObject(
              clipboardObject
            );

          while (
            scene.objects.some(
              (object) =>
                object.id ===
                pastedObject.id
            )
          ) {
            pastedObject =
              cloneSceneObject(
                clipboardObject
              );
          }

          addObject(
            pastedObject
          );

          select(
            pastedObject.id
          );

          return;
        }

        if (
          (event.ctrlKey ||
            event.metaKey) &&
          event.key.toLowerCase() ===
            "d"
        ) {
          if (!selectedId) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();

          duplicateObject(
            selectedId
          );

          return;
        }

        if (
          event.key === "Delete" ||
          event.key === "Backspace"
        ) {
          if (!selectedId) {
            return;
          }

          event.preventDefault();
          event.stopPropagation();

          removeObject(
            selectedId
          );

          return;
        }

        if (
          event.key === "Escape"
        ) {
          event.preventDefault();

          setActivePanel(null);

          select(undefined);

          return;
        }

        if (
          event.key.toLowerCase() ===
          "e"
        ) {
          event.preventDefault();

          toggleEditor();

          return;
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    scene,
    selectedId,
    clipboardObject,

    addObject,
    duplicateObject,
    removeObject,

    select,

    toggleEditor,

    undo,
    redo,
  ]);

  useEffect(() => {
    if (!selectedObject) {
      setActivePanel(null);
    }
  }, [
    selectedObject,
  ]);

  const handleLoadFile =
    async (
      event: ChangeEvent<HTMLInputElement>
    ) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      try {
        await loadScene(file);
      } catch (error) {
        console.error(
          "Failed to load CyBuilder project:",
          error
        );

        window.alert(
          error instanceof Error
            ? error.message
            : "Failed to load CyBuilder project."
        );
      } finally {
        event.target.value = "";
      }
    };

  const handlePublishProject =
    async () => {
      if (!projectId) {
        window.alert(
          "No project is selected."
        );

        return;
      }

      if (projectSaving) {
        return;
      }

      try {
        setProjectSaving(true);

        await publishProject(
          projectId
        );
      } catch (error) {
        console.error(
          "Failed to publish CyBuilder project:",
          error
        );

        window.alert(
          error instanceof Error
            ? error.message
            : "Failed to publish project."
        );
      } finally {
        setProjectSaving(false);
      }
    };

  const handleLoadProject =
    async () => {
      if (!projectId) {
        window.alert(
          "No project is selected."
        );

        return;
      }

      if (projectLoading) {
        return;
      }

      try {
        setProjectLoading(true);

        await loadProject(
          projectId
        );
      } catch (error) {
        console.error(
          "Failed to load CyBuilder project:",
          error
        );

        window.alert(
          error instanceof Error
            ? error.message
            : "Failed to load project."
        );
      } finally {
        setProjectLoading(false);
      }
    };

  const addIdea =
    (type: string) => {
      const object =
        createSceneObject(
          type as Parameters<
            typeof createSceneObject
          >[0]
        );

      addObject(
        object
      );

      select(
        object.id
      );
    };

  const toggleIdeaFolder =
    (category: string) => {
      setOpenIdeaFolders(
        (current) => ({
          ...current,
          [category]:
            !current[category],
        })
      );
    };

  const togglePanel =
    (
      panel: ActivePanel
    ) => {
      setActivePanel(
        (current) =>
          current === panel
            ? null
            : panel
      );
    };

  const activateTransform =
    (
      mode:
        | "translate"
        | "rotate"
        | "scale"
    ) => {
      setTransformMode(
        mode
      );

      setActivePanel(
        (current) => {
          const next =
            mode ===
            "translate"
              ? "move"
              : mode;

          return current ===
            next
            ? null
            : next;
        }
      );
    };

  if (!editorActive) {
    return null;
  }

  if (!selectedObject) {
    return null;
  }

  return (
    <Html
      fullscreen
      zIndexRange={[
        100,
        0,
      ]}
      style={{
        pointerEvents:
          "none",
      }}
    >
      <div
        style={{
          position:
            "absolute",
          inset: 0,
          pointerEvents:
            "none",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, sans-serif",
          color:
            "#25282d",
        }}
      >
        <EditorLeftPanel
          leftPanelCollapsed={
            leftPanelCollapsed
          }

          setLeftPanelCollapsed={
            setLeftPanelCollapsed
          }

          scene={
            scene
          }

          selectedId={
            selectedId
          }

          selectedObject={
            selectedObject
          }

          selectedDefinition={
            selectedDefinition
          }

          select={
            select
          }

          updateObject={
            updateObject
          }

          updateTransform={
            updateTransform
          }

          clipboardObject={
            clipboardObject
          }

          setClipboardObject={
            setClipboardObject
          }

          addObject={
            addObject
          }

          duplicateObject={
            duplicateObject
          }

          removeObject={
            removeObject
          }
        />

        <EditorContextualPanel
          panel={
            activePanel
          }

          scene={
            scene
          }

          selectedId={
            selectedId
          }

          leftPanelCollapsed={
            leftPanelCollapsed
          }

          transformMode={
            transformMode
          }

          setTransformMode={
            setTransformMode
          }

          updateTransform={
            updateTransform
          }

          updateObject={
            updateObject
          }

          openIdeaFolders={
            openIdeaFolders
          }

          toggleIdeaFolder={
            toggleIdeaFolder
          }

          addIdea={
            addIdea
          }

          onClose={() =>
            setActivePanel(
              null
            )
          }
        />

        <input
          ref={
            fileInputRef
          }
          type="file"
          accept=".cybuilder,application/json,application/zip"
          onChange={
            handleLoadFile
          }
          style={{
            display:
              "none",
          }}
        />

        <div
          style={{
            position:
              "absolute",

            left:
              "50%",

            bottom:
              18,

            transform:
              "translateX(-50%)",

            display:
              "flex",

            alignItems:
              "center",

            gap:
              5,

            padding:
              6,

            borderRadius:
              14,

            background:
              "rgba(235, 236, 238, 0.98)",

            border:
              "1px solid rgba(30, 32, 36, 0.12)",

            boxShadow:
              "0 12px 32px rgba(0,0,0,0.16)",

            pointerEvents:
              "auto",

            zIndex:
              50,

            whiteSpace:
              "nowrap",
          }}
        >
          <ToolbarButton
            label="Add"
            active={
              activePanel ===
              "add"
            }
            onClick={() =>
              togglePanel(
                "add"
              )
            }
          />

          <ToolbarButton
            label="Undo"
            disabled={
              !canUndo
            }
            onClick={
              undo
            }
          />

          <ToolbarButton
            label="Redo"
            disabled={
              !canRedo
            }
            onClick={
              redo
            }
          />

          <ToolbarButton
            label="Move"
            active={
              activePanel ===
              "move"
            }
            onClick={() =>
              activateTransform(
                "translate"
              )
            }
          />

          <ToolbarButton
            label="Rotate"
            active={
              activePanel ===
              "rotate"
            }
            onClick={() =>
              activateTransform(
                "rotate"
              )
            }
          />

          <ToolbarButton
            label="Scale"
            active={
              activePanel ===
              "scale"
            }
            onClick={() =>
              activateTransform(
                "scale"
              )
            }
          />

          <ToolbarButton
            label="Help"
            active={
              activePanel ===
              "help"
            }
            onClick={() =>
              togglePanel(
                "help"
              )
            }
          />

          <ToolbarDivider />

          <ToolbarButton
            label="Save"
            onClick={
              saveScene
            }
          />

          <ToolbarButton
            label="Load"
            onClick={() =>
              fileInputRef.current?.click()
            }
          />

          <ToolbarButton
            label={
              projectLoading
                ? "Loading…"
                : "Project"
            }
            disabled={
              projectLoading
            }
            onClick={
              handleLoadProject
            }
          />

          <ToolbarButton
            label={
              projectSaving
                ? "Publishing…"
                : "Publish"
            }
            disabled={
              projectSaving
            }
            onClick={
              handlePublishProject
            }
          />
        </div>
      </div>
    </Html>
  );
}

function ToolbarDivider() {
  return (
    <div
      aria-hidden="true"
      style={{
        width:
          1,
        height:
          24,
        margin:
          "0 3px",
        background:
          "rgba(30, 32, 36, 0.12)",
      }}
    />
  );
}

function ToolbarButton({
  label,
  onClick,
  active = false,
  disabled = false,
}: {
  label: string;

  onClick: () => void;

  active?: boolean;

  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      style={{
        height:
          34,

        padding:
          "0 11px",

        border:
          0,

        borderRadius:
          9,

        background:
          active
            ? "#5d83ee"
            : "transparent",

        color:
          active
            ? "#ffffff"
            : disabled
              ? "#a2a6ad"
              : "#3b3f46",

        cursor:
          disabled
            ? "default"
            : "pointer",

        fontSize:
          11,

        fontWeight:
          700,

        opacity:
          disabled
            ? 0.7
            : 1,

        transition:
          "background 120ms ease, color 120ms ease",
      }}
    >
      {label}
    </button>
  );
}