
import Ground from "../../ideas/Ground";
import CloudySky from "../../ideas/CloudySky";
import ProximityPicture from "../../ideas/decorations/ProximityPicture";

import {
  getIdeaDefinitions,
} from "./definitions";

import {
  getIdeaMetadata,
} from "./metadata";

import type {
  AnyIdeaDefinition,
  IdeaSchemaField,
  RegisteredIdea,
  RegisteredSceneObjectIdea,
  RegisteredComponentIdea,
  IdeaPlugin,
} from "./types";


/* =========================================
   REGISTRY
========================================= */

const registry =
  new Map<
    string,
    RegisteredIdea
  >();


/* =========================================
   HELPERS
========================================= */

function schemaToRegistrySchema(
  definition: AnyIdeaDefinition
):
  IdeaSchemaField[] {

  return definition.schema.map(
    (field) => ({
      name:
        field.name,

      type:
        field.type === "array"
          ? `array:${field.itemType ?? "unknown"}`
          : field.type,

      description:
        field.description,

      required:
        field.required,
    })
  );
}


function mergeStringArray(
  runtimeValue:
    | string[]
    | undefined,

  metadataValue:
    | string[]
    | undefined
):
  string[] {

  return Array.from(
    new Set([
      ...(runtimeValue ?? []),
      ...(metadataValue ?? []),
    ])
  );
}


/* =========================================
   REGISTER SCENE OBJECT
========================================= */

export function registerSceneObjectDefinition(
  definition: AnyIdeaDefinition
):
  RegisteredSceneObjectIdea {

  const metadata =
    getIdeaMetadata(
      definition.type
    );


  /*
   * Runtime definitions are canonical.
   *
   * JSON metadata only enriches them.
   */

  const runtimeDescription =
    definition.ai?.description;

  const metadataDescription =
    metadata?.description ??
    metadata?.ai?.description;


  const description =
    runtimeDescription ??
    metadataDescription;


  const tags =
    mergeStringArray(
      definition.ai?.tags,
      metadata?.tags ??
      metadata?.ai?.tags
    );


  const skills =
    mergeStringArray(
      definition.ai?.skills,
      metadata?.skills ??
      metadata?.ai?.skills
    );


  const schema =
    schemaToRegistrySchema(
      definition
    );


  const registered:
    RegisteredSceneObjectIdea = {

    id:
      definition.type,

    name:
      definition.name,

    category:
      definition.category,

    kind:
      "scene-object",

    definition,

    description,

    tags,

    skills,

    schema,

    metadata,
  };


  registry.set(
    registered.id,
    registered
  );


  return registered;
}


/* =========================================
   REGISTER COMPONENT
========================================= */

export function registerComponentIdea(
  id: string,

  name: string,

  category: string,

  definition: unknown,

  options: {
    description?: string;

    tags?: string[];

    skills?: string[];

    schema?: IdeaSchemaField[];
  } = {}
):
  RegisteredComponentIdea {

  const metadata =
    getIdeaMetadata(
      id
    );


  const registered:
    RegisteredComponentIdea = {

    id,

    name,

    category,

    kind:
      "component",

    definition,

    description:
      options.description ??
      metadata?.description ??
      metadata?.ai?.description,

    tags:
      mergeStringArray(
        options.tags,
        metadata?.tags ??
        metadata?.ai?.tags
      ),

    skills:
      mergeStringArray(
        options.skills,
        metadata?.skills ??
        metadata?.ai?.skills
      ),

    schema:
      options.schema ??
      metadata?.schema ??
      [],

    metadata,
  };


  registry.set(
    registered.id,
    registered
  );


  return registered;
}


/* =========================================
   REGISTER IDEA
========================================= */

export function registerIdea(
  idea: RegisteredIdea
):
  RegisteredIdea {

  registry.set(
    idea.id,
    idea
  );

  return idea;
}


/* =========================================
   REGISTER IDEAS
========================================= */

export function registerIdeas(
  ideas: RegisteredIdea[]
):
  void {

  for (
    const idea
    of ideas
  ) {

    registerIdea(
      idea
    );
  }
}


/* =========================================
   REGISTER PLUGIN
========================================= */

export function registerPlugin(
  plugin: IdeaPlugin
):
  void {

  for (
    const definition
    of plugin.ideas
  ) {

    registerSceneObjectDefinition(
      definition
    );
  }
}


/* =========================================
   COMPONENT IDEAS
========================================= */

