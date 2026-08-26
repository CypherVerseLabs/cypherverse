import {
  ChangeEvent,
  RefObject,
  Dispatch,
  SetStateAction,
} from "react";

import {
  getIdeaCategories,
  getIdeasByCategory,
} from "../ideas";

import {
  SceneObject,
} from "../scene/objectTypes";

import SceneHierarchy from "../scene/SceneHierarchy";


type EditorLeftPanelProps = {

  leftPanelCollapsed: boolean;

  setLeftPanelCollapsed:
    Dispatch<SetStateAction<boolean>>;


  scene: any;

  selectedId?: string;

  select: (
    id?: string
  ) => void;


  canUndo: boolean;

  canRedo: boolean;

  undo: () => void;

  redo: () => void;


  saveScene: () => void;


  fileInputRef:
  RefObject<HTMLInputElement>;

  handleLoadFile:
    (
      event: ChangeEvent<HTMLInputElement>
    ) => void;


  projectId?: string;

  projectSaving: boolean;

  projectLoading: boolean;

  handlePublishProject:
    () => Promise<void>;

  handleLoadProject:
    () => Promise<void>;


  transformMode:
    "translate" |
    "rotate" |
    "scale";

  setTransformMode:
    (
      mode:
        "translate" |
        "rotate" |
        "scale"
    ) => void;


  openIdeaFolders:
    Record<string, boolean>;

  toggleIdeaFolder:
    (category: string) => void;


  addIdea:
    (
      type: SceneObject["type"]
    ) => void;
};


