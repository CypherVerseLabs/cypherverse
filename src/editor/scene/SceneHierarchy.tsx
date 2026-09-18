import { useMemo, useState } from "react";

import { Scene, SceneObject } from "../scene/objectTypes";

type SceneHierarchyProps = {
  collapsed?: boolean;
  scene: Scene;
  selectedId?: string;
  onSelect: (id?: string) => void;
};

function getObjectDisplayName(object: SceneObject, index: number): string {
  switch (object.type) {
    case "infinitePlane": return `Infinite Plane ${index + 1}`;
    case "hdri": return `HDRI ${index + 1}`;
    case "background": return `Background ${index + 1}`;
    case "image": return `Image ${index + 1}`;
    case "model": return `Model ${index + 1}`;
    case "video": return `Video ${index + 1}`;
    case "audio": return `Audio ${index + 1}`;
    case "fog": return `Fog ${index + 1}`;
    case "cloudySky": return `Cloudy Sky ${index + 1}`;
    case "rain": return `Rain ${index + 1}`;
    case "title": return `Title ${index + 1}`;
    case "link": return `Link ${index + 1}`;
    case "speaker": return `Speaker ${index + 1}`;
    case "ground": return `Ground ${index + 1}`;
    case "lostFloor": return `Lost Floor ${index + 1}`;
    default: return `Object ${index + 1}`;
  }
}

export default function SceneHierarchy({
  collapsed = false,
  scene,
  selectedId,
  onSelect,
}: SceneHierarchyProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const indexes = useMemo(() => {
    const counters = new Map<SceneObject["type"], number>();
    const result = new Map<string, number>();

    for (const object of scene.objects) {
      const current = counters.get(object.type) ?? 0;
      result.set(object.id, current);
      counters.set(object.type, current + 1);
    }

    return result;
  }, [scene.objects]);

  if (collapsed) return null;

  const roots = scene.objects.filter(
    (object) =>
      object.parentId === undefined ||
      !scene.objects.some((parent) => parent.id === object.parentId)
  );

  const toggleExpanded = (id: string) => {
    setExpanded((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  return (
    <div>
      {roots.length === 0 ? (
        <div style={styles.empty}>Empty scene</div>
      ) : (
        <div>
          {roots.map((object) => (
            <HierarchyItem
              key={object.id}
              object={object}
              level={0}
              selectedId={selectedId}
              expanded={expanded}
              scene={scene}
              indexes={indexes}
              onSelect={onSelect}
              onToggle={toggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type HierarchyItemProps = {
  object: SceneObject;
  level: number;
  selectedId?: string;
  expanded: Record<string, boolean>;
  scene: { objects: SceneObject[] };
  indexes: Map<string, number>;
  onSelect: (id?: string) => void;
  onToggle: (id: string) => void;
};

function HierarchyItem({
  object,
  level,
  selectedId,
  expanded,
  scene,
  indexes,
  onSelect,
  onToggle,
}: HierarchyItemProps) {
  const children = scene.objects.filter((child) => child.parentId === object.id);
  const hasChildren = children.length > 0;
  const isExpanded = expanded[object.id] ?? true;
  const isSelected = selectedId === object.id;
  const index = indexes.get(object.id) ?? 0;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          minWidth: 0,
          marginBottom: 3,
          borderRadius: 6,
          background: isSelected ? "#5d83ee" : "transparent",
        }}
      >
        <button
          type="button"
          disabled={!hasChildren}
          aria-label={hasChildren ? (isExpanded ? "Collapse" : "Expand") : undefined}
          onClick={() => {
            if (hasChildren) onToggle(object.id);
          }}
          style={{
            width: 24,
            height: 30,
            marginLeft: 6 + level * 16,
            padding: 0,
            border: 0,
            background: "transparent",
            color: hasChildren ? (isSelected ? "#ffffff" : "#777c84") : "transparent",
            cursor: hasChildren ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 8,
            flexShrink: 0,
          }}
        >
          {hasChildren ? (isExpanded ? "▼" : "▶") : "•"}
        </button>

        <button
          type="button"
          onClick={() => onSelect(object.id)}
          style={{
            display: "flex",
            alignItems: "center",
            flex: 1,
            minWidth: 0,
            height: 30,
            padding: "0 6px 0 0",
            border: 0,
            background: "transparent",
            color: isSelected ? "#ffffff" : "#3e4248",
            cursor: "pointer",
            textAlign: "left",
            fontSize: 11,
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 7,
              height: 7,
              marginRight: 7,
              borderRadius: "50%",
              background: isSelected ? "#ffffff" : "#9a9ea5",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              opacity: object.visible === false ? 0.4 : 1,
            }}
          >
            {getObjectDisplayName(object, index)}
          </span>
          {object.locked && (
            <span
              aria-label="Locked"
              style={{
                marginLeft: "auto",
                paddingLeft: 5,
                opacity: 0.55,
                fontSize: 9,
                flexShrink: 0,
              }}
            >
              🔒
            </span>
          )}
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {children.map((child) => (
            <HierarchyItem
              key={child.id}
              object={child}
              level={level + 1}
              selectedId={selectedId}
              expanded={expanded}
              scene={scene}
              indexes={indexes}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  empty: {
    padding: 10,
    borderRadius: 7,
    background: "#e5e6e8",
    color: "#8a8e95",
    fontSize: 10,
    textAlign: "center",
  },
};
