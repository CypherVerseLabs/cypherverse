import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import JSZip from "jszip";

import {
  Scene,
  SceneObject,
  Transform,
} from "../scene/objectTypes";

import {
  TransformMode,
} from "./transformMode";

import {
  getDescendantIds,
} from "./hierarchy";

import {
  LocalAsset,
  createAssetId,
  createAssetObjectUrl,
  sanitizeAssetFileName,
} from "./AssetManager";

import { useAuthContext } from "../../ideas/context/AuthContext";

/* =========================================
   TYPES
========================================= */

type SceneObjectUpdate = {
  transform?: Partial<Transform>;

  props?: Record<string, unknown>;

  parentId?: string | undefined;

  name?: string | undefined;

  visible?: boolean | undefined;

  locked?: boolean | undefined;
};

type SceneFile = {
  format: string;

  version: number;

  scene: Scene;
};

/* =========================================
   ASSET MANIFEST
========================================= */

type AssetManifestEntry = {
  assetId: string;
  name: string;
  fieldName: string;
  path: string;
};


type PreparedAssets = {
  scene: Scene;

  manifest: AssetManifestEntry[];

  fileNames: Map<string, string>;
};

/* =========================================
   SCENE FILE
========================================= */

export const SCENE_FILE_FORMAT =
  "cybuilder-scene";

export const SCENE_FILE_VERSION =
  2;

/* =========================================
   CONSTANTS
========================================= */

const MAX_HISTORY_SIZE = 100;

const MAX_SCENE_FILE_SIZE =
  50 * 1024 * 1024;

const MAX_PUBLISH_SCENE_SIZE =
  10 * 1024 * 1024;

/* =========================================
   CONTEXT VALUE
========================================= */

type EditorContextValue = {
  scene: Scene;

  selectedId?: string;

  transformMode: TransformMode;

  editorActive: boolean;

  /* =======================================
     ASSETS
  ======================================= */

  assets: LocalAsset[];

  addAsset: (
    file: File
  ) => string;

  removeAsset: (
    id: string
  ) => void;

  /* =======================================
     UNDO / REDO
  ======================================= */

  canUndo: boolean;

  canRedo: boolean;

  undo: () => void;

  redo: () => void;

  /* =======================================
     SELECTION
  ======================================= */

  select: (
    id?: string
  ) => void;

  /* =======================================
     TRANSFORM
  ======================================= */

  setTransformMode: (
    mode: TransformMode
  ) => void;

  beginTransform: (
    id: string
  ) => void;

  endTransform: () => void;

  /* =======================================
     EDITOR
  ======================================= */

  setEditorActive: (
    active: boolean
  ) => void;

  toggleEditor: () => void;

  /* =======================================
     SCENE
  ======================================= */

  addObject: (
    object: SceneObject
  ) => void;

  removeObject: (
    id: string
  ) => void;

  duplicateObject: (
    id: string
  ) => void;

  updateObject: (
    id: string,
    changes: SceneObjectUpdate
  ) => void;

  updateTransform: (
    id: string,
    transform: Partial<Transform>
  ) => void;

  /* =======================================
     HIERARCHY
  ======================================= */

  setParent: (
    id: string,
    parentId?: string
  ) => void;

  /* =======================================
     SAVE / LOAD
  ======================================= */

  saveScene: () => Promise<void>;

  loadScene: (
    file: File
  ) => Promise<void>;

  loadProject: (
    projectId: string
  ) => Promise<void>;

  saveProject: (
    projectId: string
  ) => Promise<void>;

  publishProject: (
    projectId: string
  ) => Promise<void>;
};

/* =========================================
   INITIAL SCENE
========================================= */

const emptyScene: Scene = {
  objects: [],
};

/* =========================================
   CONTEXT
========================================= */

const EditorContext =
  createContext<
    EditorContextValue | undefined
  >(undefined);

/* =========================================
   PROVIDER PROPS
========================================= */

type EditorProviderProps = {
  children: ReactNode;

  initialScene?: Scene;
};

/* =========================================
   CLONE SCENE
========================================= */

function cloneScene(
  scene: Scene
): Scene {
  return structuredClone(scene);
}

/* =========================================
   CLONE TRANSFORM
========================================= */

function cloneTransform(
  transform: Transform
): Transform {
  return {
    position: [
      transform.position[0],
      transform.position[1],
      transform.position[2],
    ],

    rotation: [
      transform.rotation[0],
      transform.rotation[1],
      transform.rotation[2],
    ],

    scale: [
      transform.scale[0],
      transform.scale[1],
      transform.scale[2],
    ],
  };
}

