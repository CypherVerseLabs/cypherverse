import { StandardReality } from "cyengine";

import {
  ReactNode,
  useEffect,
  useMemo,
} from "react";

import { useRouter } from "next/router";

import {
  EditorProvider,
  useEditor,
} from "./context/EditorContext";

import {
  useAuthContext,
} from "../ideas/context/AuthContext";

import Scene from "./scene/Scene";

import {
  Scene as SceneData,
} from "./scene/objectTypes";

import EditorUI from "./ui/EditorUI";

import {
  EditorTemplate,
} from "./templates/types";

import {
  defaultEditorTemplate,
} from "./templates";


type EditorRealityProps = {
  children?: ReactNode | ReactNode[];

  initialScene?: SceneData;

  template?: EditorTemplate;

  projectId?: string;
};


/* =========================================
   PROJECT LOADER
========================================= */

function ProjectLoader({
  projectId,
}: {
  projectId: string;
}) {
  const {
    loadProject,
  } = useEditor();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        await loadProject(
          projectId
        );

        if (cancelled) {
          return;
        }

        if (
          process.env.NODE_ENV ===
          "development"
        ) {
          console.log(
            "[Editor] Project loaded:",
            projectId
          );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "[Editor] Failed to load project:",
          error
        );
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    projectId,
    loadProject,
  ]);

  return null;
}


/* =========================================
   EDITOR REALITY
========================================= */

export default function EditorReality({
  children,
  initialScene,
  template = defaultEditorTemplate,
  projectId,
}: EditorRealityProps) {
  const router =
    useRouter();

  const {
    loading:
      authLoading,

    isAuthenticated,
  } =
    useAuthContext();


  /*
   * -----------------------------------------
   * RESOLVE PROJECT ID
   * -----------------------------------------
   *
   * Priority:
   *
   * 1. Explicit projectId
   * 2. /editor?projectId=...
   * 3. Existing creation-session handoff
   *
   * The session value is only a temporary
   * handoff. The actual Project and Scene
   * are always loaded from the backend.
   * -----------------------------------------
   */

  const resolvedProjectId =
    useMemo(() => {
      if (
        projectId &&
        projectId.trim()
      ) {
        return projectId.trim();
      }

      if (
        router.isReady &&
        typeof router.query
          .projectId ===
          "string" &&
        router.query.projectId.trim()
      ) {
        return router.query
          .projectId
          .trim();
      }

      if (
        typeof window !==
        "undefined"
      ) {
        const stored =
          sessionStorage.getItem(
            "cypherverse-project-id"
          );

        if (
          stored &&
          stored.trim()
        ) {
          return stored.trim();
        }
      }

      return undefined;
    }, [
      projectId,
      router.isReady,
      router.query.projectId,
    ]);


  /*
   * -----------------------------------------
   * AUTHENTICATION GATE
   * -----------------------------------------
   *
   * A project editor must never render a
   * previous user's project while authentication
   * is being restored or after logout.
   * -----------------------------------------
   */

  if (
    resolvedProjectId &&
    authLoading
  ) {
    return null;
  }

  if (
    resolvedProjectId &&
    !isAuthenticated
  ) {
    return null;
  }


  /*
   * -----------------------------------------
   * STARTING SCENE
   * -----------------------------------------
   *
   * This remains the existing template/default
   * scene. ProjectLoader replaces it with the
   * persisted Project.scene immediately after
   * the authenticated EditorProvider mounts.
   * -----------------------------------------
   */

  const startingScene =
    initialScene ??
    template.scene;


  /*
   * -----------------------------------------
   * REALITY
   * -----------------------------------------
   */

  return (
    <StandardReality>

      <EditorProvider
        initialScene={
          startingScene
        }
      >

        {resolvedProjectId && (
          <ProjectLoader
            projectId={
              resolvedProjectId
            }
          />
        )}

        {/* TEMPLATE ENVIRONMENT */}

        {template.environment}


        {/* EDITOR SCENE */}

        <Scene />


        {/* EDITOR UI */}

        <EditorUI
          projectId={
            resolvedProjectId
          }
        />


        {/* EXTRA CHILDREN */}

        {children}

      </EditorProvider>

    </StandardReality>
  );
}