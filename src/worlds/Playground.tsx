import {
  StandardReality,
  LostWorld,
  VisualWorld,
} from "cyengine";

import { Text } from "@react-three/drei";

import Analytics from "ideas/Analytics";

import { scene } from "../templates/found";
import { sceneToWorld } from "../editor/scene/sceneToWorld";
import Cyrus from "ideas/characters/Cyrus";

const previewWorld = sceneToWorld(scene);

const objectCount = scene.objects.length;

const modelCount = scene.objects.filter(
  (object) => object.type === "model"
).length;

const linkCount = scene.objects.filter(
  (object) => object.type === "link"
).length;

const hasRain = scene.objects.some(
  (object) => object.type === "rain"
);

const hasGround = scene.objects.some(
  (object) => object.type === "ground"
);

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