/* =========================================
   ASSET PATH HELPERS
========================================= */

/**
 * Creates one stable filename per LocalAsset.
 *
 * The same asset always gets the same path,
 * regardless of how many scene objects reference it.
 */
function createAssetFileNames(
  assets: LocalAsset[]
): Map<string, string> {
  const fileNames =
    new Map<string, string>();

  const usedNames =
    new Set<string>();

  for (
    const asset of assets
  ) {
    const safeName =
      sanitizeAssetFileName(
        asset.name
      );

    let fileName =
      safeName;

    let counter = 1;

    while (
      usedNames.has(
        fileName
      )
    ) {
      fileName =
        `${counter}-${safeName}`;

      counter++;
    }

    usedNames.add(
      fileName
    );

    fileNames.set(
      asset.id,
      fileName
    );
  }

  return fileNames;
}

/**
 * Converts local browser object URLs into
 * portable assets/<filename> paths.
 *
 * IMPORTANT:
 *
 * The filename is assigned per asset ID,
 * not per reference.
 */
function rewriteSceneForAssets(
  scene: Scene,
  assets: LocalAsset[]
): PreparedAssets {
  const assetByUrl =
    new Map<string, LocalAsset>();

  for (
    const asset of assets
  ) {
    assetByUrl.set(
      asset.objectUrl,
      asset
    );
  }

  const fileNames =
    createAssetFileNames(
      assets
    );

  const cloned =
    cloneScene(scene);

  for (
    const object of cloned.objects
  ) {
    if (!object.props) {
      continue;
    }

    const props =
      object.props as Record<
        string,
        unknown
      >;

    for (
      const key of Object.keys(
        props
      )
    ) {
      const value =
        props[key];

      if (
        typeof value !==
        "string"
      ) {
        continue;
      }

      const asset =
        assetByUrl.get(
          value
        );

      if (!asset) {
        continue;
      }

      const fileName =
        fileNames.get(
          asset.id
        );

      if (!fileName) {
        continue;
      }

      props[key] =
        `assets/${fileName}`;
    }
  }

  const manifest: AssetManifestEntry[] =
  assets.flatMap((asset) => {
    const fileName =
      fileNames.get(asset.id);

    if (!fileName) {
      return [];
    }

    return [{
      assetId: asset.id,
      name: asset.name,
      fieldName: `asset-${asset.id}`,
      path: `assets/${fileName}`,
    }];
  });




  return {
    scene:
      cloned,

    manifest,

    fileNames,
  };
}

/* =========================================
   NORMALIZE ASSET PATH
========================================= */

function normalizeAssetPath(
  value: string
): string {
  return value
    .replace(
      /\\/g,
      "/"
    )
    .replace(
      /^\.\/+/,
      ""
    )
    .replace(
      /^\/+/,
      ""
    );
}

/* =========================================
   PROVIDER
========================================= */

