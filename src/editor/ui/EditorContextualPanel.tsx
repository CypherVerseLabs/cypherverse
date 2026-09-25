import React, {
CSSProperties,
ReactElement,
useEffect,
useMemo,
useState,
} from "react";

import {
getIdeaCategories,
getIdeasByCategory,
} from "../ideas";

import { TransformMode } from "../context/transformMode";

import { SceneObject } from "../scene/objectTypes";

import HelpPanel from "./HelpPanel";

type ActivePanel =
| "add"
| "move"
| "rotate"
| "scale"
| "help"
| null;

type Vector3 = [number, number, number];

type EditorContextualPanelProps = {
panel: ActivePanel;

scene: {
objects: SceneObject[];
};

selectedId?: string;

leftPanelCollapsed: boolean;

transformMode: TransformMode;

setTransformMode: (mode: TransformMode) => void;

updateTransform: (
objectId: string,
transform: Partial<SceneObject["transform"]>
) => void;

updateObject: (
  objectId: string,
  changes: {
    modifiers?: SceneObject["modifiers"];
    effects?: SceneObject["effects"];
  }
) => void;



openIdeaFolders: Record<string, boolean>;

toggleIdeaFolder: (category: string) => void;

addIdea: (type: string) => void;

onClose: () => void;
};

export default function EditorContextualPanel({
  panel,
  scene,
  selectedId,
  leftPanelCollapsed,
  transformMode,
  setTransformMode,
  updateTransform,
  updateObject,
  openIdeaFolders,
  toggleIdeaFolder,
  addIdea,
  onClose,
}: EditorContextualPanelProps) {

/*

Keep transform mode synchronized with the
contextual toolbar without updating state
during render.
*/
useEffect(() => {
if (
panel === "move" &&
transformMode !== "translate"
) {
setTransformMode("translate");
}
if (
  panel === "rotate" &&
  transformMode !== "rotate"
) {
  setTransformMode("rotate");
}

if (
  panel === "scale" &&
  transformMode !== "scale"
) {
  setTransformMode("scale");
}

}, [
panel,
transformMode,
setTransformMode,
]);

if (!panel) {
return null;
}

if (panel === "help") {
return (
<HelpPanel onClose={onClose} />
);
}

if (panel === "add") {
return (
<PanelShell
width={400}
height={260}
title="Add Idea"
onClose={onClose}
variant="add"
leftPanelCollapsed={
leftPanelCollapsed
}
>
<AddIdeasPanel
openIdeaFolders={
openIdeaFolders
}
toggleIdeaFolder={
toggleIdeaFolder
}
addIdea={addIdea}
/>
</PanelShell>
);
}

const selectedObject =
scene.objects.find(
(object) =>
object.id === selectedId
);

if (!selectedObject) {
return (
<PanelShell
width={280}
height={115}
title={panelTitle(panel)}
onClose={onClose}
leftPanelCollapsed={
leftPanelCollapsed
}
>
<div style={styles.empty}>
Select an object first to edit
its{" "}
{panelTitle(
panel
).toLowerCase()}{" "}
values.
</div>
</PanelShell>
);
}

const values =
panel === "move"
? selectedObject.transform.position
: panel === "rotate"
? selectedObject.transform.rotation
: selectedObject.transform.scale;

return (
<PanelShell
width={280}
height={125}
title={panelTitle(panel)}
onClose={onClose}
leftPanelCollapsed={
leftPanelCollapsed
}
>
<VectorEditor
label={panelTitle(panel)}
value={values}
onChange={(next) => {
if (panel === "move") {
updateTransform(
selectedObject.id,
{
position: next,
}
);
} else if (
panel === "rotate"
) {
updateTransform(
selectedObject.id,
{
rotation: next,
}
);
} else {
updateTransform(
selectedObject.id,
{
scale: next,
}
);
}
}}
/>
</PanelShell>
);
}

function panelTitle(
panel: Exclude<ActivePanel, null>
): string {
switch (panel) {
case "move":
return "Move";

case "rotate":
  return "Rotate";

case "scale":
  return "Scale";

case "add":
  return "Add Idea";

case "help":
  return "Help / Details";

}
}

