

import {
  Spinning,
  StandardReality,
  Button,
  Model,
  LostWorld,
  Fog,
  Dialogue,
} from "cyengine";

import CloudySky from "ideas/CloudySky";
import Link from "../ideas/Link";
import PreloadImage from "ideas/PreloadImage";
import { Rain } from "ideas/Rain";
import Speaker from "ideas/players/Speaker";
import Analytics from "ideas/Analytics";
import Title from "ideas/Title";

import { useApiDialogue } from "../ideas/Dialogues/useApiDialogue";
import { useAuthContext } from "ideas/context/AuthContext";

export default function Teaser() {
 

  

  return (
    <StandardReality
      environmentProps={{
        dev: process.env.NODE_ENV === "development",
        canvasProps: {
          frameloop: "demand",
        },
      }}
      playerProps={{ flying: false }}
    >
      <Analytics />
      <LostWorld />

      

      <Fog color="#9a9c9a" near={10} far={50} />

      <ambientLight />

      <group position-z={-2.25}>
        <Title position-y={1.2} position-z={-0.75}>
          welcome to Lost in Wonderland, Niggaaaa!
        </Title>

       
      </group>

      
    </StandardReality>
  );
}