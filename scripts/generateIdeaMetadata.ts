
import * as fs from "fs";
import * as path from "path";


/* =========================================
   TYPES
========================================= */

type RawIdeaMetadata = {
  id?: unknown;

  type?: unknown;

  name?: unknown;

  description?: unknown;

  category?: unknown;

  kind?: unknown;

  tags?: unknown;

  skills?: unknown;

  schema?: unknown;

  ai?: unknown;
};


type IdeaSchemaField = {
  name: string;

  type: string;

  required?: boolean;

  description?: string;
};


type IdeaMetadata = {
  id: string;

  type?: string;

  name: string;

  description?: string;

  category: string;

  kind?: "scene-object" | "component";

  tags?: string[];

  skills?: string[];

  schema?: IdeaSchemaField[];

  ai?: {
    description?: string;

    tags?: string[];

    skills?: string[];
  };
};


/* =========================================
   PATHS
========================================= */

const projectRoot =
  process.cwd();

const ideasRoot =
  path.join(
    projectRoot,
    "src",
    "ideas"
  );

const outputFile =
  path.join(
    projectRoot,
    "src",
    "editor",
    "ideas",
    "generatedMetadata.ts"
  );


/* =========================================
   HELPERS
========================================= */

function isRecord(
  value: unknown
): value is Record<string, unknown> {

  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}


/* =========================================
   FIND IDEA.JSON FILES
========================================= */

function findIdeaFiles(
  directory: string
): string[] {

  if (
    !fs.existsSync(directory)
  ) {

    return [];
  }

  const entries =
    fs.readdirSync(
      directory,
      {
        withFileTypes: true,
      }
    );

  const result:
    string[] = [];


  for (
    const entry
    of entries
  ) {

    if (
      entry.name ===
      "node_modules"
    ) {

      continue;
    }

    if (
      entry.name.startsWith(".")
    ) {

      continue;
    }


    const fullPath =
      path.join(
        directory,
        entry.name
      );


    if (
      entry.isDirectory()
    ) {

      result.push(
        ...findIdeaFiles(
          fullPath
        )
      );

      continue;
    }


    if (
      entry.isFile() &&
      entry.name ===
        "idea.json"
    ) {

      result.push(
        fullPath
      );
    }
  }


  return result;
}


/* =========================================
   STRING ARRAY
========================================= */

function readStringArray(
  value: unknown
): string[] | undefined {

  if (
    !Array.isArray(value)
  ) {

    return undefined;
  }

  const values =
    value.filter(
      (
        item
      ): item is string =>
        typeof item ===
        "string"
    );

  return values.length
    ? values
    : undefined;
}


/* =========================================
   SCHEMA
========================================= */

function readSchema(
  value: unknown
):
  | IdeaSchemaField[]
  | undefined {

  if (
    !Array.isArray(value)
  ) {

    return undefined;
  }


  const schema:
    IdeaSchemaField[] = [];


  for (
    const field
    of value
  ) {

    if (
      !isRecord(field)
    ) {

      continue;
    }


    if (
      typeof field.name !==
      "string"
    ) {

      continue;
    }


    if (
      typeof field.type !==
      "string"
    ) {

      continue;
    }


    const normalized:
      IdeaSchemaField = {
        name:
          field.name,

        type:
          field.type,
      };


    if (
      typeof field.required ===
      "boolean"
    ) {

      normalized.required =
        field.required;
    }


    if (
      typeof field.description ===
      "string"
    ) {

      normalized.description =
        field.description;
    }


    schema.push(
      normalized
    );
  }


  return schema.length
    ? schema
    : undefined;
}


/* =========================================
   AI METADATA
========================================= */

function readAI(
  value: unknown
):
  | IdeaMetadata["ai"]
  | undefined {

  if (
    !isRecord(value)
  ) {

    return undefined;
  }


  const ai:
    IdeaMetadata["ai"] = {};


  if (
    typeof value.description ===
    "string"
  ) {

    ai.description =
      value.description;
  }


  const tags =
    readStringArray(
      value.tags
    );

  if (tags) {
    ai.tags = tags;
  }


  const skills =
    readStringArray(
      value.skills
    );

  if (skills) {
    ai.skills = skills;
  }


  if (
    !ai.description &&
    !ai.tags &&
    !ai.skills
  ) {

    return undefined;
  }


  return ai;
}


/* =========================================
   NORMALIZE
========================================= */

