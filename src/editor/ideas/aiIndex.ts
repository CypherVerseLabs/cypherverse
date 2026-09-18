
import {
  getRegisteredIdeas,
} from "./registry";

import type {
  IdeaSchemaField,
} from "./types";


/* =========================================
   AI IDEA
========================================= */

export type AIIdea = {

  id: string;

  name: string;

  category: string;

  kind: string;

  description?: string;

  tags: string[];

  skills: string[];

  schema: IdeaSchemaField[];

  synonyms: string[];

  examples: string[];
};


/* =========================================
   BUILD AI INDEX
========================================= */

export function getAIIdeaIndex():
  AIIdea[] {

  return getRegisteredIdeas()
    .map(
      (idea) => ({
        id:
          idea.id,

        name:
          idea.name,

        category:
          idea.category,

        kind:
          idea.kind,

        description:
          idea.description,

        tags:
          idea.tags,

        skills:
          idea.skills,

        schema:
          idea.schema,

        synonyms:
          idea.metadata?.ai?.synonyms ??
          [],

        examples:
          idea.metadata?.ai?.examples ??
          [],
      })
    );
}


/* =========================================
   SEARCH AI INDEX
========================================= */

export function searchAIIdeas(
  query: string
):
  AIIdea[] {

  const normalized =
    query
      .trim()
      .toLowerCase();


  if (
    !normalized
  ) {

    return getAIIdeaIndex();
  }


  return getAIIdeaIndex()
    .filter(
      (idea) => {

        const haystack =
          [
            idea.id,
            idea.name,
            idea.category,
            idea.description,

            ...idea.tags,

            ...idea.skills,

            ...idea.synonyms,

            ...idea.examples,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


        return haystack.includes(
          normalized
        );
      }
    );
}


/* =========================================
   AI PROMPT CONTEXT
========================================= */

export function getAIIdeaContext():
  string {

  const ideas =
    getAIIdeaIndex();


  return ideas
    .map(
      (idea) => {

        const schema =
          idea.schema
            .map(
              (field) =>
                `${field.name}:${field.type}`
            )
            .join(", ");


        return [
          `ID: ${idea.id}`,
          `Name: ${idea.name}`,
          `Category: ${idea.category}`,
          `Kind: ${idea.kind}`,

          idea.description
            ? `Description: ${idea.description}`
            : "",

          idea.tags.length > 0
            ? `Tags: ${idea.tags.join(", ")}`
            : "",

          idea.skills.length > 0
            ? `Skills: ${idea.skills.join(", ")}`
            : "",

          schema
            ? `Schema: ${schema}`
            : "",

        ]
          .filter(Boolean)
          .join("\n");
      }
    )
    .join("\n\n");
}


/* =========================================
   AI TOOL FORMAT
========================================= */

export function getAIIdeaTools() {

  return getAIIdeaIndex()
    .map(
      (idea) => ({

        name:
          `create_${idea.id}`,

        description:
          idea.description ??
          `Create ${idea.name}.`,

        input_schema: {

          type:
            "object",

          properties:
            Object.fromEntries(
              idea.schema.map(
                (field) => [
                  field.name,
                  {
                    type:
                      field.type ===
                      "integer"
                        ? "integer"
                        : field.type ===
                          "number"
                          ? "number"
                          : field.type ===
                            "boolean"
                            ? "boolean"
                            : "string",

                    description:
                      field.description ??
                      `${field.name} for ${idea.name}.`,
                  },
                ]
              )
            ),

          required:
            idea.schema
              .filter(
                (field) =>
                  field.required
              )
              .map(
                (field) =>
                  field.name
              ),
        },
      })
    );
}

