
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
    Dispatch<SetStateAction<boolean>>;

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
    transform: Partial<SceneObject["transform"]>
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

  if (leftPanelCollapsed) {

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
          SELECTED IDEA
      ================================= */}

      {selectedObject && (

        <>

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


          {/* =============================
              PROPERTIES
          ============================= */}

          {selectedDefinition && (

            <PropertyEditor
              object={selectedObject}
              definition={selectedDefinition}
              onChange={(key, value) => {
                updateObject(
                  selectedObject.id,
                  {
                    props: {
                      ...(selectedObject.props as Record<string, unknown>),
                      [key]: value,
                    },
                  } as Partial<SceneObject>
                );
              }}
            />



          )}


          {/* =============================
              ACTIONS
          ============================= */}

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

              style={actionButtonStyle}
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
                  pasted.transform.position[0] + 0.75,
                  pasted.transform.position[1],
                  pasted.transform.position[2],
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
   ACTION BUTTON
========================================= */

const actionButtonStyle: React.CSSProperties = {
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

