import React from "react";

import {
  Background,
} from "cyengine";

import {
  EditorTemplate,
} from "./types";

export const lostWorldTemplate: EditorTemplate = {
  id: "lost-world",

  name: "Lost World",

  description:
    "A blank world with the Lost World atmosphere and procedural floor.",

  /*
   * Scene objects are now represented as normal editor
   * scene objects so they can be selected, edited,
   * duplicated, removed, and changed by the user.
   *
   * The actual object definitions come from the
   * idea registry.
   */
  scene: {
    objects: [
      {
        id: "fog-1",

        type: "fog",

        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },

        props: {
          color: "#ffffff",
          near: 0.1,
          far: 15,
        },
      },

      {
        id: "lost-floor-1",

        type: "lostFloor",

        transform: {
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
        },

        props: {
          size: [10000, 10000],
          visible: true,
        },
      },
    ],
  },

  /*
   * Template-level environment.
   *
   * These are not editable SceneObjects. They are
   * permanent rendering/environment configuration
   * belonging to the template itself.
   */
  environment: (
    <group name="lost-world">

      <directionalLight
        position-y={1}
        intensity={1.8}
      />

      <ambientLight
        intensity={1}
      />

      <Background
        color="white"
      />

    </group>
  ),
};

