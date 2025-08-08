import { World } from "cyengine";


const worldNameMap = new Map<World, string>();

const wuHub = new World();
wuHub.id = "bada-f00d-cafe-foot"; // make sure this ID is unique
wuHub.tree = [
  {
    id: "wuHub",
    props: { type: "core", label: "Origin" },
    children: [
      {
        id: "vision",
        props: { type: "idea", label: "Wu Thought" },
      },
    ],
  },
];
worldNameMap.set(wuHub, "wuHub");


export default wuHub;
