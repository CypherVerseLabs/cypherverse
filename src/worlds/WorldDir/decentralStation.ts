import { World } from "cyengine";

const decentralStation = new World();
decentralStation.id = "feed-face-cafe-c0de";  // different unique ID
decentralStation.tree = [
  {
    id: "decentralStation",
    props: { type: "core", label: "Seed" },
    children: [
      { id: "idea-1", props: { type: "idea", label: "Spark" } },
      { id: "idea-2", props: { type: "idea", label: "Flame" } },
    ],
  },
];

export default decentralStation;
