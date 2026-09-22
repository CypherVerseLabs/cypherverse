import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useAuthContext,
} from "ideas/context/AuthContext";

import type {
  Scene,
} from "../editor/scene/objectTypes";


/* =========================================================
   TYPES
========================================================= */

export type ProjectTemplate =
  | "editor"
  | "found";


export type Project = {
  id: string;

  ownerId: string;

  name: string;

  description?: string;

  template: ProjectTemplate;

  scene?: Scene | null;

  parcelId?: string | null;

  slug?: string;

  createdAt: string;

  updatedAt: string;
};



/* =========================================================
   API CONFIG
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";


/* =========================================================
   SCENE NORMALIZER
========================================================= */

function normalizeScene(
  value: unknown
): Scene | null {

  if (!value) {
    return null;
  }

  /*
   * API may return scene as a JSON string.
   */

  if (typeof value === "string") {

    try {

      const parsed =
        JSON.parse(value);

      if (
        parsed &&
        Array.isArray(parsed.objects)
      ) {
        return parsed as Scene;
      }

      return null;

    } catch (error) {

      console.warn(
        "Failed to parse project scene:",
        error
      );

      return null;
    }
  }


  /*
   * API may already return scene
   * as an object.
   */

  if (
    typeof value === "object" &&
    value !== null &&
    Array.isArray(
      (value as any).objects
    )
  ) {

    return value as Scene;
  }


  return null;
}


/* =========================================================
   PROJECT NORMALIZER
========================================================= */

function normalizeProject(
  raw: any
): Project {

  /*
   * Support both:
   *
   * project.scene
   *
   * and possible:
   *
   * project.sceneData
   */

  const rawScene =
    raw.scene ??
    raw.sceneData ??
    null;


  const scene =
    normalizeScene(rawScene);


  return {
  id:
    String(raw.id),

  ownerId:
    String(
      raw.ownerId ??
      raw.owner_id ??
      ""
    ),

  name:
    raw.name ||
    "Untitled World",

  description:
    raw.description ||
    undefined,

  template:
    raw.template === "found"
      ? "found"
      : "editor",

  scene,

  parcelId:
    raw.parcelId ??
    raw.parcel_id ??
    null,

  slug:
    raw.slug ||
    undefined,

  createdAt:
    raw.createdAt ??
    raw.created_at ??
    "",

  updatedAt:
    raw.updatedAt ??
    raw.updated_at ??
    "",
};

}


/* =========================================================
   HOOK
========================================================= */

export function useProjects() {

  const {
    jwt,
    user,
    walletAddress,
    loading: authLoading,
    authFetch,
  } = useAuthContext();


  const [
    projects,
    setProjects,
  ] = useState<Project[]>([]);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState<string | null>(null);


  /* =======================================================
     LOAD PROJECTS
  ======================================================= */

  const loadProjects =
    useCallback(
      async () => {

        console.log(
          "========== LOAD PROJECTS =========="
        );


        /*
         * Don't request projects while
         * AuthProvider is still restoring
         * the session.
         */

        if (authLoading) {

          console.log(
            "Auth still loading..."
          );

          return;
        }


        const authenticated =
          Boolean(jwt && user);


        console.log(
          "Authenticated:",
          authenticated
        );

        console.log(
          "Wallet:",
          walletAddress
        );


        /*
         * Not authenticated.
         */

        if (!authenticated) {

          console.log(
            "NO AUTH - clearing projects"
          );

          setProjects([]);

          setLoading(false);

          return;
        }


        setLoading(true);

        setError(null);


        try {

          const response =
            await authFetch(
              `${API_URL}/api/projects`,
              {
                method: "GET",
              }
            );


          const data =
            await response
              .json()
              .catch(() => null);


          console.log(
            "PROJECT RESPONSE:",
            response.status,
            data
          );


          if (!response.ok) {

            throw new Error(
              data?.error ||
              data?.message ||
              "Failed to load projects"
            );
          }


          const rawProjects =
            Array.isArray(
              data?.projects
            )
              ? data.projects
              : Array.isArray(data)
                ? data
                : [];


          console.log(
            "RAW PROJECT COUNT:",
            rawProjects.length
          );


          const normalizedProjects =
            rawProjects.map(
              normalizeProject
            );


          console.log(
            "NORMALIZED PROJECTS:",
            normalizedProjects
          );


          /*
           * Log every scene so we can immediately
           * see which projects actually contain
           * editor data.
           */

          normalizedProjects.forEach(
            (project: { id: any; name: any; scene: { objects: string | any[]; }; }) => {

              console.log(
                "PROJECT:",
                project.id,
                project.name,
                {
                  hasScene:
                    Boolean(project.scene),

                  objectCount:
                    project.scene?.objects
                      ?.length ?? 0,
                }
              );

            }
          );


          setProjects(
            normalizedProjects
          );

        } catch (err) {

          console.error(
            "Load projects error:",
            err
          );


          setProjects([]);


          setError(
            err instanceof Error
              ? err.message
              : "Failed to load projects"
          );

        } finally {

          setLoading(false);

        }

      },
      [
        jwt,
        user,
        walletAddress,
        authLoading,
        authFetch,
      ]
    );


  /* =======================================================
     DEPLOY PROJECT
  ======================================================= */

  const deployProject =
    useCallback(
      async (
        projectId: string,
        parcelId: string
      ): Promise<Project> => {
        const response = await authFetch(
          API_URL + "/api/projects/" + projectId + "/deploy",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ parcelId }),
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.project) {
          throw new Error(
            data?.error ||
            data?.message ||
            "Failed to deploy project (" + response.status + ")"
          );
        }

        return normalizeProject(data.project);
      },
      [authFetch]
    );

  /* =======================================================
     AUTH CHANGE
  ======================================================= */

  useEffect(() => {

    console.log(
      "useProjects auth change:",
      {
        userId:
          user?.id,

        walletAddress,

        hasJWT:
          Boolean(jwt),

        authLoading,
      }
    );


    if (authLoading) {
      return;
    }


    loadProjects();

  }, [
    user?.id,
    walletAddress,
    jwt,
    authLoading,
    loadProjects,
  ]);


  /* =======================================================
     RETURN
  ======================================================= */

  return {
    projects,

    loading,

    error,

    refreshProjects:
      loadProjects,

    deployProject,
  };
}