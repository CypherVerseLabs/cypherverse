import React from "react";
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
import { Rain } from "ideas/Rain";
import Speaker from "ideas/players/Speaker";
import Analytics from "ideas/Analytics";
import Title from "ideas/Title";
import Ground from "ideas/Ground";
import Bloom from "ideas/Bloom";
import { useApiDialogue } from "../ideas/Dialogues/useApiDialogue";
import { useAuthContext } from "ideas/context/AuthContext";

export default function Home() {
  const { walletAddress, loginWithWallet, logout, loading } = useAuthContext();
  const dialogue = useApiDialogue();

  console.log("Wallet Address:", walletAddress);

  if (loading) {
    return <div>Loading authentication...</div>; // or a spinner
  }

  return (
    <>
      {walletAddress && (
        <div style={{
          position: "fixed",
          top: 10,
          left: 10,
          color: "#fff",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: "8px 12px",
          borderRadius: "8px",
          fontFamily: "monospace",
          fontWeight: "bold",
          zIndex: 9999,
        }}>
          Hey, {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </div>
      )}

      <StandardReality
        environmentProps={{
          dev: process.env.NODE_ENV === "development",
          canvasProps: { frameloop: "demand" },
        }}
        playerProps={{ flying: false }}
      >
        <Analytics />
        <LostWorld />
        <CloudySky position={[0, 0, 0]} colors={[0.7, 0.85, 1, 0.4, 0.65, 0.9, 0.2, 0.45, 0.7, 0.1, 0.2, 0.5]} />
        <Rain color="#140c65" />
        <Fog color="#b9b2b2" near={10} far={50} />
        <ambientLight />

        <group position-z={-2.25}>
          <Title position-y={1.2} position-z={-0.75}>
            welcome to Bitconi
          </Title>
          <Model position={[0, 2.0, -1.5]} src="./cyLogoGold.glb" />

          <group position-y={0.8}>
            {walletAddress && (
              <>
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
                  onClick={loginWithWallet}
                  fontSize={0.1}
                  maxWidth={1}
                  textColor="#00ff00"
                  color="#222"
                  outline={true}
                  outlineColor="#222"
                >
                  Connect Wallet
                </Button>
                
                <Speaker position={[1, 0.0, -4.0]} />
              </>
            )}

            <Spinning xSpeed={0} ySpeed={1} zSpeed={0}>
              <Model position={[0, 0.2, 1.5]} src="./cyLogoGold.glb" />
            </Spinning>
            <Model position={[0, -0.2, -1.0]} src="./sector_01.2.glb" />

            <Bloom />
            <Ground />
          </group>
        </group>

        <Dialogue
  position={[3, 1.1, 1.0]}
  dialogue={dialogue}
  side="right"
  face
  enabled
>
  {walletAddress ? (
    <Button onClick={logout}>Log Out</Button>
  ) : (
    <Button onClick={loginWithWallet}>Sign In</Button>
  )}
</Dialogue>

      </StandardReality>
    </>
  );
}