function normalizeMetadata(
  value: unknown,
  filePath: string
):
  | IdeaMetadata
  | undefined {

  if (
    !isRecord(value)
  ) {

    console.warn(
      `[CyBuilder] Skipping ${filePath}: expected an object.`
    );

    return undefined;
  }


  const raw =
    value as RawIdeaMetadata;


  if (
    typeof raw.id !==
    "string"
  ) {

    console.warn(
      `[CyBuilder] Skipping ${filePath}: missing "id".`
    );

    return undefined;
  }


  if (
    typeof raw.name !==
    "string"
  ) {

    console.warn(
      `[CyBuilder] Skipping ${filePath}: missing "name".`
    );

    return undefined;
  }


  if (
    typeof raw.category !==
    "string"
  ) {

    /*
     * This also prevents world/template JSON
     * such as src/ideas/found/idea.json from
     * accidentally becoming an Idea.
     */

    console.warn(
      `[CyBuilder] Skipping ${filePath}: missing "category".`
    );

    return undefined;
  }


  let kind:
    | "scene-object"
    | "component"
    | undefined;


  if (
    raw.kind ===
    "scene-object" ||
    raw.kind ===
    "component"
  ) {

    kind =
      raw.kind;
  }
  else if (
    typeof raw.type ===
    "string"
  ) {

    kind =
      "scene-object";
  }


  const metadata:
    IdeaMetadata = {
      id:
        raw.id,

      name:
        raw.name,

      category:
        raw.category,
    };


  if (
    typeof raw.type ===
    "string"
  ) {

    metadata.type =
      raw.type;
  }


  if (
    typeof raw.description ===
    "string"
  ) {

    metadata.description =
      raw.description;
  }


  if (kind) {

    metadata.kind =
      kind;
  }


  const tags =
    readStringArray(
      raw.tags
    );

  if (tags) {
    metadata.tags =
      tags;
  }


  const skills =
    readStringArray(
      raw.skills
    );

  if (skills) {
    metadata.skills =
      skills;
  }


  const schema =
    readSchema(
      raw.schema
    );

  if (schema) {
    metadata.schema =
      schema;
  }


  const ai =
    readAI(
      raw.ai
    );

  if (ai) {
    metadata.ai =
      ai;
  }


  return metadata;
}


/* =========================================
   LOAD
========================================= */

function loadMetadata():
  IdeaMetadata[] {

  const files =
    findIdeaFiles(
      ideasRoot
    ).sort();


  const metadata:
    IdeaMetadata[] = [];


  const ids =
    new Set<string>();


  for (
    const filePath
    of files
  ) {

    let parsed:
      unknown;


    try {

      const source =
        fs.readFileSync(
          filePath,
          "utf8"
        );

      parsed =
        JSON.parse(
          source
        );

    } catch (error) {

      throw new Error(
        `[CyBuilder] Failed to read ${filePath}: ${
          error instanceof Error
            ? error.message
            : String(error)
        }`
      );
    }


    const item =
      normalizeMetadata(
        parsed,
        path.relative(
          projectRoot,
          filePath
        )
      );


    if (!item) {
      continue;
    }


    if (
      ids.has(item.id)
    ) {

      throw new Error(
        `[CyBuilder] Duplicate Idea metadata id "${item.id}".`
      );
    }


    ids.add(
      item.id
    );


    metadata.push(
      item
    );
  }


  return metadata;
}


/* =========================================
   GENERATE
========================================= */

function generate():
  void {

  const metadata =
    loadMetadata();


  const serialized =
    JSON.stringify(
      metadata,
      null,
      2
    );


  const output =
`/*
 * AUTO-GENERATED FILE
 *
 * Do not edit this file manually.
 *
 * Generated by:
 *
 *   scripts/generateIdeaMetadata.ts
 */

import type {
  IdeaMetadata,
} from "./types";


export const generatedIdeaMetadata:
  IdeaMetadata[] = ${serialized};
`;


  fs.mkdirSync(
    path.dirname(
      outputFile
    ),
    {
      recursive: true,
    }
  );


  fs.writeFileSync(
    outputFile,
    output,
    "utf8"
  );


  console.log(
    `[CyBuilder] Generated ${metadata.length} Idea metadata entries.`
  );


  for (
    const item
    of metadata
  ) {

    console.log(
      `  • ${item.name} (${item.id})`
    );
  }
}


/* =========================================
   RUN
========================================= */

generate();

