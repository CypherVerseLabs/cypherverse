import { Html } from "@react-three/drei";

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { useEditor } from "../context/EditorContext";

import {
  createSceneObject,
  getIdeaDefinition,
} from "../ideas";

import {
  SceneObject,
} from "../scene/objectTypes";

import EditorLeftPanel from "./EditorLeftPanel";
import EditorRightPanel from "./EditorRightPanel";


/* =========================================
   CLONE SCENE OBJECT
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
    cloned.transform.position[0] + 0.75,
    cloned.transform.position[1],
    cloned.transform.position[2],
  ];

  return cloned;
}


/* =========================================
   EDITOR UI
========================================= */

type EditorUIProps = {
  projectId?: string;
};


export default function EditorUI({
  projectId,
}: EditorUIProps) {

  /* =========================================
     PANEL STATE
  ========================================= */

  const [
    leftPanelCollapsed,
    setLeftPanelCollapsed,
  ] = useState(false);


  /* =========================================
     CLIPBOARD
  ========================================= */

  const [
    clipboardObject,
    setClipboardObject,
  ] = useState<SceneObject>();


  /* =========================================
     IDEA FOLDERS
  ========================================= */

  const [
    openIdeaFolders,
    setOpenIdeaFolders,
  ] = useState<Record<string, boolean>>({
    Media: true,
    Environment: true,
  });


  /* =========================================
     FILE INPUT
  ========================================= */

  const fileInputRef =
    useRef<HTMLInputElement>(null);


  /* =========================================
     SERVER PROJECT STATE
  ========================================= */

  const [
    projectSaving,
    setProjectSaving,
  ] = useState(false);

  const [
    projectLoading,
    setProjectLoading,
  ] = useState(false);


  /* =========================================
     EDITOR
  ========================================= */

  const {
    scene,
    selectedId,

    select,

    /* HISTORY */

    canUndo,
    canRedo,

    undo,
    redo,

    /* SCENE */

    addObject,
    removeObject,
    duplicateObject,

    updateObject,
    updateTransform,

    /* TRANSFORM */

    transformMode,
    setTransformMode,

    /* EDITOR */

    editorActive,
    toggleEditor,

    /* SAVE / LOAD */

    saveScene,
    loadScene,

    /* SERVER PROJECTS */

    publishProject,
    loadProject,

  } = useEditor();


  /* =========================================
     KEYBOARD SHORTCUTS
  ========================================= */

  useEffect(() => {

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {

      const target =
        event.target as HTMLElement | null;

      const tagName =
        target?.tagName?.toLowerCase();

      /*
       * Never run editor shortcuts while
       * the user is typing into a control.
       */

      const isTyping =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable;

      if (isTyping) {
        return;
      }


      /* -------------------------------------
         UNDO
      ------------------------------------- */

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "z" &&
        !event.shiftKey
      ) {

        event.preventDefault();
        event.stopPropagation();

        undo();

        return;
      }


      /* -------------------------------------
         REDO
      ------------------------------------- */

      if (
        (event.ctrlKey || event.metaKey) &&
        (
          (
            event.key.toLowerCase() === "z" &&
            event.shiftKey
          ) ||
          event.key.toLowerCase() === "y"
        )
      ) {

        event.preventDefault();
        event.stopPropagation();

        redo();

        return;
      }


      /* -------------------------------------
         COPY
      ------------------------------------- */

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "c"
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
          structuredClone(object)
        );

        return;
      }


      /* -------------------------------------
         PASTE
      ------------------------------------- */

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "v"
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


      /* -------------------------------------
         DUPLICATE
      ------------------------------------- */

      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "d"
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


      /* -------------------------------------
         DELETE
      ------------------------------------- */

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


      /* -------------------------------------
         DESELECT
      ------------------------------------- */

      if (
        event.key === "Escape"
      ) {

        event.preventDefault();

        select(
          undefined
        );

        return;
      }


      /* -------------------------------------
         TOGGLE EDITOR
      ------------------------------------- */

      if (
        event.key.toLowerCase() === "e"
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
     LOAD LOCAL FILE
  ========================================= */

  const handleLoadFile = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {

      await loadScene(
        file
      );

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
     PUBLISH PROJECT
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

        setProjectSaving(
          true
        );

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

        setProjectSaving(
          false
        );

      }
    };


  /* =========================================
     LOAD SERVER PROJECT
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

        setProjectLoading(
          true
        );

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

        setProjectLoading(
          false
        );

      }
    };


  /* =========================================
     SELECTED OBJECT
  ========================================= */

  const selectedObject =
    scene.objects.find(
      (object) =>
        object.id === selectedId
    );


  /* =========================================
     SELECTED IDEA DEFINITION
  ========================================= */

  const selectedDefinition =
    selectedObject
      ? getIdeaDefinition(
          selectedObject.type
        )
      : undefined;


  /* =========================================
     ADD IDEA
  ========================================= */

  const addIdea = (
    type: SceneObject["type"]
  ) => {

    const object =
      createSceneObject(
        type
      );

    addObject(
      object
    );

    select(
      object.id
    );
  };


  /* =========================================
     TOGGLE IDEA FOLDER
  ========================================= */

  const toggleIdeaFolder = (
    category: string
  ) => {

    setOpenIdeaFolders(
      (current) => ({
        ...current,

        [category]:
          !current[category],
      })
    );
  };


  /* =========================================
     EDITOR OFF
  ========================================= */

  if (!editorActive) {
    return null;
  }
console.log("EDITOR PROJECT ID:", projectId);

  /* =========================================
     RENDER
  ========================================= */

  return (
    <Html
      fullscreen
      zIndexRange={[100, 0]}
      style={{
        pointerEvents: "none",
      }}
    >

      <div
        style={{
          position: "absolute",
          inset: 0,

          display: "flex",

          justifyContent:
            "space-between",

          pointerEvents: "none",

          fontFamily:
            "Inter, ui-sans-serif, system-ui, sans-serif",

          color: "#ffffff",
        }}
      >

        <EditorLeftPanel
          leftPanelCollapsed={
            leftPanelCollapsed
          }
          setLeftPanelCollapsed={
            setLeftPanelCollapsed
          }

          scene={scene}
          selectedId={selectedId}

          select={select}

          canUndo={canUndo}
          canRedo={canRedo}

          undo={undo}
          redo={redo}

          saveScene={saveScene}

          fileInputRef={
            fileInputRef
          }

          handleLoadFile={
            handleLoadFile
          }

          projectId={projectId}

          projectSaving={
            projectSaving
          }

          projectLoading={
            projectLoading
          }

          handlePublishProject={
            handlePublishProject
          }

          handleLoadProject={
            handleLoadProject
          }

          transformMode={
            transformMode
          }

          setTransformMode={
            setTransformMode
          }

          openIdeaFolders={
            openIdeaFolders
          }

          toggleIdeaFolder={
            toggleIdeaFolder
          }

          addIdea={addIdea}
        />


        <EditorRightPanel
          selectedObject={
            selectedObject
          }

          selectedDefinition={
            selectedDefinition
          }

          select={select}

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

          scene={scene}

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

      </div>

    </Html>
  );
}