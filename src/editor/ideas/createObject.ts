
import {
  SceneObject,
} from "../scene/objectTypes";

import {
  getIdeaDefinition,
} from "./registry";


/* =========================================
   CREATE SCENE OBJECT
========================================= */

export function createSceneObject(
  type: SceneObject["type"]
): SceneObject {

  /*
   * Scene objects must always resolve through
   * the canonical scene-object definition.
   *
   * This intentionally does NOT use
   * getRegisteredIdea() because the registry can
   * also contain component ideas.
   */

  const definition =
    getIdeaDefinition(
      type
    );


  if (!definition) {

    throw new Error(
      `No scene-object definition is registered for "${type}".`
    );
  }


  return definition.create();
}

