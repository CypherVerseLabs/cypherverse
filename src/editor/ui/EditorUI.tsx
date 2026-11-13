import { Html } from "@react-three/drei";

import {
  ChangeEvent,
  ReactNode,
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
import { useAuthContext } from "../../ideas/context/AuthContext";
import type { Parcel } from "../../parcels/types";

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

type ToolbarIconName =
  | "add"
  | "undo"
  | "redo"
  | "move"
  | "rotate"
  | "scale"
  | "help"
  | "save"
  | "download"
  | "folder"
  | "publish"
  | "deploy";

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

  const [deployPanelOpen, setDeployPanelOpen] = useState(false);
  const [ownedParcels, setOwnedParcels] = useState<Parcel[]>([]);
  const [ownedParcelsLoading, setOwnedParcelsLoading] = useState(false);
  const [deployingParcelId, setDeployingParcelId] = useState<string | null>(null);
  const [deploymentError, setDeploymentError] = useState<string | null>(null);
  const [deploymentSuccess, setDeploymentSuccess] = useState<string | null>(null);

  const { authFetch } = useAuthContext();

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
    saveProject,
    loadScene,

    publishProject,
    deployProject,
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
            structuredClone(object)
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

  const handleSaveProject =
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

        await saveProject(
          projectId
        );
      } catch (error) {
        console.error(
          "Failed to save CyBuilder project:",
          error
        );

        window.alert(
          error instanceof Error
            ? error.message
            : "Failed to save project."
        );
      } finally {
        setProjectSaving(false);
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

  const handleOpenDeployPanel = async () => {
    if (!projectId) {
      window.alert("No project is selected.");
      return;
    }

    if (deployPanelOpen) {
      setDeployPanelOpen(false);
      return;
    }

    setDeployPanelOpen(true);
    setDeploymentError(null);
    setDeploymentSuccess(null);
    setOwnedParcelsLoading(true);

    try {
      const response = await authFetch("/api/parcels/owned", {
        method: "GET",
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Failed to load your owned Parcels.");
      }

      if (!Array.isArray(data?.parcels)) {
        throw new Error("The server returned an invalid owned Parcel list.");
      }

      setOwnedParcels(data.parcels as Parcel[]);
    } catch (error) {
      setDeploymentError(
        error instanceof Error ? error.message : "Failed to load your owned Parcels."
      );
    } finally {
      setOwnedParcelsLoading(false);
    }
  };

  const handleDeployProject = async (parcel: Parcel) => {
    if (!projectId || deployingParcelId) {
      return;
    }

    if (parcel.project) {
      setDeploymentError(
        parcel.project.id === projectId
          ? "This Project is already deployed to this Parcel."
          : "This Parcel already has an active Project."
      );
      return;
    }

    const parcelLabel = parcel.name || parcel.estateId || `Parcel ${parcel.x}, ${parcel.y}`;
    if (!window.confirm(`Deploy this Project to ${parcelLabel}? A Parcel can have only one active Project.`)) {
      return;
    }

    setDeployingParcelId(parcel.id);
    setDeploymentError(null);
    setDeploymentSuccess(null);

    try {
      const deployedProject = await deployProject(projectId, parcel.id);

      setOwnedParcels((current) =>
        current.map((item) =>
          item.id === parcel.id
            ? {
                ...item,
                project: {
                  id: deployedProject.id,
                  name: deployedProject.name,
                  template: deployedProject.template,
                  slug: deployedProject.slug ?? null,
                  publishedAt: deployedProject.publishedAt ?? null,
                },
              }
            : item
        )
      );

      setDeploymentSuccess(`Project deployed to ${parcelLabel}.`);
    } catch (error) {
      const deploymentError = error as Error & { code?: string };
      setDeploymentError(
        deploymentError.code === "PARCEL_ALREADY_HAS_PROJECT"
          ? "This Parcel already has an active Project. No changes were made."
          : deploymentError.code === "PROJECT_ALREADY_DEPLOYED"
            ? "This Project is already deployed to another Parcel."
            : deploymentError.message || "Failed to deploy project."
      );
    } finally {
      setDeployingParcelId(null);
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

        {deployPanelOpen && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 76,
              transform: "translateX(-50%)",
              width: "min(420px, calc(100vw - 32px))",
              maxHeight: "min(48vh, 420px)",
              overflowY: "auto",
              padding: 14,
              borderRadius: 14,
              background: "rgba(24, 25, 31, 0.98)",
              border: "1px solid rgba(255,255,255,0.14)",
              boxShadow: "0 18px 45px rgba(0,0,0,0.38)",
              color: "#f8fafc",
              pointerEvents: "auto",
              zIndex: 51,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <strong style={{ fontSize: 14 }}>Deploy Project to Parcel</strong>
              <button
                type="button"
                onClick={() => setDeployPanelOpen(false)}
                aria-label="Close deployment panel"
                style={{ border: 0, background: "transparent", color: "#cbd5e1", cursor: "pointer", fontSize: 18 }}
              >
                ×
              </button>
            </div>
            <p style={{ margin: "8px 0 12px", color: "#aeb8c7", fontSize: 12, lineHeight: 1.5 }}>
              Choose one of your owned Parcels. Each Parcel can have only one active Project.
            </p>
            {deploymentError && (
              <p role="alert" style={{ margin: "8px 0", color: "#fca5a5", fontSize: 12 }}>
                {deploymentError}
              </p>
            )}
            {deploymentSuccess && (
              <p role="status" style={{ margin: "8px 0", color: "#86efac", fontSize: 12 }}>
                {deploymentSuccess}
              </p>
            )}
            {ownedParcelsLoading ? (
              <p style={{ color: "#cbd5e1", fontSize: 12 }}>Loading your owned Parcels…</p>
            ) : ownedParcels.length === 0 ? (
              <p style={{ color: "#cbd5e1", fontSize: 12 }}>You do not currently own any Parcels.</p>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {ownedParcels.map((parcel) => {
                  const alreadyThisProject = parcel.project?.id === projectId;
                  const occupied = Boolean(parcel.project);
                  const label = parcel.name || parcel.estateId || `Parcel ${parcel.x}, ${parcel.y}`;

                  return (
                    <div key={parcel.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 10, borderRadius: 10, background: "rgba(255,255,255,0.06)" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                        <div style={{ marginTop: 3, color: "#aeb8c7", fontSize: 11 }}>X {parcel.x} · Y {parcel.y}</div>
                        {occupied && (
                          <div style={{ marginTop: 3, color: alreadyThisProject ? "#86efac" : "#fbbf24", fontSize: 11 }}>
                            {alreadyThisProject ? "This Project is deployed here" : `Occupied by ${parcel.project?.name || "another Project"}`}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={occupied || deployingParcelId !== null}
                        onClick={() => void handleDeployProject(parcel)}
                        style={{ flexShrink: 0, border: 0, borderRadius: 8, padding: "7px 11px", background: occupied ? "#3b414c" : "#4c7dff", color: "#fff", cursor: occupied || deployingParcelId !== null ? "default" : "pointer", opacity: occupied || (deployingParcelId !== null && deployingParcelId !== parcel.id) ? 0.65 : 1, fontSize: 11, fontWeight: 600 }}
                      >
                        {alreadyThisProject ? "Deployed" : occupied ? "Occupied" : deployingParcelId === parcel.id ? "Deploying…" : "Deploy"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
            icon="add"
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
            icon="undo"
            disabled={
              !canUndo
            }
            onClick={
              undo
            }
          />

          <ToolbarButton
            label="Redo"
            icon="redo"
            disabled={
              !canRedo
            }
            onClick={
              redo
            }
          />

          <ToolbarButton
            label="Move"
            icon="move"
            active={
              activePanel ===
              "move"
            }
            disabled={
              !selectedObject
            }
            onClick={() =>
              activateTransform(
                "translate"
              )
            }
          />

          <ToolbarButton
            label="Rotate"
            icon="rotate"
            active={
              activePanel ===
              "rotate"
            }
            disabled={
              !selectedObject
            }
            onClick={() =>
              activateTransform(
                "rotate"
              )
            }
          />

          <ToolbarButton
            label="Scale"
            icon="scale"
            active={
              activePanel ===
              "scale"
            }
            disabled={
              !selectedObject
            }
            onClick={() =>
              activateTransform(
                "scale"
              )
            }
          />

          <ToolbarButton
            label="Help"
            icon="help"
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
            label={
              projectSaving
                ? "Saving project…"
                : "Save project"
            }
            icon="save"
            disabled={
              !projectId ||
              projectSaving
            }
            onClick={
              handleSaveProject
            }
          />

          <ToolbarButton
            label="Export"
            icon="download"
            onClick={
              saveScene
            }
          />

          <ToolbarButton
            label={
              projectLoading
                ? "Loading project…"
                : "Load project"
            }
            icon="folder"
            disabled={
              !projectId ||
              projectLoading
            }
            onClick={
              handleLoadProject
            }
          />

          <ToolbarButton
            label="Deploy"
            icon="deploy"
            active={deployPanelOpen}
            disabled={!projectId || projectSaving || projectLoading}
            onClick={handleOpenDeployPanel}
          />

          <ToolbarButton
            label={
              projectSaving
                ? "Publishing…"
                : "Publish"
            }
            icon="publish"
            disabled={
              !projectId ||
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
  icon,
  onClick,
  active = false,
  disabled = false,
}: {
  label: string;

  icon: ToolbarIconName;

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
      aria-label={
        label
      }
      title={
        label
      }
      style={{
        width:
          38,

        height:
          34,

        padding:
          0,

        display:
          "inline-flex",

        alignItems:
          "center",

        justifyContent:
          "center",

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

        opacity:
          disabled
            ? 0.7
            : 1,

        transition:
          "background 120ms ease, color 120ms ease",
      }}
    >
      <ToolbarIcon
        name={
          icon
        }
      />
    </button>
  );
}

function ToolbarIcon({
  name,
}: {
  name: ToolbarIconName;
}) {
  const commonProps = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap:
      "round" as const,
    strokeLinejoin:
      "round" as const,
    "aria-hidden":
      true,
  };

  switch (name) {
    case "add":
      return (
        <svg {...commonProps}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );

    case "undo":
      return (
        <svg {...commonProps}>
          <path d="M9 14 4 9l5-5" />
          <path d="M4 9h10a6 6 0 0 1 6 6v1" />
        </svg>
      );

    case "redo":
      return (
        <svg {...commonProps}>
          <path d="m15 14 5-5-5-5" />
          <path d="M20 9H10a6 6 0 0 0-6 6v1" />
        </svg>
      );

    case "move":
      return (
        <svg {...commonProps}>
          <path d="M12 3v18" />
          <path d="m8 7 4-4 4 4" />
          <path d="m8 17 4 4 4-4" />
          <path d="M3 12h18" />
          <path d="m7 8-4 4 4 4" />
          <path d="m17 8 4 4-4 4" />
        </svg>
      );

    case "rotate":
      return (
        <svg {...commonProps}>
          <path d="M20 11a8 8 0 1 0-2.3 5.7" />
          <path d="M20 5v6h-6" />
        </svg>
      );

    case "scale":
      return (
        <svg {...commonProps}>
          <path d="M4 9V4h5" />
          <path d="M20 9V4h-5" />
          <path d="M4 15v5h5" />
          <path d="M20 15v5h-5" />
          <path d="M4 4l6 6" />
          <path d="m20 4-6 6" />
          <path d="m4 20 6-6" />
          <path d="m20 20-6-6" />
        </svg>
      );

    case "help":
      return (
        <svg {...commonProps}>
          <circle
            cx="12"
            cy="12"
            r="9"
          />
          <path d="M9.7 9a2.4 2.4 0 1 1 4.5 1.2c-.7 1-2.2 1.3-2.2 2.8" />
          <path d="M12 16h.01" />
        </svg>
      );

    case "save":
      return (
        <svg {...commonProps}>
          <path d="M5 4h12l2 2v14H5z" />
          <path d="M8 4v6h8V4" />
          <path d="M8 20v-6h8v6" />
        </svg>
      );

    case "download":
      return (
        <svg {...commonProps}>
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      );

    case "folder":
      return (
        <svg {...commonProps}>
          <path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M3 9h18" />
        </svg>
      );

    case "publish":
      return (
        <svg {...commonProps}>
          <path d="M12 16V4" />
          <path d="m7 9 5-5 5 5" />
          <path d="M5 20h14" />
          <path d="M7 16h10" />
        </svg>
      );

    case "deploy":
      return (
        <svg {...commonProps}>
          <path d="M12 3v11" />
          <path d="m7 10 5 5 5-5" />
          <path d="M4 18v3h16v-3" />
        </svg>
      );

    default:
      return null;
  }
}