import {
  Html,
} from "@react-three/drei";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useEditor,
} from "../../editor/context/EditorContext";


type AgentRole =
  | "auto"
  | "architect"
  | "frontend"
  | "backend"
  | "scene"
  | "marketplace"
  | "testing"
  | "documentation";


type CyVerseBotProps = {
  projectId?: string;
};


export default function CyVerseBot({
  projectId,
}: CyVerseBotProps) {

  const {
    scene,
    selectedId,
  } = useEditor();


  const [
    open,
    setOpen,
  ] = useState(false);


  const [
    task,
    setTask,
  ] = useState("");


  const [
    role,
    setRole,
  ] = useState<AgentRole>(
    "auto"
  );


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
  result,
  setResult,
] = useState<string | null>(
  null
);


  const [
    error,
    setError,
  ] = useState<string | null>(
    null
  );


  /*
   * Keep the context intentionally small.
   *
   * Ollama is running locally on limited hardware.
   */

  const sceneContext =
    useMemo(
      () => ({
        objects:
          scene.objects
            .slice(
              0,
              40
            )
            .map(
              (object) => ({
                id:
                  object.id,

                type:
                  object.type,

                name:
                  object.name,

                props:
                  object.props,

                transform:
                  object.transform,
              })
            ),
      }),
      [scene]
    );


  useEffect(() => {

    const handleKeyDown =
      (
        event: KeyboardEvent
      ) => {

        const target =
          event.target as
            | HTMLElement
            | null;

        const tagName =
          target?.tagName?.toLowerCase();


        if (
          tagName === "input" ||
          tagName === "textarea" ||
          tagName === "select" ||
          target?.isContentEditable
        ) {
          return;
        }


        if (
          event.key.toLowerCase() ===
          "b"
        ) {

          event.preventDefault();

          setOpen(
            current =>
              !current
          );
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

  }, []);


  const runAgent =
    async () => {

      const cleanTask =
        task.trim();


      if (
        !cleanTask ||
        loading
      ) {
        return;
      }


      setLoading(
        true
      );

      setError(
        null
      );

      setResult(
        null
      );


      try {

        const response =
          await fetch(
            "/api/ai/agents",
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  task:
                    cleanTask,

                  ...(role !==
                    "auto"
                    ? {
                        role,
                      }
                    : {}),

                  context: {
                    surface:
                      "editor",

                    projectId,

                    selectedId,

                    scene:
                      sceneContext,
                  },
                }),
            }
          );


        const data =
          await response
            .json()
            .catch(
              () => null
            );


        if (
          !response.ok
        ) {

          throw new Error(
            data?.error ||
              "Agent request failed."
          );
        }


        setResult(
          data?.result ??
            data
        );

      } catch (
        requestError
      ) {

        setError(
          requestError instanceof
            Error
            ? requestError.message
            : "Agent request failed."
        );

      } finally {

        setLoading(
          false
        );
      }
    };


  if (!open) {

    return (
      <Html
        fullscreen
        zIndexRange={[
          110,
          0,
        ]}
        style={{
          pointerEvents:
            "none",
        }}
      >

        <button
          type="button"
          onClick={() =>
            setOpen(true)
          }
          style={{
            position:
              "absolute",

            right:
              20,

            bottom:
              20,

            pointerEvents:
              "auto",

            border:
              "1px solid rgba(255,255,255,0.18)",

            borderRadius:
              14,

            padding:
              "10px 16px",

            background:
              "rgba(12, 16, 24, 0.94)",

            color:
              "#fff",

            cursor:
              "pointer",

            boxShadow:
              "0 12px 32px rgba(0,0,0,0.3)",
          }}
        >
          Cyrus Bot
        </button>

      </Html>
    );
  }


  return (
    <Html
      fullscreen
      zIndexRange={[
        110,
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

          right:
            20,

          bottom:
            20,

          width:
            440,

          maxWidth:
            "calc(100vw - 40px)",

          pointerEvents:
            "auto",

          background:
            "rgba(10, 14, 22, 0.96)",

          border:
            "1px solid rgba(255,255,255,0.12)",

          borderRadius:
            18,

          boxShadow:
            "0 20px 60px rgba(0,0,0,0.38)",

          color:
            "#fff",

          padding:
            16,

          fontFamily:
            "Inter, ui-sans-serif, system-ui, sans-serif",
        }}
      >

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

          <strong>
            CyVerse Bot
          </strong>

          <button
            type="button"
            onClick={() =>
              setOpen(false)
            }
            style={{
              border:
                0,

              background:
                "transparent",

              color:
                "#aaa",

              cursor:
                "pointer",

              fontSize:
                18,
            }}
          >
            ×
          </button>

        </div>


        <select
          value={
            role
          }
          onChange={
            event =>
              setRole(
                event.target
                  .value as AgentRole
              )
          }
          style={{
            width:
              "100%",

            marginBottom:
              10,

            padding:
              "9px 10px",

            borderRadius:
              9,

            border:
              "1px solid rgba(255,255,255,0.14)",

            background:
              "#171c26",

            color:
              "#fff",
          }}
        >

          <option value="auto">
            Auto / Manager
          </option>

          <option value="architect">
            Architect
          </option>

          <option value="frontend">
            Frontend
          </option>

          <option value="backend">
            Backend
          </option>

          <option value="scene">
            Scene
          </option>

          <option value="marketplace">
            Marketplace
          </option>

          <option value="testing">
            Testing
          </option>

          <option value="documentation">
            Documentation
          </option>

        </select>


        <textarea
          value={
            task
          }
          onChange={
            event =>
              setTask(
                event.target.value
              )
          }
          onKeyDown={
            event => {
              if (
                event.key ===
                  "Enter" &&
                !event.shiftKey
              ) {

                event.preventDefault();

                void runAgent();
              }
            }
          }
          placeholder="Ask the CyVerse agents to audit or plan something…"
          rows={4}
          style={{
            width:
              "100%",

            resize:
              "vertical",

            boxSizing:
              "border-box",

            padding:
              10,

            borderRadius:
              10,

            border:
              "1px solid rgba(255,255,255,0.14)",

            background:
              "#111620",

            color:
              "#fff",

            outline:
              "none",
          }}
        />


        <button
          type="button"
          disabled={
            loading ||
            !task.trim()
          }
          onClick={
            () =>
              void runAgent()
          }
          style={{
            width:
              "100%",

            marginTop:
              10,

            padding:
              "10px 14px",

            border:
              0,

            borderRadius:
              10,

            background:
              loading
                ? "#39404d"
                : "#5d83ee",

            color:
              "#fff",

            cursor:
              loading
                ? "default"
                : "pointer",
          }}
        >
          {loading
            ? "Agents working…"
            : "Run Agent"}
        </button>


        {error && (
          <div
            style={{
              marginTop:
                12,

              padding:
                10,

              borderRadius:
                9,

              background:
                "rgba(180,50,50,0.2)",

              color:
                "#ffb5b5",

              fontSize:
                13,
            }}
          >
            {error}
          </div>
        )}


        {result && (
  <pre
    style={{
      marginTop: 12,
      maxHeight: 360,
      overflow: "auto",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      padding: 12,
      borderRadius: 10,
      background: "#0a0e15",
      color: "#d9e0ec",
      fontSize: 12,
      lineHeight: 1.5,
    }}
  >
    {result}
  </pre>
)}

      </div>

    </Html>
  );
}