import {
  StandardReality,
  LostWorld,
  VisualWorld,
} from "cyengine";


import Analytics from "ideas/Analytics";

import { sceneToWorld } from "../editor/scene/sceneToWorld";
import Cyrus from "ideas/characters/Cyrus";
import { scene } from "ideas/found";

const previewWorld = sceneToWorld(scene);



export default function Playground() {
  return (
    <StandardReality
      environmentProps={{
        dev: process.env.NODE_ENV === "development",

        canvasProps: {
          frameloop: "always",
        },
      }}
      playerProps={{
        flying: false,
      }}
    >
      <Analytics />

      <LostWorld />

      <ambientLight />

      {/* WORLD CARD */}
      <group position={[0, 0, -2]}>

        {/* VISUAL WORLD */}
        <VisualWorld
          world={previewWorld}
          position={[0, 2.5, 0]}
        />

        {/* BUILDER */}
        <Cyrus
          position={[4, 0.5, 0]}
          dialogue="i'm daydreaming ... and i want to build what i see!"
        />

        {/* WORLD INFORMATION */}
        <group position-y={0.7}>

          {/* WORLD NAME */}
        
        </group>
      </group>
    </StandardReality>
  );
}