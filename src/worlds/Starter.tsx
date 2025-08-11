import React from "react";
import {
  Spinning,
  StandardReality,
  Button,
  Model,
  LostWorld,
  Fog,
  Dialogue,
  VisualWorld,
  Floating,
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
import wuHub from "./WorldDir/wuHub";
import Bitconi from "./WorldDir/Bitconi";
import decentralStation from "./WorldDir/decentralStation";
import { worldNameMap } from "./WorldDir/worldNameMap";
import Probe from "ideas/Probe";



export default function Home() {
  const { walletAddress, loginWithWallet, logout, loading } = useAuthContext();
  const dialogue = useApiDialogue();
  const worlds = [Bitconi, decentralStation, wuHub ];

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
          canvasProps: { frameloop: "always" },
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

                <Link href="/tower" position-x={-3}>
                  Tower
                </Link>
                <Link href="/basketBallCourt" position-x={-4}>
                  B-BallCourt
                </Link>

                <Link href="/woHub" position-x={1}>
                  visit worldHub page
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

        {/* Bitconi */}
        <group position={[4, 3, 2]}>
          <VisualWorld world={Bitconi} />
          <Title position-y={-0.3}>
            {worldNameMap.get(Bitconi) || "Unnamed World"}
          </Title>
        </group>

        {/* Decentral Station */}
        <group position={[3, 4, 3]}>
          <VisualWorld world={decentralStation}  />
          <Title position-y={-0.3}>
           {worldNameMap.get(decentralStation) || "Unnamed World"}
          </Title>
       </group>

        {/* WuHub */}
        <group position={[4, 2, 3.2]}>
         <VisualWorld world={wuHub}  />
            <Title position-y={-0.3}>
           {worldNameMap.get(wuHub) || "Unnamed World"}
            </Title>
        </group>
              </>
            )}

            <Spinning xSpeed={0} ySpeed={1} zSpeed={0}>
              <Model position={[0, 0.2, 1.5]} src="./cyLogoGold.glb" />
            </Spinning>
            <Model position={[-5, 0.90, -1.0]} src="./hall-transformed.glb" />

            <Floating height={0.2} speed={1}>
              <Probe position={[8, 0.4, -7]} scale={0.1} />
            </Floating>

            <Floating height={0.6} speed={1}>
              <Probe position={[8, 0.4, -7]} scale={0.05} rotation={[0, Math.PI / 2, 0]} />
            </Floating>

            <Bloom />
            
            
            <Ground y={-0.50} />    
          </group>
        </group>


<group>
  
  {/* Shared portal model */}
  <Model position={[4, 0.0, 3.5]} src="./portal.glb" />

  <Dialogue
  position={[9, 1.3, 4.3]}
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
</group>

      </StandardReality>
    </>
  );
}

