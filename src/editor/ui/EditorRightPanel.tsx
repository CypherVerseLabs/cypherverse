import {
  CSSProperties,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";

import PropertyEditor from "./PropertyEditor";

import {
  SceneObject,
} from "../scene/objectTypes";


type EditorRightPanelProps = {

  selectedObject?:
    SceneObject;

  selectedDefinition?:
    any;


  select:
    (id?: string) => void;


  updateObject:
    (
      id: string,
      object: SceneObject
    ) => void;


  updateTransform:
    (
      id: string,
      transform: Partial<SceneObject["transform"]>
    ) => void;


  clipboardObject?:
    SceneObject;

  setClipboardObject:
    Dispatch<
      SetStateAction<
        SceneObject | undefined
      >
    >;


  scene: any;

  addObject:
    (object: SceneObject) => void;

  duplicateObject:
    (id: string) => void;

  removeObject:
    (id: string) => void;
};


/* =========================================
   CLONE SCENE OBJECT
========================================= */

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
    cloned.transform.position[0] + 0.75,
    cloned.transform.position[1],
    cloned.transform.position[2],
  ];

  return cloned;
}


/* =========================================
   RIGHT PANEL
========================================= */

export default function EditorRightPanel({
  selectedObject,
  selectedDefinition,

  select,

  updateObject,
  updateTransform,

  clipboardObject,
  setClipboardObject,

  scene,
  addObject,

  duplicateObject,
  removeObject,

}: EditorRightPanelProps) {

  if (!selectedObject) {
    return null;
  }


  return (
    <div
      style={{
        width: 280,

        maxHeight:
          "calc(100vh - 32px)",

        overflowY: "auto",

        margin:
          "16px 16px 16px 0",

        transform:
          "translateX(-890px)",

        padding: 14,

        boxSizing:
          "border-box",

        borderRadius: 12,

        background:
          "rgba(18, 18, 22, 0.94)",

        border:
          "1px solid rgba(255,255,255,0.1)",

        boxShadow:
          "0 10px 30px rgba(0,0,0,0.3)",

        pointerEvents:
          "auto",

        alignSelf:
          "flex-start",

        marginTop: 100,
      }}
    >

      {/* HEADER */}

      <div
        style={{
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "space-between",
          marginBottom: 14,
        }}
      >

        <div>

          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {selectedObject.type}
          </div>


          <div
            style={{
              fontSize: 10,
              opacity: 0.45,
              marginTop: 3,
            }}
          >
            {selectedObject.id}
          </div>

        </div>


        <button
          onClick={() =>
            select(undefined)
          }
          title="Deselect"
          style={{
            border: 0,
            background:
              "transparent",
            color: "#aaa",
            cursor:
              "pointer",
            fontSize: 18,
          }}
        >
          ×
        </button>

      </div>


      {/* TRANSFORM */}

      <Section title="Transform">

        <VectorInput
          label="Position"
          value={
            selectedObject
              .transform
              .position
          }
          onChange={(
            axis,
            value
          ) => {

            const next = [
              ...selectedObject
                .transform
                .position,
            ] as [
              number,
              number,
              number
            ];

            next[axis] =
              value;

            updateTransform(
              selectedObject.id,
              {
                position:
                  next,
              }
            );
          }}
        />


        <VectorInput
          label="Rotation"
          value={
            selectedObject
              .transform
              .rotation
          }
          onChange={(
            axis,
            value
          ) => {

            const next = [
              ...selectedObject
                .transform
                .rotation,
            ] as [
              number,
              number,
              number
            ];

            next[axis] =
              value;

            updateTransform(
              selectedObject.id,
              {
                rotation:
                  next,
              }
            );
          }}
        />


        <VectorInput
          label="Scale"
          value={
            selectedObject
              .transform
              .scale
          }
          onChange={(
            axis,
            value
          ) => {

            const next = [
              ...selectedObject
                .transform
                .scale,
            ] as [
              number,
              number,
              number
            ];

            next[axis] =
              value;

            updateTransform(
              selectedObject.id,
              {
                scale:
                  next,
              }
            );
          }}
        />

      </Section>


      {/* IDEA PROPERTIES */}

      {selectedDefinition && (
        <PropertyEditor
          object={
            selectedObject
          }

          definition={
            selectedDefinition
          }

          onChange={(
            object
          ) => {

            updateObject(
              selectedObject.id,
              object
            );

          }}
        />
      )}


      {/* COPY */}

      <button
        onClick={() => {

          setClipboardObject(
            structuredClone(
              selectedObject
            )
          );

        }}
        title="Copy (Ctrl/Cmd+C)"
        style={{
          width: "100%",
          padding:
            "9px 10px",
          border: 0,
          borderRadius: 7,
          background:
            "#292930",
          color:
            "#ffffff",
          cursor:
            "pointer",
        }}
      >
        Copy
      </button>


      {/* PASTE */}

      <button
        disabled={
          !clipboardObject
        }
        onClick={() => {

          if (
            !clipboardObject
          ) {
            return;
          }

          let pastedObject =
            cloneSceneObject(
              clipboardObject
            );

          while (
            scene.objects.some(
              (object: SceneObject) =>
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

        }}
        title="Paste (Ctrl/Cmd+V)"
        style={{
          width: "100%",
          marginTop: 6,
          padding:
            "9px 10px",
          border: 0,
          borderRadius: 7,

          background:
            clipboardObject
              ? "#343a52"
              : "#202027",

          color:
            clipboardObject
              ? "#ffffff"
              : "#55555f",

          cursor:
            clipboardObject
              ? "pointer"
              : "default",
        }}
      >
        Paste
      </button>


      {/* DUPLICATE */}

      <button
        onClick={() =>
          duplicateObject(
            selectedObject.id
          )
        }
        title="Duplicate (Ctrl/Cmd+D)"
        style={{
          width: "100%",
          marginTop: 16,
          padding:
            "9px 10px",
          border: 0,
          borderRadius: 7,
          background:
            "#343a52",
          color:
            "#ffffff",
          cursor:
            "pointer",
        }}
      >
        Duplicate
      </button>


      {/* DELETE */}

      <button
        onClick={() =>
          removeObject(
            selectedObject.id
          )
        }
        title="Delete (Delete)"
        style={{
          width: "100%",
          marginTop: 6,
          padding:
            "9px 10px",
          border: 0,
          borderRadius: 7,
          background:
            "#6f2525",
          color:
            "#ffffff",
          cursor:
            "pointer",
        }}
      >
        Delete
      </button>

    </div>
  );
}


/* =========================================
   SECTION
========================================= */

function Section(props: {
  title: string;
  children: ReactNode;
}) {

  return (
    <div
      style={{
        marginTop: 16,
      }}
    >

      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          opacity: 0.55,
          textTransform:
            "uppercase",
          letterSpacing: 0.8,
          marginBottom: 9,
        }}
      >
        {props.title}
      </div>


      {props.children}

    </div>
  );
}


