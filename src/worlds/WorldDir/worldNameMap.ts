import { World } from "cyengine";
import world from "./Bitconi";
import decentralStation from "./decentralStation";
import wuHub from "./wuHub";

const worldNameMap = new Map<World, string>();

worldNameMap.set(world, "/Bitconi");
worldNameMap.set(decentralStation, "/Decentral Station");
worldNameMap.set(wuHub, "/wuHub");


export { worldNameMap };
