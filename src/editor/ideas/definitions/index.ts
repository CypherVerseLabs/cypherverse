import {
  mediaIdeas,
} from "./core/media";

import {
  environmentIdeas,
} from "./core/environment";

import {
  customIdeas,
} from "./custom";

import type {
  AnyIdeaDefinition,
} from "../types";


/* =========================================
   CORE DEFINITIONS
========================================= */

export const ideaDefinitions:
  AnyIdeaDefinition[] = [

    ...mediaIdeas,
    ...environmentIdeas,
    ...customIdeas,

  ];


/* =========================================
   ALL DEFINITIONS
========================================= */

export function getIdeaDefinitions():
  readonly AnyIdeaDefinition[] {

  return ideaDefinitions;
}