export function EditorProvider({
  children,
  initialScene,
}: EditorProviderProps) {

  /* =======================================
     AUTH
  ======================================= */

  const {
    authFetch,
  } = useAuthContext();

  /* =======================================
     SCENE
  ======================================= */

  const [scene, setScene] =
    useState<Scene>(() =>
      cloneScene(
        initialScene ??
          emptyScene
      )
    );

  /* =======================================
     HISTORY
  ======================================= */

  const [history, setHistory] =
    useState<Scene[]>([]);

  const [future, setFuture] =
    useState<Scene[]>([]);

  /* =======================================
     ASSETS
  ======================================= */

  const [
    assets,
    setAssets,
  ] = useState<LocalAsset[]>([]);

  const assetsRef =
    useRef<LocalAsset[]>([]);

  assetsRef.current =
    assets;

  /* =======================================
     TRANSFORM TRANSACTION
  ======================================= */

  const transformTransaction =
    useRef<{
      id: string;
      scene: Scene;
    } | null>(null);

  /* =======================================
     SELECTION
  ======================================= */

  const [
    selectedId,
    setSelectedId,
  ] = useState<string>();

  /* =======================================
     TRANSFORM MODE
  ======================================= */

  const [
    transformMode,
    setTransformMode,
  ] = useState<TransformMode>(
    "translate"
  );

  /* =======================================
     EDITOR ACTIVE
  ======================================= */

  const [
    editorActive,
    setEditorActiveState,
  ] = useState(true);

  /* =======================================
     ADD ASSET
  ======================================= */

  const addAsset =
    useCallback(
      (
        file: File
      ): string => {
        const id =
          createAssetId();

        const objectUrl =
          createAssetObjectUrl(
            file
          );

        const asset: LocalAsset = {
          id,

          name:
            file.name,

          type:
            file.type ||
            "application/octet-stream",

          file,

          objectUrl,
        };

        setAssets(
          (current) => [
            ...current,
            asset,
          ]
        );

        return objectUrl;
      },
      []
    );

  /* =======================================
     REMOVE ASSET
  ======================================= */

  const removeAsset =
    useCallback(
      (
        id: string
      ) => {
        setAssets(
          (current) => {
            const asset =
              current.find(
                (item) =>
                  item.id === id
              );

            if (asset) {
              URL.revokeObjectURL(
                asset.objectUrl
              );
            }

            return current.filter(
              (item) =>
                item.id !== id
            );
          }
        );
      },
      []
    );

  /* =======================================
     HISTORY
  ======================================= */

  const pushHistory =
    useCallback(
      (
        previousScene: Scene
      ) => {
        setHistory(
          (previous) => {
            const next = [
              ...previous,
              cloneScene(
                previousScene
              ),
            ];

            if (
              next.length >
              MAX_HISTORY_SIZE
            ) {
              return next.slice(
                next.length -
                  MAX_HISTORY_SIZE
              );
            }

            return next;
          }
        );

        setFuture([]);
      },
      []
    );

  /* =======================================
     COMMIT SCENE
  ======================================= */

  const commitScene =
    useCallback(
      (
        createNextScene: (
          current: Scene
        ) => Scene
      ) => {
        setScene(
          (current) => {
            const nextScene =
              createNextScene(
                current
              );

            if (
              nextScene ===
              current
            ) {
              return current;
            }

            /*
             * Transform mouse movement is
             * treated as one transaction.
             */
            if (
              transformTransaction.current
            ) {
              return nextScene;
            }

            pushHistory(
              current
            );

            return nextScene;
          }
        );
      },
      [pushHistory]
    );

  /* =======================================
     SAVE SCENE
  ======================================= */

  const saveScene =
    useCallback(
      async () => {
        const zip =
          new JSZip();

        const prepared =
          rewriteSceneForAssets(
            scene,
            assetsRef.current
          );

        const file: SceneFile = {
          format:
            SCENE_FILE_FORMAT,

          version:
            SCENE_FILE_VERSION,

          scene:
            prepared.scene,
        };

        zip.file(
          "scene.json",
          JSON.stringify(
            file,
            null,
            2
          )
        );

        /* ---------------------------------
           ASSETS
        --------------------------------- */

        for (
          const asset of
            assetsRef.current
        ) {
          const fileName =
            prepared.fileNames.get(
              asset.id
            );

          if (!fileName) {
            continue;
          }

          zip.file(
            `assets/${fileName}`,
            asset.file
          );
        }

        /* ---------------------------------
           ZIP
        --------------------------------- */

        const blob =
          await zip.generateAsync({
            type: "blob",
          });

        if (
          blob.size >
          MAX_SCENE_FILE_SIZE
        ) {
          throw new Error(
            "CyBuilder project file is too large."
          );
        }

        const url =
          URL.createObjectURL(
            blob
          );

        try {
          const anchor =
            document.createElement(
              "a"
            );

          anchor.href =
            url;

          anchor.download =
            "cybuilder-project.cybuilder";

          document.body.appendChild(
            anchor
          );

          anchor.click();

          document.body.removeChild(
            anchor
          );
        } finally {
          URL.revokeObjectURL(
            url
          );
        }
      },
      [scene]
    );

  /* =======================================
     LOAD SCENE
  ======================================= */

  const loadScene =
    useCallback(
      async (
        projectFile: File
      ) => {
        /* ---------------------------------
           FILE VALIDATION
        --------------------------------- */

        if (
          projectFile.size >
          MAX_SCENE_FILE_SIZE
        ) {
          throw new Error(
            "CyBuilder project file is too large."
          );
        }

        if (
          !projectFile.name
            .toLowerCase()
            .endsWith(
              ".cybuilder"
            )
        ) {
          throw new Error(
            "Please select a .cybuilder project file."
          );
        }

        /* ---------------------------------
           ZIP
        --------------------------------- */

        const zip =
          await JSZip.loadAsync(
            projectFile
          );

        const sceneEntry =
          zip.file(
            "scene.json"
          );

        if (!sceneEntry) {
          throw new Error(
            "Invalid CyBuilder project: scene.json is missing."
          );
        }

        /* ---------------------------------
           PARSE
        --------------------------------- */

        const text =
          await sceneEntry.async(
            "text"
          );

        let parsed:
          | Partial<SceneFile>;

        try {
          parsed =
            JSON.parse(
              text
            ) as Partial<SceneFile>;
        } catch {
          throw new Error(
            "Invalid CyBuilder project: scene.json is not valid JSON."
          );
        }

        if (
          parsed.format !==
          SCENE_FILE_FORMAT
        ) {
          throw new Error(
            "This is not a CyBuilder project."
          );
        }

        if (
          parsed.version !==
          SCENE_FILE_VERSION
        ) {
          throw new Error(
            `Unsupported CyBuilder project version: ${String(
              parsed.version
            )}`
          );
        }

        if (
          !parsed.scene ||
          !Array.isArray(
            parsed.scene.objects
          )
        ) {
          throw new Error(
            "Invalid scene data."
          );
        }

        const loadedScene =
          parsed.scene;

        /* ---------------------------------
           LOAD ASSETS
        --------------------------------- */

        const loadedAssets:
          LocalAsset[] = [];

        const assetEntries =
          Object.keys(
            zip.files
          ).filter(
            (name) =>
              normalizeAssetPath(
                name
              ).startsWith(
                "assets/"
              ) &&
              !zip.files[name].dir
          );

        for (
          const path of
            assetEntries
        ) {
          const entry =
            zip.files[path];

          const blob =
            await entry.async(
              "blob"
            );

          const normalizedPath =
            normalizeAssetPath(
              path
            );

          const fileName =
            normalizedPath.slice(
              "assets/".length
            );

          if (!fileName) {
            continue;
          }

          const file =
            new File(
              [blob],
              fileName,
              {
                type:
                  blob.type ||
                  "application/octet-stream",
              }
            );

          const objectUrl =
            URL.createObjectURL(
              file
            );

          loadedAssets.push({
            id:
              createAssetId(),

            name:
              fileName,

            type:
              file.type,

            file,

            objectUrl,
          });
        }

        /* ---------------------------------
           ASSET MAP
        --------------------------------- */

        const assetByPath =
          new Map<
            string,
            LocalAsset
          >();

        for (
          const asset of
            loadedAssets
        ) {
          assetByPath.set(
            normalizeAssetPath(
              `assets/${asset.name}`
            ),
            asset
          );
        }

        /* ---------------------------------
           RESTORE SCENE
        --------------------------------- */

        const restoredScene =
          cloneScene(
            loadedScene
          );

        for (
          const object of
            restoredScene.objects
        ) {
          if (!object.props) {
            continue;
          }

          const props =
            object.props as Record<
              string,
              unknown
            >;

          for (
            const key of
              Object.keys(props)
          ) {
            const value =
              props[key];

            if (
              typeof value !==
              "string"
            ) {
              continue;
            }

            const asset =
              assetByPath.get(
                normalizeAssetPath(
                  value
                )
              );

            if (!asset) {
              continue;
            }

            props[key] =
              asset.objectUrl;
          }
        }

        /* ---------------------------------
           RELEASE OLD ASSETS
        --------------------------------- */

        for (
          const asset of
            assetsRef.current
        ) {
          URL.revokeObjectURL(
            asset.objectUrl
          );
        }

        /* ---------------------------------
           COMMIT
        --------------------------------- */

        transformTransaction.current =
          null;

        setScene(
          restoredScene
        );

        setAssets(
          loadedAssets
        );

        setHistory([]);

        setFuture([]);

        setSelectedId(
          undefined
        );
      },
      []
    );

  /* =======================================
     LOAD PROJECT
  ======================================= */

  const loadProject =
    useCallback(
      async (
        projectId: string
      ) => {
        if (!projectId) {
          throw new Error(
            "Project ID is required."
          );
        }

        const response =
          await authFetch(
            `/api/projects/${encodeURIComponent(
              projectId
            )}`,
            {
              method: "GET",
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Failed to load project."
          );
        }

        if (!data?.project) {
          throw new Error(
            "Project was not returned by the server."
          );
        }

        const project =
          data.project;

        /*
         * The project scene is JSON data
         * returned by the API.
         */
        if (
          !project.scene ||
          !Array.isArray(
            project.scene.objects
          )
        ) {
          throw new Error(
            "Project does not contain valid scene data."
          );
        }

        const loadedScene =
          cloneScene(
            project.scene as Scene
          );

        /*
         * Loading a server project replaces
         * the current editor scene.
         *
         * Server projects contain permanent
         * asset URLs rather than local
         * browser File objects.
         */
        transformTransaction.current =
          null;

        setScene(
          loadedScene
        );

        setHistory([]);

        setFuture([]);

        setSelectedId(
          undefined
        );
      },
      [authFetch]
    );

  /* =======================================
     SAVE PROJECT
  ======================================= */

  const saveProject =
    useCallback(
      async (
        projectId: string
      ) => {
        if (!projectId) {
          throw new Error(
            "Project ID is required."
          );
        }

        /*
         * Convert local browser object URLs
         * into portable assets/<filename>
         * paths before storing the scene.
         */
        const prepared =
          rewriteSceneForAssets(
            scene,
            assetsRef.current
          );

        const sceneToSave =
          prepared.scene;

        const sceneJson =
          JSON.stringify(
            sceneToSave
          );

        const sceneSize =
          new TextEncoder()
            .encode(sceneJson)
            .byteLength;

        if (
          sceneSize >
          MAX_PUBLISH_SCENE_SIZE
        ) {
          throw new Error(
            "Project scene must be 10 MB or smaller."
          );
        }

        const response =
          await authFetch(
            `/api/projects/${encodeURIComponent(
              projectId
            )}`,
            {
              method: "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                scene:
                  sceneToSave,
              }),
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Failed to save project."
          );
        }

        if (!data?.project) {
          throw new Error(
            "Project was not returned by the server."
          );
        }
      },
      [authFetch, scene]
    );

  /* =======================================
     PUBLISH PROJECT
  ======================================= */

  const publishProject =
    useCallback(
      async (
        projectId: string
      ) => {
        if (!projectId) {
          throw new Error(
            "Project ID is required."
          );
        }

        /*
         * The project was already created by
         * TemplateSelector.
         *
         * Publishing updates that existing
         * project. It does NOT create a project.
         */

        const currentAssets =
          assetsRef.current;

        /*
         * Convert local object URLs into
         * deterministic portable asset paths.
         */
        const prepared =
          rewriteSceneForAssets(
            scene,
            currentAssets
          );

        /* ---------------------------------
           SCENE JSON
        --------------------------------- */

        let sceneJson: string;

        try {
          sceneJson =
            JSON.stringify(
              prepared.scene
            );
        } catch {
          throw new Error(
            "Project scene could not be serialized."
          );
        }

        const sceneSize =
          new TextEncoder()
            .encode(sceneJson)
            .byteLength;

        if (
          sceneSize >
          MAX_PUBLISH_SCENE_SIZE
        ) {
          throw new Error(
            "Project scene must be 10 MB or smaller."
          );
        }

        /* ---------------------------------
           FORM DATA
        --------------------------------- */

        const formData =
          new FormData();

        /*
         * Portable scene.
         *
         * Example:
         *
         * assets/my-image.png
         *
         * instead of:
         *
         * blob:http://localhost/...
         */
        formData.append(
          "scene",
          sceneJson
        );

        /*
         * Manifest maps:
         *
         * asset ID
         *    ↓
         * multipart field
         *    ↓
         * original asset name
         */
        formData.append(
          "assetManifest",
          JSON.stringify(
            prepared.manifest
          )
        );

        /* ---------------------------------
           ASSET FILES
        --------------------------------- */

        for (
          const asset of currentAssets
        ) {
          if (!asset.file) {
            throw new Error(
              `Asset "${asset.name}" is missing its file.`
            );
          }

          const fieldName =
            `asset-${asset.id}`;

          formData.append(
            fieldName,
            asset.file,
            asset.name
          );
        }

        /* ---------------------------------
           SEND TO EXISTING PROJECT
        --------------------------------- */

        const response =
          await authFetch(
            `/api/projects/${encodeURIComponent(
              projectId
            )}/publish`,
            {
              method: "POST",

              body:
                formData,
            }
          );

        /* ---------------------------------
           RESPONSE
        --------------------------------- */

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.error ||
              data?.message ||
              "Failed to publish project."
          );
        }

        if (!data?.project) {
          throw new Error(
            "Server did not return the published project."
          );
        }

        console.log(
          "✅ Project published:",
          projectId
        );

        return data.project;
      },
      [
        scene,
        authFetch,
      ]
    );

  /* =======================================
     BEGIN TRANSFORM
  ======================================= */

  const beginTransform =
    useCallback(
      (
        id: string
      ) => {
        if (
          transformTransaction.current
        ) {
          return;
        }

        const exists =
          scene.objects.some(
            (object) =>
              object.id === id
          );

        if (!exists) {
          return;
        }

        transformTransaction.current = {
          id,

          scene:
            cloneScene(
              scene
            ),
        };
      },
      [scene]
    );

  /* =======================================
     END TRANSFORM
  ======================================= */

  const endTransform =
    useCallback(
      () => {
        const transaction =
          transformTransaction.current;

        if (!transaction) {
          return;
        }

        transformTransaction.current =
          null;

        setScene(
          (current) => {
            if (
              JSON.stringify(
                current
              ) ===
              JSON.stringify(
                transaction.scene
              )
            ) {
              return current;
            }

            pushHistory(
              transaction.scene
            );

            return current;
          }
        );
      },
      [pushHistory]
    );

  /* =======================================
     UNDO
  ======================================= */

  const undo =
    useCallback(
      () => {
        if (
          transformTransaction.current
        ) {
          return;
        }

        setHistory(
          (previous) => {
            if (
              previous.length ===
              0
            ) {
              return previous;
            }

            const previousScene =
              previous[
                previous.length - 1
              ];

            setScene(
              (current) => {
                setFuture(
                  (currentFuture) => {
                    const nextFuture =
                      [
                        ...currentFuture,
                        cloneScene(
                          current
                        ),
                      ];

                    if (
                      nextFuture.length >
                      MAX_HISTORY_SIZE
                    ) {
                      return nextFuture.slice(
                        nextFuture.length -
                          MAX_HISTORY_SIZE
                      );
                    }

                    return nextFuture;
                  }
                );

                return cloneScene(
                  previousScene
                );
              }
            );

            return previous.slice(
              0,
              -1
            );
          }
        );
      },
      []
    );

  /* =======================================
     REDO
  ======================================= */

  const redo =
    useCallback(
      () => {
        if (
          transformTransaction.current
        ) {
          return;
        }

        setFuture(
          (previous) => {
            if (
              previous.length ===
              0
            ) {
              return previous;
            }

            const nextScene =
              previous[
                previous.length - 1
              ];

            setScene(
              (current) => {
                setHistory(
                  (currentHistory) => {
                    const nextHistory =
                      [
                        ...currentHistory,
                        cloneScene(
                          current
                        ),
                      ];

                    if (
                      nextHistory.length >
                      MAX_HISTORY_SIZE
                    ) {
                      return nextHistory.slice(
                        nextHistory.length -
                          MAX_HISTORY_SIZE
                      );
                    }

                    return nextHistory;
                  }
                );

                return cloneScene(
                  nextScene
                );
              }
            );

            return previous.slice(
              0,
              -1
            );
          }
        );
      },
      []
    );

  /* =======================================
     EDITOR
  ======================================= */

  const setEditorActive =
    useCallback(
      (
        active: boolean
      ) => {
        setEditorActiveState(
          active
        );
      },
      []
    );

  const toggleEditor =
    useCallback(
      () => {
        setEditorActiveState(
          (current) =>
            !current
        );
      },
      []
    );

  /* =======================================
     SELECTION
  ======================================= */

  const select =
    useCallback(
      (
        id?: string
      ) => {
        setSelectedId(
          id
        );
      },
      []
    );

  /* =======================================
     ADD OBJECT
  ======================================= */

  const addObject =
    useCallback(
      (
        object: SceneObject
      ) => {
        commitScene(
          (current) => {
            if (
              current.objects.some(
                (item) =>
                  item.id ===
                  object.id
              )
            ) {
              return current;
            }

            return {
              ...current,

              objects: [
                ...current.objects,

                structuredClone(
                  object
                ),
              ],
            };
          }
        );
      },
      [commitScene]
    );

  /* =======================================
     REMOVE OBJECT
  ======================================= */

  const removeObject =
    useCallback(
      (
        id: string
      ) => {
        let removedIds:
          | string[]
          | undefined;

        commitScene(
          (current) => {
            const exists =
              current.objects.some(
                (object) =>
                  object.id === id
              );

            if (!exists) {
              return current;
            }

            removedIds = [
              id,

              ...getDescendantIds(
                current.objects,
                id
              ),
            ];

            return {
              ...current,

              objects:
                current.objects.filter(
                  (object) =>
                    !removedIds!.includes(
                      object.id
                    )
                ),
            };
          }
        );

        if (!removedIds) {
          return;
        }

        setSelectedId(
          (current) => {
            if (
              current &&
              removedIds!.includes(
                current
              )
            ) {
              return undefined;
            }

            return current;
          }
        );
      },
      [commitScene]
    );

  /* =======================================
     DUPLICATE OBJECT
  ======================================= */

  const duplicateObject =
    useCallback(
      (
        id: string
      ) => {
        let duplicatedId:
          | string
          | undefined;

        commitScene(
          (current) => {
            const original =
              current.objects.find(
                (object) =>
                  object.id === id
              );

            if (!original) {
              return current;
            }

            let newId: string;

            do {
              newId =
                `${original.type}-${crypto.randomUUID()}`;
            } while (
              current.objects.some(
                (object) =>
                  object.id ===
                  newId
              )
            );

            duplicatedId =
              newId;

            const duplicateTransform:
              Transform = {
              position: [
                original.transform
                  .position[0] +
                  0.75,

                original.transform
                  .position[1],

                original.transform
                  .position[2],
              ],

              rotation: [
                original.transform
                  .rotation[0],

                original.transform
                  .rotation[1],

                original.transform
                  .rotation[2],
              ],

              scale: [
                original.transform
                  .scale[0],

                original.transform
                  .scale[1],

                original.transform
                  .scale[2],
              ],
            };

            const duplicate:
              SceneObject = {
              ...structuredClone(
                original
              ),

              id:
                newId,

              parentId:
                original.parentId,

              transform:
                duplicateTransform,
            };

            return {
              ...current,

              objects: [
                ...current.objects,
                duplicate,
              ],
            };
          }
        );

        if (
          duplicatedId
        ) {
          setSelectedId(
            duplicatedId
          );
        }
      },
      [commitScene]
    );

  /* =======================================
     UPDATE OBJECT
  ======================================= */

  const updateObject =
    useCallback(
      (
        id: string,
        changes: SceneObjectUpdate
      ) => {
        commitScene(
          (current) => {
            const object =
              current.objects.find(
                (item) =>
                  item.id === id
              );

            if (!object) {
              return current;
            }

            return {
              ...current,

              objects:
                current.objects.map(
                  (item) => {
                    if (
                      item.id !== id
                    ) {
                      return item;
                    }

                    const nextObject =
                      structuredClone(
                        item
                      ) as SceneObject;

                    if (
                      changes.transform
                    ) {
                      nextObject.transform =
                        {
                          ...cloneTransform(
                            item.transform
                          ),

                          ...changes.transform,
                        };
                    }

                    if (
                      changes.props
                    ) {
                      nextObject.props =
                        {
                          ...item.props,
                          ...changes.props,
                        } as typeof nextObject.props;
                    }

                    if (
                      Object.prototype.hasOwnProperty.call(
                        changes,
                        "name"
                      )
                    ) {
                      nextObject.name =
                        changes.name;
                    }

                    if (
                      Object.prototype.hasOwnProperty.call(
                        changes,
                        "visible"
                      )
                    ) {
                      nextObject.visible =
                        changes.visible;
                    }

                    if (
                      Object.prototype.hasOwnProperty.call(
                        changes,
                        "locked"
                      )
                    ) {
                      nextObject.locked =
                        changes.locked;
                    }

                    if (
                      Object.prototype.hasOwnProperty.call(
                        changes,
                        "parentId"
                      )
                    ) {
                      nextObject.parentId =
                        changes.parentId;
                    }

                    return nextObject;
                  }
                ),
            };
          }
        );
      },
      [commitScene]
    );

  /* =======================================
     UPDATE TRANSFORM
  ======================================= */

  const updateTransform =
    useCallback(
      (
        id: string,
        changes: Partial<Transform>
      ) => {
        commitScene(
          (current) => {
            const exists =
              current.objects.some(
                (item) =>
                  item.id === id
              );

            if (!exists) {
              return current;
            }

            return {
              ...current,

              objects:
                current.objects.map(
                  (item) => {
                    if (
                      item.id !== id
                    ) {
                      return item;
                    }

                    const nextTransform:
                      Transform = {
                      position:
                        changes.position
                          ? [
                              changes
                                .position[0],
                              changes
                                .position[1],
                              changes
                                .position[2],
                            ]
                          : [
                              item
                                .transform
                                .position[0],
                              item
                                .transform
                                .position[1],
                              item
                                .transform
                                .position[2],
                            ],

                      rotation:
                        changes.rotation
                          ? [
                              changes
                                .rotation[0],
                              changes
                                .rotation[1],
                              changes
                                .rotation[2],
                            ]
                          : [
                              item
                                .transform
                                .rotation[0],
                              item
                                .transform
                                .rotation[1],
                              item
                                .transform
                                .rotation[2],
                            ],

                      scale:
                        changes.scale
                          ? [
                              changes
                                .scale[0],
                              changes
                                .scale[1],
                              changes
                                .scale[2],
                            ]
                          : [
                              item
                                .transform
                                .scale[0],
                              item
                                .transform
                                .scale[1],
                              item
                                .transform
                                .scale[2],
                            ],
                    };

                    return {
                      ...item,

                      transform:
                        nextTransform,
                    } as SceneObject;
                  }
                ),
            };
          }
        );
      },
      [commitScene]
    );

  /* =======================================
     SET PARENT
  ======================================= */

  const setParent =
    useCallback(
      (
        id: string,
        parentId?: string
      ) => {
        commitScene(
          (current) => {
            const object =
              current.objects.find(
                (item) =>
                  item.id === id
              );

            if (!object) {
              return current;
            }

            /* --------------------------------
               REMOVE PARENT
            -------------------------------- */

            if (
              parentId ===
              undefined
            ) {
              if (
                object.parentId ===
                undefined
              ) {
                return current;
              }

              return {
                ...current,

                objects:
                  current.objects.map(
                    (item) =>
                      item.id === id
                        ? ({
                            ...item,

                            parentId:
                              undefined,
                          } as SceneObject)
                        : item
                  ),
              };
            }

            /* --------------------------------
               SELF PARENT
            -------------------------------- */

            if (
              parentId === id
            ) {
              return current;
            }

            /* --------------------------------
               PARENT MUST EXIST
            -------------------------------- */

            const parent =
              current.objects.find(
                (item) =>
                  item.id ===
                  parentId
              );

            if (!parent) {
              return current;
            }

            /* --------------------------------
               CIRCULAR HIERARCHY
            -------------------------------- */

            const descendants =
              getDescendantIds(
                current.objects,
                id
              );

            if (
              descendants.includes(
                parentId
              )
            ) {
              return current;
            }

            /* --------------------------------
               ALREADY PARENTED
            -------------------------------- */

            if (
              object.parentId ===
              parentId
            ) {
              return current;
            }

            /* --------------------------------
               APPLY
            -------------------------------- */

            return {
              ...current,

              objects:
                current.objects.map(
                  (item) =>
                    item.id === id
                      ? ({
                          ...item,

                          parentId:
                            parentId,
                        } as SceneObject)
                      : item
                ),
            };
          }
        );
      },
      [commitScene]
    );

  /* =======================================
     CONTEXT VALUE
  ======================================= */

  const value =
    useMemo<EditorContextValue>(
      () => ({
        scene,

        selectedId,

        transformMode,

        editorActive,

        /* ASSETS */

        assets,

        addAsset,

        removeAsset,

        /* HISTORY */

        canUndo:
          history.length >
          0,

        canRedo:
          future.length >
          0,

        undo,

        redo,

        /* SELECTION */

        select,

        /* TRANSFORM */

        setTransformMode,

        beginTransform,

        endTransform,

        /* EDITOR */

        setEditorActive,

        toggleEditor,

        /* SCENE */

        addObject,

        removeObject,

        duplicateObject,

        updateObject,

        updateTransform,

        /* HIERARCHY */

        setParent,

        /* SAVE / LOAD */

        saveScene,

        loadScene,

        /* SERVER PROJECTS */

        loadProject,

        saveProject,

        publishProject,
      }),
      [
        scene,

        selectedId,

        transformMode,

        editorActive,

        assets,

        history,

        future,

        addAsset,

        removeAsset,

        undo,

        redo,

        select,

        setTransformMode,

        beginTransform,

        endTransform,

        setEditorActive,

        toggleEditor,

        addObject,

        removeObject,

        duplicateObject,

        updateObject,

        updateTransform,

        setParent,

        saveScene,

        loadScene,

        loadProject,

        saveProject,

        publishProject,
      ]
    );

  /* =======================================
     PROVIDER
  ======================================= */

  return (
    <EditorContext.Provider
      value={value}
    >
      {children}
    </EditorContext.Provider>
  );
}

/* =========================================
   USE EDITOR
========================================= */

export function useEditor() {
  const context =
    useContext(
      EditorContext
    );

  if (!context) {
    throw new Error(
      "useEditor must be used inside an EditorProvider"
    );
  }

  return context;
}