/* =========================================
   FIELD LABEL
========================================= */

function FieldLabel(props: {
  children: ReactNode;
}) {

  return (
    <label
      style={{
        display: "block",
        fontSize: 11,
        opacity: 0.65,
        marginBottom: 5,
      }}
    >
      {props.children}
    </label>
  );
}


/* =========================================
   VECTOR INPUT
========================================= */

function VectorInput(props: {
  label: string;

  value: [
    number,
    number,
    number
  ];

  onChange: (
    axis: 0 | 1 | 2,
    value: number
  ) => void;
}) {

  const {
    label,
    value,
    onChange,
  } = props;


  return (
    <div
      style={{
        marginBottom: 12,
      }}
    >

      <FieldLabel>
        {label}
      </FieldLabel>


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, 1fr)",
          gap: 5,
        }}
      >

        {(
          [
            "X",
            "Y",
            "Z",
          ] as const
        ).map(
          (
            axisName,
            index
          ) => (

            <input
              key={
                axisName
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
                    event.target.value
                  );

                if (
                  Number.isFinite(
                    next
                  )
                ) {

                  onChange(
                    index as
                      | 0
                      | 1
                      | 2,
                    next
                  );

                }
              }}
              aria-label={`${label} ${axisName}`}
              style={
                inputStyle
              }
            />

          )
        )}

      </div>

    </div>
  );
}


/* =========================================
   INPUT STYLE
========================================= */

const inputStyle:
  CSSProperties = {

  boxSizing:
    "border-box",

  width:
    "100%",

  padding:
    "7px 8px",

  borderRadius:
    6,

  border:
    "1px solid rgba(255,255,255,0.12)",

  background:
    "rgba(255,255,255,0.06)",

  color:
    "#ffffff",

  outline:
    "none",
};