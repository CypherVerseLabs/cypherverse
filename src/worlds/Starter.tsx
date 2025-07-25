import { Spinning, StandardReality, Button, Model, LostWorld, Fog, Dialogue } from "cyengine";
import CloudySky from "ideas/CloudySky";
import Link from "../ideas/Link";
import PreloadImage from "ideas/PreloadImage";
import { Rain } from "ideas/Rain";
import Speaker from "ideas/players/Speaker";
import Analytics from "ideas/Analytics";
import Title from "ideas/Title";
import Ground from "ideas/Ground";
import Bloom from "ideas/Bloom";
import { useApiDialogue } from "../ideas/Dialogues/useApiDialogue";
import { useWeb3Login } from "../ideas/hooks/useWeb3Login"; // ✅ import hook

export default function Starter() {
  const { loginWithWallet } = useWeb3Login();             // ✅ use hook
  const dialogue = useApiDialogue({ loginWithWallet });   // ✅ pass it in

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
          0.7, 0.85, 1,
          0.4, 0.65, 0.9,
          0.2, 0.45, 0.7,
          0.1, 0.2, 0.5,
        ]}
      />

      <Rain color={"#140c65"} />
      <Fog color="#b9b2b2" near={10} far={50} />
      <ambientLight />

      <group position-z={-2.25}>
        <Title position-y={1.2} position-z={-0.75}>
          welcome to cypherverse
        </Title>

        <Model position={[0, 2.0, -1.5]} src="./cyLogoGold.glb" />

        <group position-y={0.8}>
          <Link href="/multiplayer" position-x={-1.5} position-z={0.75}>
            visit multiplayer page
          </Link>

          <Link href="/decentral_station" position-x={-1}>
            Decentral Station
          </Link>

          <Link href="/bitconi" position-x={1}>
            visit Bitconi
          </Link>

          <Button
            onClick={() => console.log("Ive been clicked!")}
            fontSize={0.1}
            maxWidth={1}
            textColor="#ff0000"
            color="#b9c1f3"
            outline={false}
            outlineColor="#9f9f9f"
          >
            Visit GitHub
          </Button>

          <Spinning xSpeed={0} ySpeed={1} zSpeed={0}>
            <Model position={[0, 0.2, 1.5]} src="./cyLogo.glb" />
          </Spinning>

          <Model position={[0, -0.2, -1.0]} src="./sector_01.2.glb" />

          <PreloadImage />
          <Speaker position={[1, 0.0, -4.0]} />
          <Bloom />

          <Dialogue dialogue={dialogue} side="right" face enabled />
        </group>
      </group>

      <Ground size={500} gridSize={100} />
    </StandardReality>
  );
}
