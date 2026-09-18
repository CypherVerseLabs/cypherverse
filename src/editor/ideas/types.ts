
import {
  SceneObject,
} from "../scene/objectTypes";


/* =========================================
   BASIC IDEA TYPES
========================================= */

export type IdeaType =
  SceneObject["type"];


export type IdeaFieldType =
  | "string"
  | "number"
  | "integer"
  | "float"
  | "boolean"
  | "color"
  | "image"
  | "audio"
  | "video"
  | "font"
  | "gltf"
  | "position"
  | "rotation"
  | "scale"
  | "radius"
  | "vector2"
  | "array"
  | "object"
  | "unknown";


export type IdeaArrayItemType = 
| "string" 
| "number" 
| "integer" 
| "float" 
| "boolean" 
| "color" 
| "image" 
| "video" 
| "audio" 
| "font" 
| "gltf" 
| "position" 
| "rotation" 
| "scale" 
| "radius";


/* =========================================
   EDITOR FIELD
========================================= */

export type IdeaField = {
  name: string;

  type: IdeaFieldType;

  label?: string;

  description?: string;

  placeholder?: string;

  required?: boolean;

  min?: number;

  max?: number;

  step?: number;

  itemType?: IdeaArrayItemType;
};


/* =========================================
   RUNTIME IDEA DEFINITION
========================================= */

export type IdeaDefinition<
  T extends SceneObject = SceneObject
> = {

  type: T["type"];

  name: string;

  category: string;

  schema: IdeaField[];

  ai?: {

    description?: string;

    tags?: string[];

    skills?: string[];
  };

  create: (
    overrides?: Partial<T>
  ) => T;
};


export type AnyIdeaDefinition =
  IdeaDefinition<any>;


/* =========================================
   IDEA KIND
========================================= */

export type IdeaKind =
  | "scene-object"
  | "component";


/* =========================================
   AI SCHEMA FIELD
========================================= */

export type IdeaSchemaField = {

  name: string;

  type: string;

  required?: boolean;

  description?: string;
};


/* =========================================
   EXTENDED IDEA METADATA
========================================= */

export type IdeaMetadata = {

  /*
   * Canonical runtime type/id.
   *
   * Example:
   *
   * "link"
   * "speaker"
   * "cloudySky"
   */
  id: string;

  /*
   * Optional explicit type.
   *
   * Usually the same as id.
   */
  type?: string;

  /*
   * Human-readable name.
   */
  name: string;

  /*
   * Human-readable description.
   */
  description?: string;

  /*
   * Runtime/editor category.
   */
  category: string;

  /*
   * Idea kind.
   */
  kind?: IdeaKind;

  /*
   * Search/AI tags.
   */
  tags?: string[];

  /*
   * AI capabilities/skills.
   */
  skills?: string[];

  /*
   * AI-readable schema.
   */
  schema?: IdeaSchemaField[];

  /*
   * Optional legacy/history information.
   */
  predecessor?: string;

  /*
   * Legacy purpose text.
   */
  purpose?: string;

  /*
   * Package dependencies used by the Idea.
   */
  npm_dependencies?: Record<
    string,
    string
  >;

  /*
   * Optional data URL.
   */
  data_url?: string | null;

  /*
   * Additional AI metadata.
   */
  ai?: {

    description?: string;

    tags?: string[];

    skills?: string[];

    examples?: string[];

    synonyms?: string[];

    instructions?: string;
  };
};


/* =========================================
   REGISTERED SCENE OBJECT
========================================= */

export type RegisteredSceneObjectIdea = {

  id: string;

  name: string;

  category: string;

  kind: "scene-object";

  definition: AnyIdeaDefinition;

  description?: string;

  tags: string[];

  skills: string[];

  schema: IdeaSchemaField[];

  metadata?: IdeaMetadata;
};


/* =========================================
   REGISTERED COMPONENT
========================================= */

export type RegisteredComponentIdea = {

  id: string;

  name: string;

  category: string;

  kind: "component";

  definition?: unknown;

  description?: string;

  tags: string[];

  skills: string[];

  schema: IdeaSchemaField[];

  metadata?: IdeaMetadata;
};


/* =========================================
   REGISTERED IDEA
========================================= */

export type RegisteredIdea =
  | RegisteredSceneObjectIdea
  | RegisteredComponentIdea;


/* =========================================
   PLUGINS
========================================= */

export type IdeaPlugin = {

  id: string;

  name: string;

  ideas: AnyIdeaDefinition[];
};


export type ComponentIdeaPlugin = {

  id: string;

  name: string;

  ideas: RegisteredComponentIdea[];
};


export type ExtendedIdeaPlugin = {

  id: string;

  name: string;

  ideas?: AnyIdeaDefinition[];

  components?: RegisteredComponentIdea[];
};