function registerComponentIdeas():
  void {

  registerComponentIdea(
    "ground",
    "Ground",
    "Environment",
    Ground,
    {
      description:
        "Creates an interactive grid-based ground surface.",

      tags: [
        "ground",
        "floor",
        "grid",
        "surface",
      ],

      skills: [
        "environment.ground",
      ],

      schema: [
        {
          name: "size",
          type: "number",
        },
        {
          name: "gridSize",
          type: "integer",
        },
      ],
    }
  );


  registerComponentIdea(
    "cloudySky",
    "Cloudy Sky",
    "Environment",
    CloudySky,
    {
      description:
        "Creates a large cloudy procedural sky surrounding the scene.",

      tags: [
        "sky",
        "clouds",
        "environment",
        "atmosphere",
      ],

      skills: [
        "environment.sky",
      ],

      schema: [
        {
          name: "color",
          type: "color",
        },
        {
          name: "colors",
          type: "array:number",
        },
      ],
    }
  );


  registerComponentIdea(
    "proximityPicture",
    "Proximity Picture",
    "Media",
    ProximityPicture,
    {
      description:
        "Displays user content when the player enters a defined radius.",

      tags: [
        "image",
        "video",
        "picture",
        "proximity",
        "media",
      ],

      skills: [
        "media.proximity",
      ],
    }
  );
}


/* =========================================
   INITIALIZE CORE IDEAS
========================================= */

export function initializeCoreIdeas():
  void {

  /*
   * Prevent duplicate initialization.
   */

  if (
    registry.size > 0
  ) {
    return;
  }


  for (
    const definition
    of getIdeaDefinitions()
  ) {

    registerSceneObjectDefinition(
      definition
    );
  }


  registerComponentIdeas();
}


/* =========================================
   GET REGISTERED IDEA
========================================= */

export function getRegisteredIdea(
  id: string
):
  RegisteredIdea | undefined {

  initializeCoreIdeas();

  return registry.get(
    id
  );
}


/* =========================================
   GET ALL REGISTERED IDEAS
========================================= */

export function getRegisteredIdeas():
  RegisteredIdea[] {

  initializeCoreIdeas();

  return Array.from(
    registry.values()
  );
}


/* =========================================
   SCENE OBJECT IDEAS
========================================= */

export function getSceneObjectIdeas():
  RegisteredSceneObjectIdea[] {

  initializeCoreIdeas();

  return Array.from(
    registry.values()
  ).filter(
    (
      idea
    ): idea is RegisteredSceneObjectIdea =>
      idea.kind ===
      "scene-object"
  );
}


/* =========================================
   COMPONENT IDEAS
========================================= */

export function getComponentIdeas():
  RegisteredComponentIdea[] {

  initializeCoreIdeas();

  return Array.from(
    registry.values()
  ).filter(
    (
      idea
    ): idea is RegisteredComponentIdea =>
      idea.kind ===
      "component"
  );
}


/* =========================================
   GET DEFINITION
========================================= */


export function getIdeaDefinition(
  type: AnyIdeaDefinition["type"]
): AnyIdeaDefinition | undefined {

  /*
   * Runtime scene-object definitions are canonical.
   *
   * Do not allow a component/metadata registration
   * with the same id to shadow an actual scene object.
   */

  const registered =
    registry.get(type);


  if (
    registered &&
    registered.kind === "scene-object"
  ) {
    return registered.definition;
  }


  /*
   * Fallback directly to the canonical definition list.
   *
   * This protects createSceneObject() from registry
   * collisions introduced by plugins, metadata, or
   * legacy component registrations.
   */

  const definition =
    getIdeaDefinitions().find(
      (idea) =>
        idea.type === type
    );


  return definition;
}



/* =========================================
   CATEGORIES
========================================= */

export function getIdeaCategories():
  string[] {

  initializeCoreIdeas();

  return Array.from(
    new Set(
      Array.from(
        registry.values()
      ).map(
        (idea) =>
          idea.category
      )
    )
  );
}


/* =========================================
   IDEAS BY CATEGORY
========================================= */

export function getIdeasByCategory(
  category: string
):
  RegisteredIdea[] {

  initializeCoreIdeas();

  return Array.from(
    registry.values()
  ).filter(
    (idea) =>
      idea.category ===
      category
  );
}


/* =========================================
   COMPONENTS BY CATEGORY
========================================= */

export function getComponentsByCategory(
  category: string
):
  RegisteredComponentIdea[] {

  return getComponentIdeas()
    .filter(
      (idea) =>
        idea.category ===
        category
    );
}


/* =========================================
   SEARCH
========================================= */

export function searchRegisteredIdeas(
  query: string
):
  RegisteredIdea[] {

  initializeCoreIdeas();

  const normalized =
    query
      .trim()
      .toLowerCase();


  if (
    !normalized
  ) {

    return getRegisteredIdeas();
  }


  return getRegisteredIdeas()
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
            ...(idea.metadata?.ai?.synonyms ?? []),
            ...(idea.metadata?.ai?.examples ?? []),
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
   CLEAR
========================================= */

export function clearIdeaRegistry():
  void {

  registry.clear();
}


/* =========================================
   EXPORT METADATA SNAPSHOT
========================================= */

export function getIdeaMetadataIndex():
  Array<{
    id: string;

    name: string;

    category: string;

    kind: string;

    description?: string;

    tags: string[];

    skills: string[];

    schema: IdeaSchemaField[];
  }> {

  initializeCoreIdeas();

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
      })
    );
}


/* =========================================
   INITIALIZE
========================================= */

initializeCoreIdeas();

