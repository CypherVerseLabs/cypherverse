import {
  SceneObject,
} from "../scene/objectTypes";

import {
  getRegisteredIdea,
} from "./registry";


/* =========================================
   CREATE SCENE OBJECT
========================================= */

export function createSceneObject(
  type: SceneObject["type"]
): SceneObject {

  const idea =
    getRegisteredIdea(
      type
    );


  if (!idea) {

    throw new Error(
      `No editor idea is registered for "${type}".`
    );
  }


  if (
    idea.kind !==
    "scene-object"
  ) {

    throw new Error(
      `Idea "${type}" is not a scene-object definition.`
    );
  }


  return idea.definition.create();
}