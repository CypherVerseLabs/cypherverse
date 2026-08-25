import type { DialogueFSM } from "cyengine";

/**
 * =========================================================
 * CYPHERVERSE INTRO
 * =========================================================
 *
 * Initial introduction for users arriving at Starter.
 *
 * This dialogue is separate from the Builder orientation.
 *
 * It does not:
 * - create projects
 * - route users
 * - enter the Builder
 * - use Y-to-skip
 *
 * It is simply the first introduction to Cypherverse.
 *
 * Each panel is intentionally short so the dialogue
 * background has enough room for the text and buttons.
 */

export const introDialogue: DialogueFSM = [
  {
    key: "init",
    text:
      "Welcome to Cypherverse.\n\n" +
      "A place to build, explore, and create.",
    decisions: [
      {
        name: "Begin",
        nextKey: "world",
      },
    ],
  },

  {
    key: "world",
    text:
      "Cypherverse is a 3D world for your ideas.\n\n" +
      "Create spaces that feel like your own.",
    decisions: [
      {
        name: "Next",
        nextKey: "create",
      },
      {
        name: "Back",
        nextKey: "init",
      },
    ],
  },

  {
    key: "create",
    text:
      "Build websites and experiences in 3D.\n\n" +
      "Start with a foundation and make it yours.",
    decisions: [
      {
        name: "Next",
        nextKey: "content",
      },
      {
        name: "Back",
        nextKey: "world",
      },
    ],
  },

  {
    key: "content",
    text:
      "Bring your content into your world.\n\n" +
      "Use images, video, sound, models, and more.",
    decisions: [
      {
        name: "Next",
        nextKey: "identity",
      },
      {
        name: "Back",
        nextKey: "create",
      },
    ],
  },

  {
    key: "identity",
    text:
      "Your world can represent you.\n\n" +
      "Build a space for your work, ideas, or community.",
    decisions: [
      {
        name: "Next",
        nextKey: "explore",
      },
      {
        name: "Back",
        nextKey: "content",
      },
    ],
  },

  {
    key: "explore",
    text:
      "Explore worlds created by others.\n\n" +
      "Discover new ideas and different ways to build.",
    decisions: [
      {
        name: "Next",
        nextKey: "tools",
      },
      {
        name: "Back",
        nextKey: "identity",
      },
    ],
  },

  {
    key: "tools",
    text:
      "Cypherverse gives you tools to create.\n\n" +
      "Build, edit, customize, and experiment.",
    decisions: [
      {
        name: "Next",
        nextKey: "projects",
      },
      {
        name: "Back",
        nextKey: "explore",
      },
    ],
  },

  {
    key: "projects",
    text:
      "Your projects belong to you.\n\n" +
      "Create different worlds for different ideas.",
    decisions: [
      {
        name: "Next",
        nextKey: "possibilities",
      },
      {
        name: "Back",
        nextKey: "tools",
      },
    ],
  },

  {
    key: "possibilities",
    text:
      "There are no limits to what you can build.\n\n" +
      "Start simple and keep expanding.",
    decisions: [
      {
        name: "Next",
        nextKey: "finish",
      },
      {
        name: "Back",
        nextKey: "projects",
      },
    ],
  },

  {
    key: "finish",
    text:
      "You're ready to explore Cypherverse.\n\n" +
      "Create something that feels like yours.",
    decisions: [
      {
        name: "Let's Go",
        nextKey: "done",
      },
      {
        name: "Review",
        nextKey: "init",
      },
    ],
  },

  {
    key: "done",
    text:
      "Welcome to Cypherverse.\n\n" +
      "Your journey starts here.",
  },
];