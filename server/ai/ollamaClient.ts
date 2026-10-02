/* =========================================
   CYPHERVERSE OLLAMA CLIENT
========================================= */

const OLLAMA_URL =
  process.env.OLLAMA_URL ||
  "http://127.0.0.1:11434";

const OLLAMA_MODEL =
  process.env.OLLAMA_MODEL ||
  "qwen3:1.7b";


/* =========================================
   TYPES
========================================= */

export type OllamaMessage = {
  role:
    | "system"
    | "user"
    | "assistant";

  content: string;
};


/* =========================================
   JSON GENERATION
========================================= */

export async function generateOllamaJSON<T>(
  messages: OllamaMessage[],
  schema: Record<string, unknown>
): Promise<T> {

  const response =
    await fetch(
      `${OLLAMA_URL}/api/chat`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          model:
            OLLAMA_MODEL,

          messages,

          stream: false,

          format:
            schema,

          options: {
            temperature: 0.2,
          },
        }),
      }
    );


  if (!response.ok) {

    const errorText =
      await response.text();

    throw new Error(
      `Ollama request failed (${response.status}): ${errorText}`
    );
  }


  const data =
    await response.json();


  const output =
    data?.message?.content;


  if (
    typeof output !==
      "string" ||
    !output.trim()
  ) {
    throw new Error(
      "Ollama returned an empty response."
    );
  }


  try {

    return JSON.parse(
      output
    ) as T;

  } catch {

    throw new Error(
      "Ollama returned invalid JSON."
    );
  }
}


/* =========================================
   MODEL INFO
========================================= */

export function getOllamaModel() {
  return OLLAMA_MODEL;
}