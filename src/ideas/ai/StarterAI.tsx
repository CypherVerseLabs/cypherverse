import { useCallback, useState } from "react";

type StarterAIResponse = {
  response: string;
};

type StarterAIProps = {
  name?: string;
  systemContext?: string;
};

const DEFAULT_CONTEXT = `
You are the Cypherverse guide.

You are speaking to a visitor who has just entered Cypherverse.

Your job is to help the visitor understand what Cypherverse is,
what they can do here, and where they should go next.

Cypherverse is a virtual world platform where people can explore,
create worlds, build interactive experiences, and discover other
worlds and experiences.

You should be friendly, concise, curious, and conversational.

You can explain concepts such as:

- Cypherverse
- worlds
- the world builder
- creating scenes
- multiplayer
- Decentral Station
- workshops
- user-created worlds
- AI-assisted world building

If the visitor says they want to build something, encourage them
to enter the world builder.

Do not claim that a feature exists unless it is described in this
context.

Do not pretend to have performed an action that you cannot perform.

Keep responses relatively short because they will be displayed
inside an interactive world.

If the visitor asks something unrelated, politely explain that
you are the Cypherverse guide and bring the conversation back
toward Cypherverse.
`;

export default function StarterAI({
  name = "Cypherverse Guide",
  systemContext = DEFAULT_CONTEXT,
}: StarterAIProps) {
  const [messages, setMessages] = useState<
    {
      role: "user" | "assistant";
      content: string;
    }[]
  >([]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async () => {
    const prompt = input.trim();

    if (!prompt || loading) {
      return;
    }

    setInput("");
    setError(null);

    const nextMessages = [
      ...messages,
      {
        role: "user" as const,
        content: prompt,
      },
    ];

    setMessages(nextMessages);
    setLoading(true);

    try {
      const response = await fetch("/api/ai/starter", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          prompt,
          messages: nextMessages,
          context: systemContext,
        }),
      });

      const data =
        (await response.json()) as
          | StarterAIResponse
          | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "Unable to contact the Cypherverse guide."
        );
      }

      if (
        !("response" in data) ||
        typeof data.response !== "string"
      ) {
        throw new Error(
          "The Cypherverse guide returned an invalid response."
        );
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.response,
        },
      ]);
    } catch (err) {
      console.error(
        "Starter AI error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [
    input,
    loading,
    messages,
    systemContext,
  ]);

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        width: 360,
        maxWidth: "calc(100vw - 48px)",
        zIndex: 1000,

        background:
          "rgba(5, 10, 20, 0.94)",

        border:
          "1px solid rgba(0, 255, 136, 0.35)",

        borderRadius: 16,

        boxShadow:
          "0 20px 60px rgba(0,0,0,0.45)",

        color: "#ffffff",

        overflow: "hidden",

        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* HEADER */}

      <div
        style={{
          padding: "14px 16px",

          borderBottom:
            "1px solid rgba(255,255,255,0.08)",

          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#00ff88",
            boxShadow:
              "0 0 12px rgba(0,255,136,0.8)",
          }}
        />

        <strong>
          {name}
        </strong>
      </div>

      {/* MESSAGES */}

      <div
        style={{
          maxHeight: 320,
          overflowY: "auto",
          padding: 14,
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              color:
                "rgba(255,255,255,0.72)",
              lineHeight: 1.5,
              fontSize: 14,
            }}
          >
            Welcome to Cypherverse.

            <br />

            Ask me what Cypherverse is,
            what you can do here, or how
            to start building your own world.
          </div>
        )}

        {messages.map(
          (message, index) => (
            <div
              key={`${message.role}-${index}`}
              style={{
                marginBottom: 12,
                display: "flex",
                justifyContent:
                  message.role === "user"
                    ? "flex-end"
                    : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  padding:
                    "9px 12px",
                  borderRadius: 12,

                  background:
                    message.role === "user"
                      ? "rgba(0,255,136,0.16)"
                      : "rgba(255,255,255,0.07)",

                  border:
                    message.role === "user"
                      ? "1px solid rgba(0,255,136,0.2)"
                      : "1px solid rgba(255,255,255,0.06)",

                  fontSize: 14,
                  lineHeight: 1.45,
                }}
              >
                {message.content}
              </div>
            </div>
          )
        )}

        {loading && (
          <div
            style={{
              color:
                "rgba(255,255,255,0.55)",
              fontSize: 13,
            }}
          >
            Thinking...
          </div>
        )}

        {error && (
          <div
            style={{
              color: "#ff6666",
              fontSize: 13,
              marginTop: 8,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* INPUT */}

      <div
        style={{
          padding: 12,

          borderTop:
            "1px solid rgba(255,255,255,0.08)",

          display: "flex",
          gap: 8,
        }}
      >
        <input
          value={input}
          onChange={(event) =>
            setInput(event.target.value)
          }
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Ask about Cypherverse..."
          style={{
            flex: 1,

            minWidth: 0,

            padding:
              "10px 12px",

            borderRadius: 10,

            border:
              "1px solid rgba(255,255,255,0.12)",

            background:
              "rgba(255,255,255,0.05)",

            color: "#ffffff",

            outline: "none",
          }}
        />

        <button
          type="button"
          onClick={() => {
            void sendMessage();
          }}
          disabled={
            loading ||
            !input.trim()
          }
          style={{
            padding:
              "10px 14px",

            borderRadius: 10,

            border: "none",

            background:
              loading ||
              !input.trim()
                ? "rgba(0,255,136,0.2)"
                : "#00ff88",

            color:
              loading ||
              !input.trim()
                ? "rgba(255,255,255,0.4)"
                : "#001a0d",

            fontWeight: 700,

            cursor:
              loading ||
              !input.trim()
                ? "default"
                : "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}