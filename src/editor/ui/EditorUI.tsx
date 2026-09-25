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


/* =========================================
   CLONE OBJECT
========================================= */

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


/* =========================================
   EDITOR UI
========================================= */

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


  /* =========================================
     SELECTED OBJECT
  ========================================= */

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


  /* =========================================
     KEYBOARD CONTROLS
  ========================================= */

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


        /* ===============================
           UNDO
        =============================== */

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


        /* ===============================
           REDO
        =============================== */

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


        /* ===============================
           COPY
        =============================== */

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


        /* ===============================
           PASTE
        =============================== */

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


        /* ===============================
           DUPLICATE
        =============================== */

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


        /* ===============================
           DELETE
        =============================== */

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


        /* ===============================
           ESCAPE
        =============================== */

        if (
          event.key === "Escape"
        ) {
          event.preventDefault();

          setActivePanel(null);

          select(undefined);

          return;
        }


        /* ===============================
           E = EDITOR ON/OFF
        =============================== */

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


  /* =========================================
     CLEAR UI WHEN SELECTION DISAPPEARS
  ========================================= */

  useEffect(() => {
    if (!selectedObject) {
      setActivePanel(null);
    }
  }, [
    selectedObject,
  ]);


  /* =========================================
     LOAD FILE
  ========================================= */

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


  /* =========================================
     PUBLISH
  ========================================= */

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


  /* =========================================
     LOAD PROJECT
  ========================================= */

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


  /* =========================================
     ADD IDEA
  ========================================= */

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


      /*
       * Newly-created Ideas are immediately
       * selected so the user can see:
       *
       * - highlight
       * - gizmo
       * - properties
       * - toolbar
       */
      select(
        object.id
      );
    };


  /* =========================================
     IDEA CATEGORY STATE
  ========================================= */

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


  /* =========================================
     PANEL
  ========================================= */

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


  /* =========================================
     TRANSFORM PANEL
  ========================================= */

  const activateTransform =
    (
      mode:
        | "translate"
        | "rotate"
        | "scale"
    ) => {
      /*
       * Transform mode remains authoritative
       * in EditorContext.
       */
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


  /* =========================================
     EDITOR CLOSED
  ========================================= */

  if (!editorActive) {
    return null;
  }


  /* =========================================
     EDITOR OPEN BUT NOTHING SELECTED
  ========================================= */

  /*
   * This is intentional.
   *
   * Pressing E activates the editor, but
   * editor controls are only shown once
   * an actual Idea is selected.
   *
   * Therefore:
   *
   * no selected Idea =
   * no toolbar
   * no contextual panel
   * no selected-object panel
   * no editor controls
   */
  if (!selectedObject) {
    return null;
  }


  /* =========================================
     EDITOR UI
  ========================================= */

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
        {/* =================================
            SELECTED OBJECT PANEL
        ================================= */}

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


        {/* =================================
            CONTEXTUAL PANEL
        ================================= */}

        <EditorContextualPanel
          panel={activePanel}

          scene={scene}

          selectedId={selectedId}

          leftPanelCollapsed={leftPanelCollapsed}

          transformMode={transformMode}

          setTransformMode={setTransformMode}

          updateTransform={updateTransform}

          openIdeaFolders={openIdeaFolders}

          toggleIdeaFolder={toggleIdeaFolder}

          addIdea={addIdea}

          onClose={() => setActivePanel(
            null
          )} updateObject={function (objectId: string, changes: { modifiers?: SceneObject["modifiers"]; effects?: SceneObject["effects"]; }): void {
            throw new Error("Function not implemented.");
          } }        />


        {/* =================================
            FILE INPUT
        ================================= */}

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


        {/* =================================
            BOTTOM TOOLBAR
        ================================= */}

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


/* =========================================
   TOOLBAR DIVIDER
========================================= */

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


/* =========================================
   TOOLBAR BUTTON
========================================= */

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