function PanelShell({
title,
children,
onClose,
width,
height,
variant = "default",
leftPanelCollapsed,
}: {
title: string;

children:
| ReactElement
| ReactElement[];

onClose: () => void;

width: number;

height?: number;

variant?: "default" | "add";

leftPanelCollapsed: boolean;
}) {
/*

Left panel:
160px wide


Contextual panel:
starts immediately to its right


Toolbar:
remains underneath both panels.
*/
const left =
leftPanelCollapsed
? 58
: 180;

return (
<div
style={{
...styles.shell,
width,
height,
left,
bottom: 70,
}}
>
<div style={styles.header}>
<div style={styles.title}>
{title}
</div>

    <button
      type="button"
      onClick={onClose}
      style={styles.close}
      title="Close"
      aria-label="Close"
    >
      ×
    </button>
  </div>

  <div style={styles.body}>
    {children}
  </div>
</div>

);
}

function VectorEditor({
label,
value,
onChange,
}: {
label: string;

value: Vector3;

onChange: (value: Vector3) => void;
}) {
return (
<div>
<div style={styles.subtle}>
{label} — X / Y / Z
</div>

  <div style={styles.axisGrid}>
    {(
      ["X", "Y", "Z"] as const
    ).map((axis, index) => (
      <label
        key={axis}
        style={styles.axisLabel}
      >
        <span style={styles.axisName}>
          {axis}
        </span>

        <input
          type="number"
          step="0.01"
          value={value[index]}
          onChange={(event) => {
            const next = Number(
              event.target.value
            );

            if (
              !Number.isFinite(next)
            ) {
              return;
            }

            const updated =
              [...value] as Vector3;

            updated[index] = next;

            onChange(updated);
          }}
          style={styles.input}
        />
      </label>
    ))}
  </div>
</div>

);
}

