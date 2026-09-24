import {
  Dispatch,
  SetStateAction,
} from "react";

import {
  AnyIdeaDefinition,
} from "../ideas";

import {
  SceneObject,
} from "../scene/objectTypes";

import PropertyEditor from "./PropertyEditor";


/* =========================================
   TYPES
========================================= */

type EditorLeftPanelProps = {
  leftPanelCollapsed: boolean;

  setLeftPanelCollapsed:
    Dispatch<
      SetStateAction<boolean>
    >;

  scene: any;

  selectedId?: string;

  selectedObject?: SceneObject;

  selectedDefinition?:
    AnyIdeaDefinition;

  select: (
    id?: string
  ) => void;

  updateObject: (
    id: string,
    updates: Partial<SceneObject>
  ) => void;

  updateTransform: (
    id: string,
    transform:
      Partial<
        SceneObject["transform"]
      >
  ) => void;

  clipboardObject?: SceneObject;

  setClipboardObject:
    Dispatch<
      SetStateAction<
        SceneObject | undefined
      >
    >;

  addObject: (
    object: SceneObject
  ) => void;

  duplicateObject: (
    id: string
  ) => void;

  removeObject: (
    id: string
  ) => void;
};


/* =========================================
   COMPONENT
========================================= */

export default function EditorLeftPanel({
  leftPanelCollapsed,
  setLeftPanelCollapsed,
  selectedObject,
  selectedDefinition,
  updateObject,
  updateTransform,
  clipboardObject,
  setClipboardObject,
  addObject,
  duplicateObject,
  removeObject,
}: EditorLeftPanelProps) {


  /* =======================================
     COLLAPSED
  ======================================= */

  if (
    leftPanelCollapsed
  ) {
    return (
      <div
        style={{
          position:
            "absolute",

          left:
            16,

          top:
            16,

          width:
            42,

          height:
            42,

          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          background:
            "#b30707",

          border:
            "1px solid #d2d2d2",

          borderRadius:
            9,

          boxShadow:
            "0 8px 24px rgba(0,0,0,0.14)",

          pointerEvents:
            "auto",

          zIndex:
            30,
        }}
      >

        <button
          type="button"

          onClick={() =>
            setLeftPanelCollapsed(
              false
            )
          }

          title="Expand"

          style={{
            width:
              30,

            height:
              30,

            border:
              0,

            borderRadius:
              7,

            background:
              "transparent",

            color:
              "#444",

            cursor:
              "pointer",

            fontSize:
              18,
          }}
        >
          ›
        </button>

      </div>
    );
  }


  /* =======================================
     EXPANDED PANEL
  ======================================= */

  return (
    <div
      style={{
        position:
          "absolute",

        left:
          16,

        top:
          16,

        width:
          250,

        maxHeight:
          "calc(100vh - 110px)",

        boxSizing:
          "border-box",

        padding:
          12,

        background:
          "#e9e9e9",

        color:
          "#25282d",

        border:
          "1px solid #d2d2d2",

        borderRadius:
          10,

        boxShadow:
          "0 8px 24px rgba(0,0,0,0.16)",

        pointerEvents:
          "auto",

        overflowY:
          "auto",

        zIndex:
          30,

        fontFamily:
          "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >

      {/* =================================
          HEADER
      ================================= */}

      <div
        style={{
          display:
            "flex",

          alignItems:
            "center",

          justifyContent:
            "space-between",

          marginBottom:
            12,
        }}
      >

        <div
          style={{
            fontSize:
              12,

            fontWeight:
              700,

            letterSpacing:
              0.5,

            color:
              "#333",
          }}
        >
          SELECTED OBJECT
        </div>


        <button
          type="button"

          onClick={() =>
            setLeftPanelCollapsed(
              true
            )
          }

          title="Collapse"

          style={{
            width:
              26,

            height:
              26,

            padding:
              0,

            border:
              0,

            borderRadius:
              6,

            background:
              "#dcdcdc",

            color:
              "#555",

            cursor:
              "pointer",

            fontSize:
              16,

            lineHeight:
              "26px",
          }}
        >
          ‹
        </button>

      </div>


      {/* =================================
          NO SELECTION
      ================================= */}

      {!selectedObject && (
        <div
          style={{
            padding:
              "24px 12px",

            textAlign:
              "center",

            color:
              "#777",

            fontSize:
              12,

            lineHeight:
              1.5,
          }}
        >
          Select an object to edit
          its properties.
        </div>
      )}


      {/* =================================
          SELECTED OBJECT
      ================================= */}

      {selectedObject && (
        <>
          {/* =================================
              IDEA HEADER
          ================================= */}

          <div
            style={{
              padding:
                "10px 11px",

              marginBottom:
                10,

              background:
                "#f4f4f4",

              border:
                "1px solid #d7d7d7",

              borderRadius:
                7,
            }}
          >

            <div
              style={{
                fontSize:
                  10,

                color:
                  "#777",

                marginBottom:
                  4,

                textTransform:
                  "uppercase",

                letterSpacing:
                  0.6,
              }}
            >
              Idea
            </div>


            <div
              style={{
                fontSize:
                  13,

                fontWeight:
                  700,

                color:
                  "#222",
              }}
            >
              {
                selectedDefinition?.name ??
                selectedObject.type
              }
            </div>

          </div>


          {/* =================================
              DEBUG ID / TYPE
          ================================= */}

          <DebugSection
            title="Debug"
          >

            <DebugRow
              label="ID"
              value={
                selectedObject.id
              }
            />

            <DebugRow
              label="Type"
              value={
                selectedObject.type
              }
            />

            <DebugRow
              label="Name"
              value={
                selectedObject.name ??
                "—"
              }
            />

          </DebugSection>


          {/* =================================
              TRANSFORM DEBUG
          ================================= */}

          <DebugSection
            title="Transform"
          >

            <DebugVector
              label="Position"
              value={
                selectedObject
                  .transform
                  .position
              }
            />

            <DebugVector
              label="Rotation"
              value={
                selectedObject
                  .transform
                  .rotation
              }
            />

            <DebugVector
              label="Scale"
              value={
                selectedObject
                  .transform
                  .scale
              }
            />

          </DebugSection>


          {/* =================================
              SVG DEBUG
          ================================= */}

          {hasSvg(
            selectedObject
          ) && (
            <DebugSection
              title="SVG"
            >
              <DebugRow
                label="SVG"
                value={
                  getSvgValue(
                    selectedObject
                  )
                }
              />
            </DebugSection>
          )}


          {/* =================================
              SPEAKER DEBUG
          ================================= */}

          {selectedObject.type ===
            "speaker" && (
            <DebugSection
              title="Speaker"
            >

              <DebugRow
                label="Audio"
                value={
                  String(
                    selectedObject
                      .props
                      .audioUrl ??
                    "—"
                  )
                }
              />

              <DebugRow
                label="Distance"
                value={
                  String(
                    selectedObject
                      .props
                      .distance ??
                    "—"
                  )
                }
              />

              <DebugRow
                label="Volume"
                value={
                  String(
                    selectedObject
                      .props
                      .volume ??
                    "—"
                  )
                }
              />

              <DebugRow
                label="Props"
                value={
                  JSON.stringify(
                    selectedObject.props
                  )
                }
              />

            </DebugSection>
          )}


          {/* =================================
              PROPERTIES
          ================================= */}

          {selectedDefinition && (
            <PropertyEditor
              object={
                selectedObject
              }

              definition={
                selectedDefinition
              }

              onChange={(
                key,
                value
              ) => {
                updateObject(
                  selectedObject.id,
                  {
                    props: {
                      ...(selectedObject.props as Record<
                        string,
                        unknown
                      >),

                      [key]:
                        value,
                    },
                  } as Partial<SceneObject>
                );
              }}
            />
          )}


          {/* =================================
              TRANSFORM ACTIONS
          ================================= */}

          <div
            style={{
              marginTop:
                12,

              marginBottom:
                10,

              padding:
                10,

              border:
                "1px solid #d7d7d7",

              borderRadius:
                7,

              background:
                "#f4f4f4",
            }}
          >

            <div
              style={{
                fontSize:
                  10,

                fontWeight:
                  700,

                color:
                  "#666",

                marginBottom:
                  7,
              }}
            >
              Transform
            </div>


            <TransformInput
              label="Position"
              value={
                selectedObject
                  .transform
                  .position
              }
              onChange={(
                value
              ) =>
                updateTransform(
                  selectedObject.id,
                  {
                    position:
                      value,
                  }
                )
              }
            />


            <TransformInput
              label="Rotation"
              value={
                selectedObject
                  .transform
                  .rotation
              }
              onChange={(
                value
              ) =>
                updateTransform(
                  selectedObject.id,
                  {
                    rotation:
                      value,
                  }
                )
              }
            />


            <TransformInput
              label="Scale"
              value={
                selectedObject
                  .transform
                  .scale
              }
              onChange={(
                value
              ) =>
                updateTransform(
                  selectedObject.id,
                  {
                    scale:
                      value,
                  }
                )
              }
            />

          </div>


          {/* =================================
              ACTIONS
          ================================= */}

          <div
            style={{
              display:
                "flex",

              flexDirection:
                "column",

              gap:
                6,

              marginTop:
                14,
            }}
          >

            <button
              type="button"

              onClick={() => {
                setClipboardObject(
                  structuredClone(
                    selectedObject
                  )
                );
              }}

              style={
                actionButtonStyle
              }
            >
              Copy
            </button>


            <button
              type="button"

              disabled={
                !clipboardObject
              }

              onClick={() => {
                if (
                  !clipboardObject
                ) {
                  return;
                }

                const pasted =
                  structuredClone(
                    clipboardObject
                  );

                pasted.id =
                  `${pasted.type}-${Math.random()
                    .toString(36)
                    .slice(2, 10)}`;

                pasted.transform.position = [
                  pasted
                    .transform
                    .position[0] +
                    0.75,

                  pasted
                    .transform
                    .position[1],

                  pasted
                    .transform
                    .position[2],
                ];

                addObject(
                  pasted
                );
              }}

              style={{
                ...actionButtonStyle,

                opacity:
                  clipboardObject
                    ? 1
                    : 0.45,

                cursor:
                  clipboardObject
                    ? "pointer"
                    : "default",
              }}
            >
              Paste
            </button>


            <button
              type="button"

              onClick={() =>
                duplicateObject(
                  selectedObject.id
                )
              }

              style={
                actionButtonStyle
              }
            >
              Duplicate
            </button>


            <button
              type="button"

              onClick={() => {
                removeObject(
                  selectedObject.id
                );
              }}

              style={{
                ...actionButtonStyle,

                color:
                  "#a33",

                background:
                  "#f1dddd",
              }}
            >
              Delete
            </button>

          </div>
        </>
      )}
    </div>
  );
}


/* =========================================
   DEBUG HELPERS
========================================= */

function DebugSection({
  title,
  children,
}: {
  title: string;

  children:
    | React.ReactNode
    | React.ReactNode[];
}) {
  return (
    <div
      style={{
        marginBottom:
          10,

        padding:
          "8px 9px",

        background:
          "#eeeeee",

        border:
          "1px solid #d7d7d7",

        borderRadius:
          7,
      }}
    >

      <div
        style={{
          fontSize:
            9,

          fontWeight:
            800,

          color:
            "#666",

          textTransform:
            "uppercase",

          letterSpacing:
            0.5,

          marginBottom:
            6,
        }}
      >
        {title}
      </div>

      {children}

    </div>
  );
}


function DebugRow({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div
      style={{
        display:
          "grid",

        gridTemplateColumns:
          "62px minmax(0, 1fr)",

        gap:
          6,

        marginBottom:
          4,

        fontSize:
          9,

        lineHeight:
          1.35,
      }}
    >

      <span
        style={{
          color:
            "#777",

          fontWeight:
            700,
        }}
      >
        {label}
      </span>

      <span
        style={{
          color:
            "#333",

          overflowWrap:
            "anywhere",
        }}
      >
        {value}
      </span>

    </div>
  );
}


function DebugVector({
  label,
  value,
}: {
  label: string;

  value: [
    number,
    number,
    number
  ];
}) {
  return (
    <DebugRow
      label={label}
      value={
        `X ${formatNumber(
          value[0]
        )}  Y ${formatNumber(
          value[1]
        )}  Z ${formatNumber(
          value[2]
        )}`
      }
    />
  );
}


function formatNumber(
  value: number
): string {
  return Number.isFinite(
    value
  )
    ? value.toFixed(3)
    : "NaN";
}


function hasSvg(
  object: SceneObject
): boolean {
  return Boolean(
    (
      object.props as Record<
        string,
        unknown
      >
    ).svg
  );
}


function getSvgValue(
  object: SceneObject
): string {
  const value =
    (
      object.props as Record<
        string,
        unknown
      >
    ).svg;

  return String(
    value ??
      "—"
  );
}


/* =========================================
   ACTION BUTTON
========================================= */

const actionButtonStyle:
  React.CSSProperties = {
    width:
      "100%",

    height:
      32,

    border:
      "1px solid #d0d0d0",

    borderRadius:
      6,

    background:
      "#f4f4f4",

    color:
      "#333",

    cursor:
      "pointer",

    fontSize:
      11,

    fontWeight:
      600,
  };


/* =========================================
   TRANSFORM INPUT
========================================= */

function TransformInput({
  label,
  value,
  onChange,
}: {
  label: string;

  value: [
    number,
    number,
    number
  ];

  onChange: (
    value: [
      number,
      number,
      number
    ]
  ) => void;
}) {
  return (
    <div
      style={{
        marginBottom:
          8,
      }}
    >

      <div
        style={{
          fontSize:
            9,

          color:
            "#777",

          marginBottom:
            4,

          fontWeight:
            700,
        }}
      >
        {label}
      </div>


      <div
        style={{
          display:
            "grid",

          gridTemplateColumns:
            "repeat(3, 1fr)",

          gap:
            4,
        }}
      >

        {(
          ["X", "Y", "Z"] as const
        ).map(
          (
            axis,
            index
          ) => (
            <input
              key={
                axis
              }

              type="number"

              step="0.01"

              value={
                value[index]
              }

              onChange={(
                event
              ) => {
                const next =
                  Number(
                    event.target
                      .value
                  );

                if (
                  !Number.isFinite(
                    next
                  )
                ) {
                  return;
                }

                const updated =
                  [
                    ...value,
                  ] as [
                    number,
                    number,
                    number
                  ];

                updated[
                  index
                ] =
                  next;

                onChange(
                  updated
                );
              }}

              aria-label={
                `${label} ${axis}`
              }

              style={{
                boxSizing:
                  "border-box",

                width:
                  "100%",

                padding:
                  "6px",

                border:
                  "1px solid #d0d0d0",

                borderRadius:
                  5,

                background:
                  "#fff",

                color:
                  "#222",

                fontSize:
                  9,

                outline:
                  "none",
              }}
            />
          )
        )}

      </div>
    </div>
  );
}