export default function EditorLeftPanel({
  leftPanelCollapsed,
  setLeftPanelCollapsed,

  scene,
  selectedId,

  select,

  canUndo,
  canRedo,

  undo,
  redo,

  saveScene,

  fileInputRef,
  handleLoadFile,

  projectId,

  projectSaving,
  projectLoading,

  handlePublishProject,
  handleLoadProject,

  transformMode,
  setTransformMode,

  openIdeaFolders,
  toggleIdeaFolder,

  addIdea,

}: EditorLeftPanelProps) {

  return (
    <div
      style={{
        width:
          leftPanelCollapsed
            ? 42
            : 240,

        height:
          "calc(100vh - 32px)",

        margin:
          "16px 0 16px 16px",

        transform:
          "translateX(400px)",

        padding:
          leftPanelCollapsed
            ? 6
            : 12,

        boxSizing:
          "border-box",

        borderRadius:
          12,

        background:
          "rgba(18, 18, 22, 0.94)",

        border:
          "1px solid rgba(255,255,255,0.1)",

        boxShadow:
          "0 10px 30px rgba(0,0,0,0.3)",

        pointerEvents:
          "auto",

        display:
          "flex",

        flexDirection:
          "column",

        transition:
          "width 160ms ease, padding 160ms ease",

        overflow:
          "hidden",
      }}
    >

      {/* HEADER */}

      <div
        style={{
          display: "flex",

          alignItems:
            "center",

          justifyContent:
            leftPanelCollapsed
              ? "center"
              : "space-between",

          flexShrink: 0,

          marginBottom:
            leftPanelCollapsed
              ? 0
              : 12,
        }}
      >

        {!leftPanelCollapsed && (
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 0.3,
            }}
          >
            CyBuilder
          </div>
        )}

        <button
          onClick={() =>
            setLeftPanelCollapsed(
              !leftPanelCollapsed
            )
          }
          title={
            leftPanelCollapsed
              ? "Expand panel"
              : "Collapse panel"
          }
          style={{
            width: 30,
            height: 30,
            padding: 0,
            border: 0,
            borderRadius: 7,
            background: "#292930",
            color: "#ffffff",
            cursor: "pointer",
            fontSize: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {leftPanelCollapsed
            ? "›"
            : "‹"}
        </button>

      </div>


      {!leftPanelCollapsed && (
        <>

          {/* HISTORY */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: 5,
              marginBottom: 5,
              flexShrink: 0,
            }}
          >

            <button
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl/Cmd+Z)"
              style={{
                padding: "8px 6px",
                border: 0,
                borderRadius: 6,

                background:
                  canUndo
                    ? "#292930"
                    : "#202027",

                color:
                  canUndo
                    ? "#ffffff"
                    : "#55555f",

                cursor:
                  canUndo
                    ? "pointer"
                    : "default",

                fontSize: 11,

                opacity:
                  canUndo
                    ? 1
                    : 0.7,
              }}
            >
              ↶ Undo
            </button>


            <button
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl/Cmd+Shift+Z)"
              style={{
                padding: "8px 6px",
                border: 0,
                borderRadius: 6,

                background:
                  canRedo
                    ? "#292930"
                    : "#202027",

                color:
                  canRedo
                    ? "#ffffff"
                    : "#55555f",

                cursor:
                  canRedo
                    ? "pointer"
                    : "default",

                fontSize: 11,

                opacity:
                  canRedo
                    ? 1
                    : 0.7,
              }}
            >
              ↷ Redo
            </button>

          </div>


          {/* LOCAL SAVE / LOAD */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: 5,
              marginBottom: 5,
              flexShrink: 0,
            }}
          >

            <button
              onClick={saveScene}
              title="Download .cybuilder project"
              style={{
                padding: "8px 6px",
                border: 0,
                borderRadius: 6,
                background: "#343a52",
                color: "#ffffff",
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              ↓ Save
            </button>


            <button
              onClick={() =>
                fileInputRef.current?.click()
              }
              title="Load .cybuilder project"
              style={{
                padding: "8px 6px",
                border: 0,
                borderRadius: 6,
                background: "#292930",
                color: "#ffffff",
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              ↑ Load
            </button>

          </div>


          {/* SERVER PROJECT */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: 5,
              marginBottom: 12,
              flexShrink: 0,
            }}
          >

            <button
              onClick={
                handlePublishProject
              }
              disabled={
                !projectId ||
                projectSaving
              }
              title={
                projectId
                  ? "Publish project to server"
                  : "No project selected"
              }
              style={{
                padding: "8px 6px",
                border: 0,
                borderRadius: 6,

                background:
                  !projectId ||
                  projectSaving
                    ? "#202027"
                    : "#4c7dff",

                color:
                  !projectId ||
                  projectSaving
                    ? "#55555f"
                    : "#ffffff",

                cursor:
                  !projectId ||
                  projectSaving
                    ? "default"
                    : "pointer",

                fontSize: 11,

                opacity:
                  projectSaving
                    ? 0.8
                    : 1,
              }}
            >
              {projectSaving
                ? "Publishing..."
                : "↑ Publish"}
            </button>


            <button
              onClick={
                handleLoadProject
              }
              disabled={
                !projectId ||
                projectLoading
              }
              title={
                projectId
                  ? "Load project from server"
                  : "No project selected"
              }
              style={{
                padding: "8px 6px",
                border: 0,
                borderRadius: 6,

                background:
                  !projectId ||
                  projectLoading
                    ? "#202027"
                    : "#292930",

                color:
                  !projectId ||
                  projectLoading
                    ? "#55555f"
                    : "#ffffff",

                cursor:
                  !projectId ||
                  projectLoading
                    ? "default"
                    : "pointer",

                fontSize: 11,

                opacity:
                  projectLoading
                    ? 0.8
                    : 1,
              }}
            >
              {projectLoading
                ? "Loading..."
                : "↻ Project"}
            </button>

          </div>


          {/* FILE INPUT */}

          <input
            ref={fileInputRef}
            type="file"
            accept=".cybuilder"
            onChange={
              handleLoadFile
            }
            style={{
              display: "none",
            }}
          />

        </>
      )}


      {!leftPanelCollapsed && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            overflowX: "hidden",
            paddingRight: 3,
          }}
        >

          {/* SCENE */}

          <SceneHierarchy
            scene={scene}
            selectedId={selectedId}
            onSelect={select}
          />


          {/* TRANSFORM */}

          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 9,
              opacity: 0.55,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Transform
          </div>


          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, 1fr)",
              gap: 5,
              marginBottom: 18,
            }}
          >

            {(
              [
                ["translate", "Move"],
                ["rotate", "Rotate"],
                ["scale", "Scale"],
              ] as const
            ).map(
              ([mode, label]) => (
                <button
                  key={mode}
                  onClick={() =>
                    setTransformMode(
                      mode
                    )
                  }
                  style={{
                    padding:
                      "8px 4px",

                    border: 0,

                    borderRadius: 6,

                    background:
                      transformMode ===
                      mode
                        ? "#4c7dff"
                        : "#292930",

                    color:
                      "#ffffff",

                    cursor:
                      "pointer",

                    fontSize: 10,
                  }}
                >
                  {label}
                </button>
              )
            )}

          </div>


          {/* DIVIDER */}

          <div
            style={{
              height: 1,
              background:
                "rgba(255,255,255,0.08)",
              margin:
                "4px 0 16px",
            }}
          />


          {/* IDEAS */}

          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              marginBottom: 9,
              opacity: 0.55,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Ideas
          </div>


          {getIdeaCategories().map(
            (category) => {

              const isOpen =
                openIdeaFolders[
                  category
                ] ?? true;

              const ideas =
                getIdeasByCategory(
                  category
                );

              return (
                <div
                  key={category}
                  style={{
                    marginBottom: 10,
                  }}
                >

                  <button
                    onClick={() =>
                      toggleIdeaFolder(
                        category
                      )
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "space-between",
                      width: "100%",
                      padding:
                        "8px 9px",
                      border: 0,
                      borderRadius: 6,
                      background:
                        "#202027",
                      color:
                        "#ffffff",
                      cursor:
                        "pointer",
                      textAlign:
                        "left",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >

                    <span
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: 7,
                      }}
                    >

                      <span
                        style={{
                          fontSize: 10,
                          opacity: 0.6,
                        }}
                      >
                        {isOpen
                          ? "▼"
                          : "▶"}
                      </span>

                      <span>
                        {category}
                      </span>

                    </span>


                    <span
                      style={{
                        fontSize: 9,
                        opacity: 0.4,
                      }}
                    >
                      {ideas.length}
                    </span>

                  </button>


                  {isOpen && (
                    <div
                      style={{
                        marginTop: 5,
                        paddingLeft: 8,
                      }}
                    >

                      {ideas.map(
                        (definition) => (
                          <button
                            key={
                              definition.id
                            }
                            onClick={() =>
                              addIdea(
                                definition.id as SceneObject["type"]
                              )
                            }
                            style={{
                              display:
                                "block",
                              width:
                                "100%",
                              padding:
                                "8px 9px",
                              marginBottom:
                                4,
                              border: 0,
                              borderRadius:
                                6,
                              background:
                                "#292930",
                              color:
                                "#ffffff",
                              textAlign:
                                "left",
                              cursor:
                                "pointer",
                              fontSize:
                                11,
                            }}
                          >

                            <span
                              style={{
                                opacity:
                                  0.5,
                                marginRight:
                                  6,
                              }}
                            >
                              +
                            </span>

                            {
                              definition.name
                            }

                          </button>
                        )
                      )}

                    </div>
                  )}

                </div>
              );
            }
          )}

        </div>
      )}

    </div>
  );
}