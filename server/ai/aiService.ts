import OpenAI from "openai";

import type {
  AIGenerateContext,
  AIActionResponse,
} from "./aiTypes.js";


/* =========================================
   OPENAI CLIENT
========================================= */

const apiKey =
  process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error(
    "OPENAI_API_KEY is not defined"
  );
}

const openai =
  new OpenAI({
    apiKey,
  });


/* =========================================
   AI MODEL
========================================= */

const MODEL =
  process.env.OPENAI_MODEL ||
  "gpt-4o-mini";


/* =========================================
   IDEA CONTEXT
========================================= */

export type AIIdeaContext = {
  type: string;

  name: string;

  category: string;

  description?: string;

  tags?: string[];

  skills?: string[];

  schema?: {
    name: string;

    type: string;

    required?: boolean;

    description?: string;
  }[];
};


/* =========================================
   BUILD IDEA CONTEXT
========================================= */

function buildIdeaContext(
  ideas: AIIdeaContext[]
): string {

  return ideas
    .map((idea) => {

      return [
        `Type: ${idea.type}`,
        `Name: ${idea.name}`,
        `Category: ${idea.category}`,

        idea.description
          ? `Description: ${idea.description}`
          : "",

        idea.tags?.length
          ? `Tags: ${idea.tags.join(", ")}`
          : "",

        idea.skills?.length
          ? `Skills: ${idea.skills.join(", ")}`
          : "",

        idea.schema?.length
          ? `Properties: ${idea.schema
              .map(
                (field) =>
                  `${field.name}:${field.type}${
                    field.required
                      ? " (required)"
                      : ""
                  }`
              )
              .join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

    })
    .join("\n\n");
}


/* =========================================
   BUILD SCENE CONTEXT
========================================= */

function buildSceneContext(
  scene?: AIGenerateContext
): string {

  if (
    !scene ||
    !Array.isArray(scene.objects) ||
    scene.objects.length === 0
  ) {
    return "The current scene is empty.";
  }

  return scene.objects
    .map((object) => {

      return [
        `ID: ${object.id}`,
        `Type: ${object.type}`,

        object.name
          ? `Name: ${object.name}`
          : "",

        object.props
          ? `Props: ${JSON.stringify(
              object.props
            )}`
          : "",

        object.transform
          ? `Transform: ${JSON.stringify(
              object.transform
            )}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

    })
    .join("\n\n");
}


/* =========================================
   SYSTEM PROMPT
========================================= */

function buildSystemPrompt(
  ideas: AIIdeaContext[],
  scene?: AIGenerateContext
): string {

  const ideaContext =
    buildIdeaContext(
      ideas
    );

  const sceneContext =
    buildSceneContext(
      scene
    );

  return `
You are the CyBuilder scene-building AI.

Your job is to translate a user's natural-language
scene request into a list of scene actions.

Only use scene object types provided in the
AVAILABLE IDEAS section.

Never invent an object type.

Return actions only.

AVAILABLE IDEAS:

${ideaContext}

CURRENT SCENE:

${sceneContext}

ACTION RULES:

1. "create" creates a new scene object.

2. "update" modifies an existing scene object by id.

3. "delete" removes an existing scene object by id.

4. A response may contain multiple actions.

5. Use the idea's property names exactly as provided.

6. Do not invent property names.

7. Use sensible defaults when the user does not
   specify a property.

8. Transform values must be numeric.

9. Position, rotation and scale must contain exactly
   three numbers when provided.

10. For update and delete actions, only use IDs that
    actually exist in CURRENT SCENE.

11. If the user asks to modify an existing object,
    prefer an update action instead of creating a
    duplicate.

12. If the user asks to remove an existing object,
    use delete with its exact scene ID.

13. If the user asks for a new object, use create.

14. Do not include explanations outside the action
    response.

15. Do not return markdown.

16. Do not return code fences.

17. Return valid JSON matching the required schema.
`;
}


/* =========================================
   ACTION SCHEMA
========================================= */

const actionSchema = {
  type: "object",

  additionalProperties:
    false,

  properties: {
    actions: {
      type: "array",

      items: {
        anyOf: [
          {
            type: "object",

            additionalProperties:
              false,

            properties: {
              action: {
                type: "string",

                enum: [
                  "create",
                ],
              },

              type: {
                type: "string",
              },

              props: {
                type: "object",

                additionalProperties:
                  true,
              },

              transform: {
                type: "object",

                additionalProperties:
                  false,

                properties: {
                  position: {
                    type: "array",

                    items: {
                      type: "number",
                    },

                    minItems: 3,

                    maxItems: 3,
                  },

                  rotation: {
                    type: "array",

                    items: {
                      type: "number",
                    },

                    minItems: 3,

                    maxItems: 3,
                  },

                  scale: {
                    type: "array",

                    items: {
                      type: "number",
                    },

                    minItems: 3,

                    maxItems: 3,
                  },
                },
              },
            },

            required: [
              "action",
              "type",
            ],
          },

          {
            type: "object",

            additionalProperties:
              false,

            properties: {
              action: {
                type: "string",

                enum: [
                  "update",
                ],
              },

              id: {
                type: "string",
              },

              props: {
                type: "object",

                additionalProperties:
                  true,
              },

              transform: {
                type: "object",

                additionalProperties:
                  false,

                properties: {
                  position: {
                    type: "array",

                    items: {
                      type: "number",
                    },

                    minItems: 3,

                    maxItems: 3,
                  },

                  rotation: {
                    type: "array",

                    items: {
                      type: "number",
                    },

                    minItems: 3,

                    maxItems: 3,
                  },

                  scale: {
                    type: "array",

                    items: {
                      type: "number",
                    },

                    minItems: 3,

                    maxItems: 3,
                  },
                },
              },
            },

            required: [
              "action",
              "id",
            ],
          },

          {
            type: "object",

            additionalProperties:
              false,

            properties: {
              action: {
                type: "string",

                enum: [
                  "delete",
                ],
              },

              id: {
                type: "string",
              },
            },

            required: [
              "action",
              "id",
            ],
          },
        ],
      },
    },
  },

  required: [
    "actions",
  ],
};


/* =========================================
   GENERATE ACTIONS
========================================= */

export async function generateSceneActions(
  prompt: string,
  ideas: AIIdeaContext[],
  scene?: AIGenerateContext
): Promise<AIActionResponse> {

  if (!prompt.trim()) {
    throw new Error(
      "AI prompt cannot be empty."
    );
  }

  if (!ideas.length) {
    throw new Error(
      "No CyBuilder ideas are available to the AI."
    );
  }


  /* -----------------------------------------
     OPENAI
  ----------------------------------------- */

  const response =
    await openai.responses.create({
      model: MODEL,

      input: [
        {
          role: "system",

          content:
            buildSystemPrompt(
              ideas,
              scene
            ),
        },

        {
          role: "user",

          content:
            prompt.trim(),
        },
      ],

      text: {
        format: {
          type: "json_schema",

          name:
            "cybuilder_scene_actions",

          strict: true,

          schema:
            actionSchema,
        },
      },
    });


  /* -----------------------------------------
     OUTPUT
  ----------------------------------------- */

  const output =
    response.output_text;


  if (!output) {
    throw new Error(
      "AI returned an empty response."
    );
  }


  /* -----------------------------------------
     PARSE
  ----------------------------------------- */

  let parsed: unknown;

  try {

    parsed =
      JSON.parse(
        output
      );

  } catch {

    throw new Error(
      "AI returned invalid JSON."
    );
  }


  /* -----------------------------------------
     BASIC VALIDATION
  ----------------------------------------- */

  if (
    typeof parsed !==
    "object" ||
    parsed === null
  ) {

    throw new Error(
      "AI returned an invalid action response."
    );
  }


  const result =
    parsed as Partial<
      AIActionResponse
    >;


  if (
    !Array.isArray(
      result.actions
    )
  ) {

    throw new Error(
      "AI response does not contain an actions array."
    );
  }


  return {
    actions:
      result.actions,
  };
}