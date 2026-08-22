// src/ideas/Dialogues/intro.ts

import type { DialogueFSM } from "cyengine";

export const introDialogue: DialogueFSM = [
  {
    key: "init",
    text: "What's your name?",
    input: {
      value: "",
      setValue: (val) => val,
      persist: true,
    },
    decisions: [
      {
        name: "Submit",
        nextKey: "loading",
      },
    ],
  },
  {
    key: "loading",
    text: "Sending to server...",
  },
  {
    key: "greet",
    text: "Hi there!",
  },
];
