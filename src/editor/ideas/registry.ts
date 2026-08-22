import Ground from "../../ideas/Ground";
import CloudySky from "../../ideas/CloudySky";
import ProximityPicture from "../../ideas/decorations/ProximityPicture";

import {
  getIdeaDefinitions,
} from "./definitions";

import type {
  AnyIdeaDefinition,
  ComponentIdeaPlugin,
  IdeaPlugin,
  RegisteredComponentIdea,
  RegisteredIdea,
} from "./types";


/* =========================================
   REGISTRY
========================================= */

const registry =
  new Map<string, RegisteredIdea>();


let coreInitialized = false;


/* =========================================
   REGISTER
========================================= */

export function registerIdea(
  idea: RegisteredIdea
): void {

  if (registry.has(idea.id)) {
    throw new Error(
      `[CyBuilder] Idea "${idea.id}" is already registered.`
    );
  }

  registry.set(
    idea.id,
    idea
  );
}


/* =========================================
   REGISTER MANY
========================================= */

export function registerIdeas(
  ideas: RegisteredIdea[]
): void {

  for (const idea of ideas) {
    registerIdea(idea);
  }
}


/* =========================================
   SCENE OBJECT DEFINITION
========================================= */

function registerSceneObjectDefinition(
  definition: AnyIdeaDefinition
): void {

  registerIdea({
    id: definition.type,

    name: definition.name,

    category: definition.category,

    kind: "scene-object",

    definition,

    description:
      definition.ai?.description,

    tags:
      definition.ai?.tags,

    skills:
      definition.ai?.skills,

    schema:
      definition.schema.map(
        (field) => ({
          name: field.name,

          type:
            field.type === "array"
              ? `array:${field.itemType}`
              : field.type,
        })
      ),
  });
}


/* =========================================
   SCENE OBJECT IDEAS
========================================= */

function registerSceneObjectIdeas(): void {

  for (
    const definition of
      getIdeaDefinitions()
  ) {

    registerSceneObjectDefinition(
      definition
    );
  }
}


/* =========================================
   CORE COMPONENT IDEAS
========================================= */

function getCoreComponentIdeas():
  RegisteredComponentIdea[] {

  return [

    {
      id: "component:ground",

      name: "Ground",

      category: "Environment",

      kind: "component",

      component: Ground,

      description:
        "Interactive grid ground surface.",

      tags: [
        "ground",
        "floor",
        "surface",
        "terrain",
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
          type: "number",
        },
      ],
    },


    {
      id: "component:cloudy-sky",

      name: "Cloudy Sky",

      category: "Environment",

      kind: "component",

      component: CloudySky,

      description:
        "Procedural animated cloudy sky.",

      tags: [
        "sky",
        "cloud",
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
          type: "number[]",
        },
      ],
    },


    {
      id: "component:proximity-picture",

      name: "Proximity Picture",

      category: "Decorations",

      kind: "component",

      component:
        ProximityPicture,

      description:
        "An image that appears when the player approaches it.",

      tags: [
        "image",
        "picture",
        "proximity",
        "decoration",
        "media",
      ],

      skills: [
        "decoration.proximity-picture",
      ],

      schema: [
        {
          name: "image",
          type: "image",
        },
        {
          name: "position",
          type: "position",
        },
        {
          name: "scale",
          type: "scale",
        },
        {
          name: "rotation",
          type: "rotation",
        },
        {
          name: "radius",
          type: "radius",
        },
        {
          name: "framed",
          type: "boolean",
        },
      ],
    },

  ];
}


/* =========================================
   REGISTER CORE COMPONENTS
========================================= */

function registerComponentIdeas(): void {

  registerIdeas(
    getCoreComponentIdeas()
  );
}


/* =========================================
   PLUGIN
========================================= */

export function registerPlugin(
  plugin:
    | IdeaPlugin
    | ComponentIdeaPlugin
): void {

  for (const idea of plugin.ideas) {

    if (isSceneObjectDefinition(idea)) {

      registerSceneObjectDefinition(
        idea
      );

      continue;
    }

    registerIdea(
      idea
    );
  }
}


/* =========================================
   SCENE OBJECT TYPE GUARD
========================================= */

function isSceneObjectDefinition(
  idea:
    | AnyIdeaDefinition
    | RegisteredComponentIdea
): idea is AnyIdeaDefinition {

  return (
    "create" in idea &&
    "type" in idea &&
    "schema" in idea
  );
}


/* =========================================
   CORE INITIALIZATION
========================================= */

export function initializeCoreIdeas(): void {

  if (coreInitialized) {
    return;
  }

  registerSceneObjectIdeas();

  registerComponentIdeas();

  coreInitialized = true;
}


/* =========================================
   INITIALIZE CORE
========================================= */

initializeCoreIdeas();


/* =========================================
   LOOKUP
========================================= */

export function getRegisteredIdea(
  id: string
): RegisteredIdea | undefined {

  return registry.get(id);
}


/* =========================================
   SCENE OBJECT DEFINITION
========================================= */

export function getIdeaDefinition(
  type: AnyIdeaDefinition["type"]
): AnyIdeaDefinition | undefined {

  const idea =
    registry.get(type);

  if (
    !idea ||
    idea.kind !== "scene-object"
  ) {
    return undefined;
  }

  return idea.definition;
}


/* =========================================
   ALL
========================================= */

export function getRegisteredIdeas():
  RegisteredIdea[] {

  return Array.from(
    registry.values()
  );
}


/* =========================================
   SCENE OBJECT IDEAS
========================================= */

export function getSceneObjectIdeas():
  RegisteredIdea[] {

  return getRegisteredIdeas().filter(
    (idea) =>
      idea.kind === "scene-object"
  );
}


/* =========================================
   COMPONENT IDEAS
========================================= */

export function getComponentIdeas():
  RegisteredIdea[] {

  return getRegisteredIdeas().filter(
    (idea) =>
      idea.kind === "component"
  );
}


/* =========================================
   CATEGORIES
========================================= */

export function getIdeaCategories():
  string[] {

  return Array.from(
    new Set(
      getRegisteredIdeas().map(
        (idea) =>
          idea.category
      )
    )
  );
}


/* =========================================
   SCENE OBJECT CATEGORY
========================================= */

export function getIdeasByCategory(
  category: string
): RegisteredIdea[] {

  return getSceneObjectIdeas().filter(
    (idea) =>
      idea.category === category
  );
}


/* =========================================
   COMPONENT CATEGORY
========================================= */

export function getComponentsByCategory(
  category: string
): RegisteredIdea[] {

  return getComponentIdeas().filter(
    (idea) =>
      idea.category === category
  );
}


/* =========================================
   SEARCH
========================================= */

export function searchRegisteredIdeas(
  query: string
): RegisteredIdea[] {

  const normalized =
    query
      .trim()
      .toLowerCase();

  if (!normalized) {
    return getRegisteredIdeas();
  }

  return getRegisteredIdeas().filter(
    (idea) => {

      const text = [
        idea.id,
        idea.name,
        idea.category,
        idea.description ?? "",
        ...(idea.tags ?? []),
        ...(idea.skills ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(
        normalized
      );
    }
  );
}


/* =========================================
   CLEAR
========================================= */

export function clearIdeaRegistry(): void {

  registry.clear();

  coreInitialized = false;
}