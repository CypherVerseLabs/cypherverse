
import React, { CSSProperties, useState } from "react";

type HelpPanelProps = {
  onClose: () => void;
};

const styles: Record<string, CSSProperties> = {
  shell: {
    position: "absolute",
    right: 10,
    bottom: 70,
    width: 160,
    height: 250,
    background: "#eeeeee",
    border: "1px solid #d4d4d4",
    borderRadius: 12,
    boxShadow: "0 5px 18px rgba(0, 0, 0, 0.14)",
    color: "#202020",
    overflow: "hidden",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    zIndex: 30,
    display: "flex",
    flexDirection: "column",
  },

  header: {
    height: 34,
    minHeight: 34,
    padding: "0 8px 0 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #d7d7d7",
    background: "#e7e7e7",
  },

  title: {
    fontSize: 12,
    fontWeight: 700,
    color: "#202020",
  },

  closeButton: {
    width: 22,
    height: 22,
    border: "none",
    borderRadius: 6,
    background: "transparent",
    color: "#555555",
    cursor: "pointer",
    fontSize: 15,
    lineHeight: "22px",
    padding: 0,
  },

  body: {
    flex: 1,
    overflowY: "auto",
    padding: 7,
  },

  section: {
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 9,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: "#666666",
    marginBottom: 4,
  },

  row: {
    fontSize: 9,
    lineHeight: 1.35,
    color: "#333333",
    marginBottom: 3,
  },

  shortcutRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
    marginBottom: 3,
  },

  shortcut: {
    minWidth: 28,
    padding: "2px 4px",
    borderRadius: 4,
    background: "#dddddd",
    border: "1px solid #cfcfcf",
    fontSize: 8,
    fontWeight: 700,
    color: "#333333",
    textAlign: "center",
  },

  shortcutText: {
    flex: 1,
    fontSize: 9,
    color: "#333333",
  },

  proButton: {
    width: "100%",
    minHeight: 27,
    border: "1px solid #c9c9c9",
    borderRadius: 7,
    background: "#e2e2e2",
    color: "#222222",
    cursor: "pointer",
    padding: "5px 7px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 9,
    fontWeight: 700,
    textAlign: "left",
  },

  proContent: {
    marginTop: 5,
    padding: 6,
    borderRadius: 7,
    background: "#e4e4e4",
    border: "1px solid #d0d0d0",
  },

  proItem: {
    fontSize: 8,
    lineHeight: 1.35,
    color: "#444444",
    marginBottom: 4,
  },
};

export default function HelpPanel({ onClose }: HelpPanelProps) {
  const [showProFeatures, setShowProFeatures] = useState(false);

  return (
    <div style={styles.shell}>
      <div style={styles.header}>
        <div style={styles.title}>Help</div>

        <button
          type="button"
          onClick={onClose}
          style={styles.closeButton}
          aria-label="Close help"
        >
          ×
        </button>
      </div>

      <div style={styles.body}>
        <section style={styles.section}>
          <div style={styles.sectionTitle}>Editor Controls</div>

          <div style={styles.shortcutRow}>
            <span style={styles.shortcut}>C</span>
            <span style={styles.shortcutText}>Copy</span>
          </div>

          <div style={styles.shortcutRow}>
            <span style={styles.shortcut}>V</span>
            <span style={styles.shortcutText}>Paste</span>
          </div>

          <div style={styles.shortcutRow}>
            <span style={styles.shortcut}>D</span>
            <span style={styles.shortcutText}>Duplicate</span>
          </div>

          <div style={styles.shortcutRow}>
            <span style={styles.shortcut}>Del</span>
            <span style={styles.shortcutText}>Delete</span>
          </div>

          <div style={styles.shortcutRow}>
            <span style={styles.shortcut}>Z</span>
            <span style={styles.shortcutText}>Undo</span>
          </div>

          <div style={styles.shortcutRow}>
            <span style={styles.shortcut}>E</span>
            <span style={styles.shortcutText}>Toggle editor</span>
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionTitle}>Model Troubleshooting</div>

          <div style={styles.row}>
            • Make sure the model has a supported format.
          </div>

          <div style={styles.row}>
            • Check that textures are included.
          </div>

          <div style={styles.row}>
            • Re-import the asset if it appears missing.
          </div>
        </section>

        <section style={styles.section}>
          <div style={styles.sectionTitle}>Pro Features</div>

          <button
            type="button"
            onClick={() => setShowProFeatures((open) => !open)}
            style={styles.proButton}
          >
            <span>Pro Features</span>
            <span>{showProFeatures ? "−" : "+"}</span>
          </button>

          {showProFeatures && (
            <div style={styles.proContent}>
              <div style={styles.proItem}>
                • Advanced project persistence
              </div>

              <div style={styles.proItem}>• Project publishing</div>

              <div style={styles.proItem}>• Multiplayer workflows</div>

              <div style={styles.proItem}>• XR creation tools</div>

              <div style={{ ...styles.proItem, marginBottom: 0 }}>
                • Advanced editor capabilities
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

