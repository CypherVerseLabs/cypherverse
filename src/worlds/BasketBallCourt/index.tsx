import React from "react";
import { StandardReality, Model, LostWorld, Fog, Dialogue } from "cyengine";
import CloudySky from "ideas/CloudySky";
import Link from "../../ideas/Link";
import Analytics from "ideas/Analytics";
import Title from "ideas/Title";
import Ground from "ideas/Ground";
import { useApiDialogue } from "../../ideas/Dialogues/useApiDialogue";
import { useAuth } from "ideas/hooks/useAuth";

export default function BasketBallCourt() {
  const { walletAddress } = useAuth();

  const dialogue = useApiDialogue();


  return (
    <>
      {/* Friendly Welcome Message */}
      {walletAddress && (
        <div
          style={{
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
            userSelect: "none",
          }}
        >
          Welcome, {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
        </div>
      )}

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


        <Fog color="#b9b2b2" near={10} far={50} />
        <ambientLight />

        <group position-z={-2.25}>
          <Title position-y={1.2} position-z={-0.75}>
            welcome to Bitconi
          </Title>

          <Model position={[0, 2.0, -1.5]} src="./cyLogo.glb" />

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

            

            <Model position={[0, -0.8, -1.0]} src="./court.glb" />

            
            <Ground y={-0.50} /> 
            <Dialogue dialogue={dialogue} side="right" face enabled />
          </group>
        </group>

        
      </StandardReality>
    </>
  );
}
