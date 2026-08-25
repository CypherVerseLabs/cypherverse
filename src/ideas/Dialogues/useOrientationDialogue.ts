import type { DialogueFSM } from "cyengine";

/**
 * =========================================================
 * CYPHERVERSE BUILDER ORIENTATION
 * =========================================================
 *
 * Interactive onboarding for the Cypherverse Builder.
 *
 * Each panel is intentionally short so the dialogue
 * background has enough room for the text and buttons.
 *
 * Y-to-skip is handled separately by Orientation.tsx.
 *
 * The final "Enter Builder" button calls onEnterBuilder,
 * which is supplied by Orientation.tsx and handles routing
 * to the user's selected project world.
 */

export function createOrientationDialogue(
  onEnterBuilder: () => void
): DialogueFSM {
  return [
    {
      key: "init",
      text:
        "Welcome to Cypherverse Builder.\n\n" +
        "Let's take a quick look around.",
      decisions: [
        {
          name: "Begin",
          nextKey: "movement",
        },
        {
          name: "Skip",
          nextKey: "finish",
        },
      ],
    },

    {
      key: "movement",
      text:
        "Move around your world using WASD.\n\n" +
        "W — Forward\n" +
        "A — Left",
      decisions: [
        {
          name: "Next",
          nextKey: "movement2",
        },
        {
          name: "Back",
          nextKey: "init",
        },
      ],
    },

    {
      key: "movement2",
      text:
        "Keep moving with the other two keys.\n\n" +
        "S — Backward\n" +
        "D — Right",
      decisions: [
        {
          name: "Got It",
          nextKey: "camera",
        },
        {
          name: "Back",
          nextKey: "movement",
        },
      ],
    },

    {
      key: "camera",
      text:
        "Use your mouse to look around.\n\n" +
        "Explore the world and find a good place to build.",
      decisions: [
        {
          name: "Next",
          nextKey: "select",
        },
        {
          name: "Back",
          nextKey: "movement2",
        },
      ],
    },

    {
      key: "select",
      text:
        "First, select an object.\n\n" +
        "Choose the object you want to work with.",
      decisions: [
        {
          name: "Next",
          nextKey: "move",
        },
        {
          name: "Back",
          nextKey: "camera",
        },
      ],
    },

    {
      key: "move",
      text:
        "Move selected objects around your world.\n\n" +
        "Place them exactly where you want them.",
      decisions: [
        {
          name: "Next",
          nextKey: "rotate",
        },
        {
          name: "Back",
          nextKey: "select",
        },
      ],
    },

    {
      key: "rotate",
      text:
        "Rotate an object to change its direction.\n\n" +
        "Use rotation to create the look you want.",
      decisions: [
        {
          name: "Next",
          nextKey: "modify",
        },
        {
          name: "Back",
          nextKey: "move",
        },
      ],
    },

    {
      key: "modify",
      text:
        "Objects can have additional properties.\n\n" +
        "Use the editor controls to customize them.",
      decisions: [
        {
          name: "Next",
          nextKey: "workflow",
        },
        {
          name: "Back",
          nextKey: "rotate",
        },
      ],
    },

    {
      key: "workflow",
      text:
        "Build one step at a time.\n\n" +
        "Select an object, then make your changes.",
      decisions: [
        {
          name: "Next",
          nextKey: "experiment",
        },
        {
          name: "Back",
          nextKey: "modify",
        },
      ],
    },

    {
      key: "experiment",
      text:
        "Don't be afraid to experiment.\n\n" +
        "You can always change your objects later.",
      decisions: [
        {
          name: "I'm Ready",
          nextKey: "finish",
        },
        {
          name: "Back",
          nextKey: "workflow",
        },
      ],
    },

    {
      key: "finish",
      text:
        "You're ready to start building.\n\n" +
        "Press Y anytime to skip the orientation.",
      decisions: [
        {
          name: "Enter Builder",
          onClick: onEnterBuilder,
        },
        {
          name: "Review",
          nextKey: "movement",
        },
      ],
    },
  ];
}