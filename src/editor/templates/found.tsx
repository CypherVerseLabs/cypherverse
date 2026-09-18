import React from "react";

import {
  Background,
} from "cyengine";

import {
  EditorTemplate,
} from "./types";

import {
  createSceneObject,
} from "../ideas";

import {
  SceneObject,
} from "../scene/objectTypes";


/* =========================================
   FOUND OBJECT BUILDER
========================================= */

/**
 * Creates an object from the editor idea registry,
 * then applies Found's template-specific values.
 *
 * The registry remains the source of truth for the
 * object's type/default structure.
 *
 * Found remains free to customize the composition.
 */
function foundObject<T extends SceneObject>(
  type: T["type"],
  overrides: Partial<T>
): T {

  const object =
    createSceneObject(type) as unknown as T;

  return {
    ...object,
    ...overrides,

    transform: {
      ...object.transform,
      ...(overrides.transform ?? {}),
    },

    props: {
      ...object.props,
      ...(overrides.props ?? {}),
    },
  } as T;
}


/* =========================================
   FOUND SCENE
========================================= */

const foundScene = {
  objects: [

    /* =======================================
       CLOUDY SKY
    ======================================= */

    foundObject(
      "cloudySky",
      {
        id: "sky-1",

        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },

        props: {
          color: "#9efcff",

          colors: [
            0.7, 0.85, 1,
            0.4, 0.65, 0.9,
            0.2, 0.45, 0.7,
            0.1, 0.2, 0.5,
          ],
        },
      }
    ),


    /* =======================================
       RAIN
    ======================================= */

    foundObject(
      "rain",
      {
        id: "rain-1",

        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },

        props: {
          count: 5000,
          color: "#02e83c",
          size: 0.1,
        },
      }
    ),


    /* =======================================
       GROUND
    ======================================= */

    foundObject(
      "ground",
      {
        id: "ground-1",

        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },

        props: {
          size: 500,
          gridSize: 100,
        },
      }
    ),


    /* =======================================
       TITLE
    ======================================= */

    foundObject(
      "title",
      {
        id: "title-1",

        transform: {
          position: [0, 1.2, -0.75],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },

        props: {
          text: "welcome to Found",
          image: "",
        },
      }
    ),


    /* =======================================
       MODEL
    ======================================= */

    foundObject(
      "model",
      {
        id: "model-1",

        transform: {
          position: [0, 2, -1.5],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },

        props: {
          src: "./cyLogo.glb",
          center: false,
          normalize: false,
        },
      }
    ),


    /* =======================================
       LINK 1
    ======================================= */

    foundObject(
      "link",
      {
        id: "link-1",

        transform: {
          position: [-1.5, 0.8, 0.75],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },

        props: {
          href: "/multiplayer",
          text: "visit multiplayer page",
        },
      }
    ),


    /* =======================================
       LINK 2
    ======================================= */

    foundObject(
      "link",
      {
        id: "link-2",

        transform: {
          position: [-1, 0.8, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },

        props: {
          href: "/decentral_station",
          text: "Decentral Station",
        },
      }
    ),


    /* =======================================
       LINK 3
    ======================================= */

    foundObject(
      "link",
      {
        id: "link-3",

        transform: {
          position: [1, 0.8, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },

        props: {
          href: "/workshop",
          text: "visit workshop page",
        },
      }
    ),


    /* =======================================
       SPEAKER
    ======================================= */

    foundObject(
      "speaker",
      {
        id: "speaker-1",

        transform: {
          position: [1, 0, -4],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },

        props: {
          audioUrl:
            "https://d27rt3a60hh1lx.cloudfront.net/audio/nocopyright-lofi-muse.mp3",

          distance: 6,

          volume: 1,
        },
      }
    ),

  ],
};


/* =========================================
   FOUND TEMPLATE
========================================= */

export const foundTemplate: EditorTemplate = {
  id: "found",

  name: "Found",

  description:
    "A neon green rainy world with the CyBuilder logo and links to the CypherVerse spaces.",

  scene: foundScene,

  environment: (
    <group name="found-world">

      <Background
        color="black"
      />

      <ambientLight
        intensity={1}
      />

      <directionalLight
        position-y={5}
        intensity={1.5}
      />

    </group>
  ),
};
