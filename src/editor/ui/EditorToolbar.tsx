import React from "react";

type ActivePanel =
  | "add"
  | "move"
  | "rotate"
  | "scale"
  | "help"
  | null;

type EditorToolbarProps = {
  activePanel: ActivePanel;
  canUndo: boolean;
  canRedo: boolean;
  onAdd: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onMove: () => void;
  onRotate: () => void;
  onScale: () => void;
  onHelp: () => void;
  onSave: () => void;
  onLoad: () => void;
  onProject: () => void;
  onPublish: () => void;
  projectId?: string;
  projectSaving: boolean;
  projectLoading: boolean;
};

const buttonStyle = (
  active = false,
  disabled = false
): React.CSSProperties => ({
  height: 40,
  minWidth: 66,
  padding: "0 12px",
  border: 0,
  borderRadius: 8,
  background: disabled
    ? "#202128"
    : active
      ? "#4c7dff"
      : "#30323b",
  color: disabled ? "#5d6472" : "#f4f5f7",
  cursor: disabled ? "default" : "pointer",
  fontSize: 11,
  fontWeight: 700,
  whiteSpace: "nowrap",
  transition: "background 120ms ease, transform 120ms ease",
});

export default function EditorToolbar({
  activePanel,
  canUndo,
  canRedo,
  onAdd,
  onUndo,
  onRedo,
  onMove,
  onRotate,
  onScale,
  onHelp,
  onSave,
  onLoad,
  onProject,
  onPublish,
  projectId,
  projectSaving,
  projectLoading,
}: EditorToolbarProps) {
  return (
    <div style={styles.toolbar}>
      <button
        type="button"
        onClick={onAdd}
        title="Add Idea"
        style={buttonStyle(activePanel === "add")}
      >
        <span style={styles.icon}>＋</span>
        Add
      </button>

      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo"
        style={buttonStyle(false, !canUndo)}
      >
        <span style={styles.icon}>↶</span>
        Undo
      </button>

      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo"
        style={buttonStyle(false, !canRedo)}
      >
        <span style={styles.icon}>↷</span>
        Redo
      </button>

      <div style={styles.separator} />

      <button
        type="button"
        onClick={onMove}
        title="Move"
        style={buttonStyle(activePanel === "move")}
      >
        Move
      </button>

      <button
        type="button"
        onClick={onRotate}
        title="Rotate"
        style={buttonStyle(activePanel === "rotate")}
      >
        Rotate
      </button>

      <button
        type="button"
        onClick={onScale}
        title="Scale"
        style={buttonStyle(activePanel === "scale")}
      >
        Scale
      </button>

      <div style={styles.separator} />

      <button
        type="button"
        onClick={onHelp}
        title="Help"
        style={buttonStyle(activePanel === "help")}
      >
        <span style={styles.icon}>?</span>
        Help
      </button>

      <button
        type="button"
        onClick={onSave}
        title="Save project to file"
        style={buttonStyle()}
      >
        <span style={styles.icon}>↓</span>
        Save
      </button>

      <button
        type="button"
        onClick={onLoad}
        title="Load project from file"
        style={buttonStyle()}
      >
        <span style={styles.icon}>↑</span>
        Load
      </button>

      <button
        type="button"
        onClick={onProject}
        disabled={!projectId || projectLoading}
        title={projectId ? "Load project" : "No project selected"}
        style={buttonStyle(false, !projectId || projectLoading)}
      >
        {projectLoading ? "Loading..." : "Project"}
      </button>

      <button
        type="button"
        onClick={onPublish}
        disabled={!projectId || projectSaving}
        title={projectId ? "Publish project" : "No project selected"}
        style={{
          ...buttonStyle(false, !projectId || projectSaving),
          background:
            !projectId || projectSaving ? "#202128" : "#4c7dff",
        }}
      >
        {projectSaving ? "Publishing..." : "Publish"}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    position: "absolute",
    left: "50%",
    bottom: 16,
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: 6,
    maxWidth: "calc(100vw - 32px)",
    padding: 7,
    overflowX: "auto",
    borderRadius: 13,
    background: "rgba(24, 25, 31, 0.98)",
    border: "1px solid rgba(255, 255, 255, 0.11)",
    boxShadow: "0 18px 45px rgba(0, 0, 0, 0.38)",
    pointerEvents: "auto",
    zIndex: 50,
    scrollbarWidth: "none",
  },

  icon: {
    marginRight: 4,
    fontSize: 14,
  },

  separator: {
    width: 1,
    height: 24,
    flexShrink: 0,
    background: "rgba(255, 255, 255, 0.1)",
  },
};