function AddIdeasPanel({
openIdeaFolders,
toggleIdeaFolder,
addIdea,
}: {
openIdeaFolders: Record<string, boolean>;

toggleIdeaFolder: (
category: string
) => void;

addIdea: (type: string) => void;
}) {
const categories = getIdeaCategories();

const [activeCategory, setActiveCategory] =
useState("All");

const [page, setPage] = useState(1);

const allIdeas = useMemo(() => {
return categories.flatMap(
(category) =>
getIdeasByCategory(category).map(
(idea: any) => ({
idea,
category,
})
)
);
}, [categories]);

const ideas =
activeCategory === "All"
? allIdeas.map(
({ idea }) => idea
)
: getIdeasByCategory(
activeCategory
);

/*

Compact pagination.
Three Ideas per page keeps the panel
clean without making it taller.
*/
const pageSize = 3;

const totalPages = Math.max(
1,
Math.ceil(
ideas.length / pageSize
)
);

const safePage = Math.min(
page,
totalPages
);

const visibleIdeas = ideas.slice(
(safePage - 1) * pageSize,
safePage * pageSize
);

const selectCategory = (
category: string
) => {
setActiveCategory(category);
setPage(1);

if (
  category !== "All" &&
  !openIdeaFolders[category]
) {
  toggleIdeaFolder(category);
}

};

return (
<div style={styles.addLayout}>
{/* CATEGORY COLUMN */}
<div style={styles.categoryColumn}>
<button
type="button"
onClick={() =>
selectCategory("All")
}
style={{
...styles.categoryItem,
...(activeCategory === "All"
? styles.categoryActive
: {}),
}}
>
All
</button>

    {categories.map(
      (category) => (
        <button
          key={category}
          type="button"
          onClick={() =>
            selectCategory(
              category
            )
          }
          style={{
            ...styles.categoryItem,
            ...(activeCategory ===
            category
              ? styles.categorySelected
              : {}),
          }}
        >
          {category}
        </button>
      )
    )}
  </div>

  {/* IDEA AREA */}
  <div style={styles.ideaArea}>
    <div style={styles.ideaAreaHeader}>
      <div style={styles.ideaAreaTitle}>
        {activeCategory === "All"
          ? "All Ideas"
          : activeCategory}
      </div>

      <button
        type="button"
        onClick={() =>
          window.alert(
            "Idea upload is available through the project asset workflow."
          )
        }
        style={styles.upload}
      >
        + Upload
      </button>
    </div>

    <div style={styles.ideaList}>
      {visibleIdeas.map(
        (idea: any, index) => {
          const ideaType =
            typeof idea ===
            "string"
              ? idea
              : idea.type ??
                idea.id;

          const ideaLabel =
            typeof idea ===
            "string"
              ? idea
              : idea.name ??
                idea.label ??
                idea.type;

          const description =
            typeof idea ===
            "string"
              ? `Add ${idea} to the world.`
              : idea.description ??
                `Add ${ideaLabel} to the world.`;

          return (
            <div
              key={`${ideaType}-${index}`}
              style={styles.ideaCard}
            >
              <div
                style={
                  styles.ideaIcon
                }
              >
                +
              </div>

              <div
                style={
                  styles.ideaInfo
                }
              >
                <div
                  style={
                    styles.ideaName
                  }
                >
                  {String(
                    ideaLabel
                  )}
                </div>

                <div
                  style={
                    styles.ideaDescription
                  }
                >
                  {String(
                    description
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  addIdea(
                    String(
                      ideaType
                    )
                  )
                }
                style={
                  styles.addButton
                }
              >
                Add
              </button>
            </div>
          );
        }
      )}

      {visibleIdeas.length ===
        0 && (
        <div style={styles.noIdeas}>
          No Ideas in this
          category yet.
        </div>
      )}
    </div>

    <div style={styles.pagination}>
      <button
        type="button"
        disabled={safePage <= 1}
        onClick={() =>
          setPage(
            Math.max(
              1,
              safePage - 1
            )
          )
        }
        style={{
          ...styles.pageButton,
          opacity:
            safePage <= 1
              ? 0.4
              : 1,
        }}
      >
        ‹
      </button>

      <span>
        {safePage} / {totalPages}
      </span>

      <button
        type="button"
        disabled={
          safePage >= totalPages
        }
        onClick={() =>
          setPage(
            Math.min(
              totalPages,
              safePage + 1
            )
          )
        }
        style={{
          ...styles.pageButton,
          opacity:
            safePage >=
            totalPages
              ? 0.4
              : 1,
        }}
      >
        ›
      </button>
    </div>
  </div>
</div>

);
}

const styles: Record<string, CSSProperties> = {
shell: {
position: "absolute",

boxSizing: "border-box",

overflow: "hidden",

borderRadius: 11,

background:
  "rgba(242, 243, 245, 0.98)",

border:
  "1px solid rgba(30, 32, 36, 0.12)",

boxShadow:
  "0 10px 28px rgba(0,0,0,0.14)",

pointerEvents: "auto",

zIndex: 35,

color: "#292c32",

},

header: {
height: 34,

display: "flex",
alignItems: "center",
justifyContent:
  "space-between",

padding:
  "0 7px 0 10px",

boxSizing:
  "border-box",

background:
  "#e9eaec",

borderBottom:
  "1px solid rgba(30,32,36,0.09)",

},

title: {
fontSize: 10,
fontWeight: 800,

color: "#292c32",

},

close: {
width: 23,
height: 23,

border: 0,
borderRadius: 6,

background:
  "#dedfe2",

color: "#454a51",

cursor: "pointer",

fontSize: 15,
lineHeight: 1,

},

body: {
height: "calc(100% - 34px)",

padding: 8,

overflowY: "auto",

boxSizing: "border-box",

},

subtle: {
fontSize: 8,

color: "#656a72",

marginBottom: 7,

},

axisGrid: {
display: "grid",

gridTemplateColumns:
  "repeat(3, 1fr)",

gap: 6,

},

axisLabel: {
display: "flex",

flexDirection: "column",

gap: 3,

fontSize: 8,

color: "#454a51",

fontWeight: 700,

},

axisName: {
color: "#454a51",
},

input: {
boxSizing: "border-box",

width: "100%",

height: 29,

padding:
  "5px 6px",

borderRadius: 6,

border:
  "1px solid rgba(30,32,36,0.16)",

background:
  "#ffffff",

color: "#1f2328",

WebkitTextFillColor:
  "#1f2328",

outline: "none",

fontSize: 10,

fontWeight: 700,

},

empty: {
padding: 10,

borderRadius: 7,

background:
  "#e8e9eb",

color: "#555a62",

fontSize: 9,

lineHeight: 1.45,

textAlign: "center",

},

addLayout: {
display: "grid",

gridTemplateColumns:
  "92px minmax(0, 1fr)",

gap: 8,

width: "100%",

height: "100%",

minHeight: 0,

},

categoryColumn: {
display: "flex",

flexDirection: "column",

gap: 3,

padding: 4,

borderRadius: 8,

background:
  "#e7e8ea",

overflowY: "auto",

minHeight: 0,

},

categoryItem: {
width: "100%",

minHeight: 25,

flexShrink: 0,

padding:
  "0 7px",

border: 0,

borderRadius: 6,

background:
  "transparent",

color: "#4e535a",

cursor: "pointer",

textAlign: "left",

fontSize: 8,

fontWeight: 700,

},

categoryActive: {
background:
"#5d83ee",

color:
  "#ffffff",

},

categorySelected: {
background:
"#d7dce8",

color:
  "#354875",

},

ideaArea: {
minWidth: 0,

minHeight: 0,

display: "flex",

flexDirection: "column",

},

ideaAreaHeader: {
display: "flex",

alignItems: "center",

justifyContent:
  "space-between",

gap: 6,

marginBottom: 5,

},

ideaAreaTitle: {
fontSize: 9,

fontWeight: 800,

color: "#4f545b",

},

upload: {
flexShrink: 0,

padding:
  "4px 7px",

border: 0,

borderRadius: 5,

background:
  "#dedfe2",

color: "#454a51",

fontSize: 8,

fontWeight: 700,

cursor: "pointer",

},

ideaList: {
display: "flex",

flexDirection: "column",

gap: 4,

flex: 1,

minHeight: 0,

overflowY: "auto",

paddingRight: 2,

},

ideaCard: {
minHeight: 48,

flexShrink: 0,

display: "flex",

alignItems: "center",

gap: 6,

padding:
  "5px 6px",

border:
  "1px solid rgba(30,32,36,0.08)",

borderRadius: 7,

background:
  "#f8f8f9",

},

ideaIcon: {
width: 23,
height: 23,

flexShrink: 0,

display: "flex",

alignItems: "center",

justifyContent: "center",

borderRadius: 6,

background:
  "#dedfe2",

color:
  "#60656c",

fontWeight: 900,

fontSize: 12,

},

ideaInfo: {
flex: 1,

minWidth: 0,

},

ideaName: {
overflow: "hidden",

textOverflow: "ellipsis",

whiteSpace: "nowrap",

fontSize: 9,

fontWeight: 800,

color:
  "#30343a",

marginBottom: 1,

},

ideaDescription: {
overflow: "hidden",

textOverflow: "ellipsis",

whiteSpace: "nowrap",

fontSize: 7.5,

lineHeight: 1.3,

color:
  "#6c7178",

},

addButton: {
flexShrink: 0,

padding:
  "5px 8px",

border: 0,

borderRadius: 5,

background:
  "#5d83ee",

color:
  "#ffffff",

cursor: "pointer",

fontSize: 8,

fontWeight: 800,

},

noIdeas: {
padding: 12,

borderRadius: 7,

background:
  "#e8e9eb",

color:
  "#686d74",

textAlign: "center",

fontSize: 8,

},

pagination: {
display: "flex",

alignItems: "center",

justifyContent:
  "center",

gap: 7,

marginTop: 5,

paddingTop: 5,

borderTop:
  "1px solid rgba(30,32,36,0.08)",

fontSize: 8,

fontWeight: 800,

color:
  "#555a62",

},

pageButton: {
width: 21,
height: 21,

border: 0,

borderRadius: 5,

background:
  "#dedfe2",

color:
  "#454a51",

cursor: "pointer",

fontSize: 13,

},
};