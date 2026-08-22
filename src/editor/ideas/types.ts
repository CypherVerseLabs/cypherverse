import type {
  ComponentType,
} from "react";

import {
  SceneObject,
} from "../scene/objectTypes";


/* =========================================
   IDEA TYPE
========================================= */

export type IdeaType =
  SceneObject["type"];


/* =========================================
   FIELD TYPES
========================================= */

export type IdeaFieldType =
  | "string"
  | "image"
  | "video"
  | "audio"
  | "gltf"
  | "number"
  | "float"
  | "integer"
  | "radius"
  | "color"
  | "boolean"
  | "vector2"
  | "array";


/* =========================================
   ARRAY ITEM TYPE
========================================= */

export type IdeaArrayItemType =
  | "string"
  | "number"
  | "float"
  | "integer"
  | "radius"
  | "color"
  | "boolean"
  | "vector2";


/* =========================================
   BASE FIELD
========================================= */

type BaseIdeaField = {
  name: string;

  label?: string;

  placeholder?: string;

  step?: number;
};


/* =========================================
   IDEA FIELD
========================================= */

export type IdeaField =
  | (BaseIdeaField & {
      type:
        | "string"
        | "image"
        | "video"
        | "audio"
        | "gltf"
        | "number"
        | "float"
        | "integer"
        | "radius"
        | "color"
        | "boolean"
        | "vector2";
    })
  | (BaseIdeaField & {
      type: "array";

      itemType: IdeaArrayItemType;
    });


/* =========================================
   IDEA DEFINITION
========================================= */

export type IdeaDefinition<
  T extends SceneObject
> = {
  type: T["type"];

  name: string;

  category: string;

  schema: IdeaField[];

  create: (
    overrides?: Partial<T>
  ) => T;

  ai?: {
    description?: string;

    tags?: string[];

    skills?: string[];
  };
};


/* =========================================
   ANY IDEA DEFINITION
========================================= */

export type AnyIdeaDefinition = {
  [K in SceneObject["type"]]:
    IdeaDefinition<
      Extract<
        SceneObject,
        { type: K }
      >
    >;
}[SceneObject["type"]];


/* =========================================
   IDEA KIND
========================================= */

export type IdeaKind =
  | "scene-object"
  | "component";


/* =========================================
   IDEA SCHEMA FIELD
========================================= */

export type IdeaSchemaField = {
  name: string;

  type: string;

  required?: boolean;

  description?: string;
};


/* =========================================
   REGISTERED SCENE OBJECT
========================================= */

export type RegisteredSceneObjectIdea<
  T extends AnyIdeaDefinition = AnyIdeaDefinition
> = {
  id: T["type"];

  name: T["name"];

  category: T["category"];

  kind: "scene-object";

  definition: T;

  description?: string;

  tags?: string[];

  skills?: string[];

  schema?: IdeaSchemaField[];
};


/* =========================================
   REGISTERED COMPONENT
========================================= */

export type RegisteredComponentIdea = {
  id: string;

  name: string;

  category: string;

  kind: "component";

  component: ComponentType;

  description?: string;

  tags?: string[];

  skills?: string[];

  schema?: IdeaSchemaField[];
};


/* =========================================
   REGISTERED IDEA
========================================= */

export type RegisteredIdea =
  | RegisteredSceneObjectIdea
  | RegisteredComponentIdea;

/* =========================================
   SCENE OBJECT PLUGIN
========================================= */

export type IdeaPlugin = {
  name: string;

  ideas: AnyIdeaDefinition[];
};


/* =========================================
   COMPONENT PLUGIN
========================================= */

export type ComponentIdeaPlugin = {
  name: string;

  ideas: RegisteredComponentIdea[];
};


/* =========================================
   PLUGIN
========================================= */

export type ExtendedIdeaPlugin =
  | IdeaPlugin
  | ComponentIdeaPlugin;