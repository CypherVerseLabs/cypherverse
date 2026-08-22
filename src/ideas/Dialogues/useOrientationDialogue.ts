import type { DialogueFSM } from "cyengine";

export const introDialogue: DialogueFSM = [
  {
    key: "init",
    text:
      "Welcome to CypherVerse.\n\n" +
      "This short orientation will show you how to use the editor.",
  },

  {
    key: "movement",
    text:
      "Use WASD to move around your world.\n\n" +
      "Use your mouse to look around.",
  },

  {
    key: "editing",
    text:
      "Use the editor tools to add, move, rotate, and modify objects in your world.",
  },

  {
    key: "finish",
    text:
      "You're ready to start building.\n\n" +
      "Press Y at any time to skip the orientation.",
  },
];