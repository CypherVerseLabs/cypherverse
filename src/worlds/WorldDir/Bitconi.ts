import { World } from "cyengine";

const bitconi = new World();
bitconi.id = "dead-beef-cafe-babe"; // this drives color + direction
bitconi.tree = [
  {
    id: "bitconi",
    props: { type: "core", label: "Heart" },
    children: [
      { id: "thought", props: { type: "idea", label: "Initial Thought" } },
      {
        id: "branch",
        props: { type: "extension", label: "Second Thought" },
        children: [
          {
            id: "leaf-1",
            props: { type: "leaf", label: "Final Fragment" },
          },
        ],
      },
    ],
  },
];


export default bitconi;

