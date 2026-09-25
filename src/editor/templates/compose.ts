import {
  createSceneObject,
} from "../ideas";

import type {
  Scene,
  SceneObject,
} from "../scene/objectTypes";


/* =========================================
   TEMPLATE OBJECT
========================================= */

export type TemplateObject =
  | SceneObject["type"]
  | {
      type: SceneObject["type"];

      id?: string;

      overrides?: Partial<SceneObject>;
    };


/* =========================================
   CREATE TEMPLATE OBJECT
========================================= */

function createTemplateObject(
  definition: TemplateObject
): SceneObject {

  if (
    typeof definition === "string"
  ) {

    return createSceneObject(
      definition
    );
  }


  const object =
  createSceneObject(
    definition.type
  );

if (definition.overrides) {
  Object.assign(
    object,
    definition.overrides
  );
}



  return object;
}


/* =========================================
   COMPOSE SCENE
========================================= */

export function composeScene(
  objects: TemplateObject[]
): Scene {

  return {
    objects:
      objects.map(
        createTemplateObject
      ),
  };
}
