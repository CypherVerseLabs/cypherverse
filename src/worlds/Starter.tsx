import { Spinning, StandardReality, Button, Model, LostWorld, Fog, } from "cyengine";
import CloudySky from "ideas/CloudySky";
import Link from "../ideas/Link"
import PreloadImage from "ideas/PreloadImage";
import { Rain } from "ideas/Rain";
import Speaker from "ideas/players/Speaker";
import Analytics from "ideas/Analytics";
import Title from "ideas/Title";
import Ground from "ideas/Ground";
import Bloom from "ideas/Bloom";




export default function Starter() {
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

      <CloudySky
        position={[0, 0, 0]}
        colors={[
          0.7, 0.85, 1,   // light sky blue
          0.4, 0.65, 0.9, // medium blue
          0.2, 0.45, 0.7, // darker blue
          0.1, 0.2, 0.5,  // deep blue
         ]}
      />

      <Fog color="#dedddd" near={10} far={50} />
      <ambientLight />
      <group position-z={-2.25}>
  <Title position-y={1.2} position-z={-0.75}>
    welcome to cyengine
  </Title>

  <Model position={[0, 2., -1.5]} src="./cyLogo.glb" />

  <group position-y={0.8}>
    <Link href="/multiplayer" position-x={-1.5} position-z={0.75}>
      visit multiplayer page
    </Link>
    <Link href="/decentral_station" position-x={-1}>
      Decentral Station
    </Link>
    <Link href="/workshop" position-x={1}>
      visit workshop page
    </Link>

    <Button
      onClick={() => console.log("Ive been clicked!")}
      fontSize={0.1}
      maxWidth={1}
      textColor="#ff0000ff"
      color="#b9c1f3ff"
      outline={false}
      outlineColor="#9f9f9f"
      position-x={1.5}
      position-z={0.75}
    >
      Visit GitHub
    </Button>

    <Spinning xSpeed={0} ySpeed={1} zSpeed={0}>
      <Model position={[0, 0.2, 1.5]} src="./cyLogo.glb" />
    </Spinning>

    <Rain color={"blueviolet"} />
    <PreloadImage />
    <Speaker position={[1, 0.0, -4.0]} />

    
  </group>
</group>
<Ground size={500} gridSize={100} />


<Bloom />
      
    </StandardReality>
  );
}
