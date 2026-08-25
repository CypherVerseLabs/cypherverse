
import {
  Spinning,
  StandardReality,
  Button,
  Model,
  Image,
  LostWorld,
  Fog,
  Video,
  Collidable,
} from "cyengine";

import CloudySky from "ideas/CloudySky";
import Link from "../ideas/Link";
import PreloadImage from "ideas/PreloadImage";
import { Rain } from "ideas/Rain";
import Analytics from "ideas/Analytics";
import Title from "ideas/Title";
import Ground from "ideas/Ground";

export default function Capitil() {
  return (
    <StandardReality
      environmentProps={{
        dev: process.env.NODE_ENV === "development",
        canvasProps: {
          frameloop: "demand",
        },
      }}
      playerProps={{
        pos: [0, 4, 0],
        flying: true,
      }}
    >
      <Analytics />

      <LostWorld />

      <CloudySky
        position={[0, 0, 0]}
        colors={[
          0.7, 0.85, 1, // light sky blue
          0.4, 0.65, 0.9, // medium blue
          0.2, 0.45, 0.7, // darker blue
          0.1, 0.2, 0.5, // deep blue
        ]}
      />

      <Fog
        color="#aacacb"
        near={10}
        far={50}
      />

      <ambientLight />

      <group position-z={-2.25}>
        {/* =========================
            TITLE / MAIN AREA
        ========================= */}

        <Title
          position-y={1.2}
          position-z={-0.75}
        >
          welcome to cyengine
        </Title>

        <Model
          position={[0, 2, -1.5]}
          src="./cyLogo.glb"
        />

        <group position-y={0.8}>
          {/* Navigation links */}

          <Link
            href="/multiplayer"
            position-x={-1.5}
            position-z={0.75}
          >
            visit multiplayer page
          </Link>

          <Link
            href="/decentral_station"
            position-x={-1}
          >
            Decentral Station
          </Link>

          <Link
            href="/workshop"
            position-x={1}
          >
            visit workshop page
          </Link>

          {/* GitHub button */}

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

          {/* Spinning logo */}

          <Spinning
            xSpeed={0}
            ySpeed={1}
            zSpeed={0}
          >
            <Model
              position={[0, 0.2, 1.5]}
              src="./cyLogo.glb"
            />
          </Spinning>

          {/* Rain */}

          <Rain color="blueviolet" />

          {/* Image */}

          <PreloadImage />

          {/* Ground */}

          <Ground />

          {/* =========================
              VISIBLE ENVIRONMENT
          ========================= */}

          

          {/* =========================
              ENVIRONMENT COLLISION
          ========================= */}

          
<Collidable
  triLimit={10000}
  enabled={true}
  hideCollisionMeshes={true}
>
  <Model
    src="https://lbemedia.net/IndoorEnviroment.glb"
    position={[-11, 0.05, -5]}
  />
</Collidable>




          {/* =========================
              LOGO / VIDEO AREA
          ========================= */}

           <Model
              position={[0, 1.00, 2.0]}
              src="./cyLogoGold.glb"
            />

            <Image
                    src="./cypher_bud.png"
                    position={[-9.0, 1.63, -1.03]}
                    rotation={[0, Math.PI, 0]}
                    framed
                  />

            <Image
                    src="./cypher-bear.png"
                    position={[-13.5, 1.60, -1.03]}
                    rotation={[0, Math.PI, 0]}
                    framed
                  />


          <group position-y={-1.01}>
            <Model
              position={[-11.3, 2.6, -1.076]}
              rotation={[0, Math.PI, 0]}
              src="./cyLogoGold.glb"
            />

            <Video
              src="https://lbemedia.net/videos/cv7add.mp4"
              size={3}
              position={[-14.8, 2.5, -5.076]}
              rotation={[0, Math.PI / 2, 0]}
              muted={false}
              framed={true}
            />
          </group>

          {/* Second video */}

          <group position-y={-1}>
            <Video
              src="https://lbemedia.net/videos/cv6add.mp4"
              size={4}
              position={[-6.9, 2.725, -5.076]}
              rotation={[0, Math.PI / 2, 0]}
              muted={false}
              framed={true}
            />
          </group>
        </group>
      </group>
    </StandardReality>
  );
}

