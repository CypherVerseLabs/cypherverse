import React from "react";
import { useState } from "react";
import {  StandardReality, Model, LostWorld, Fog, Dialogue, Button, Image, } from "cyengine";
import CloudySky from "ideas/CloudySky";
import Link from "../../ideas/Link";
import Analytics from "ideas/Analytics";
import Title from "ideas/Title";
import Ground from "ideas/Ground";
import { useApiDialogue } from "../../ideas/Dialogues/useApiDialogue";
import { useAuth } from "ideas/hooks/useAuth";
import Test from "ideas/Text";

export default function Tower() {
  const { walletAddress } = useAuth();

  const dialogue = useApiDialogue();
const MODELS = [
    "https://d27rt3a60hh1lx.cloudfront.net/content/on-air-light/light_and_mic_01.glb.br",
    "https://d27rt3a60hh1lx.cloudfront.net/models/spotLight-1642615872/spotLight_2.glb.gz",
    "https://d1htv66kutdwsl.cloudfront.net/ae483f1d-77dc-4402-963d-b4105cd6c944/334823a4-b069-45fb-92e8-c88c2b55ba4a.glb",
  ];

const [ind, setInd] = useState(0);

  const next = () => setInd((ind + 1) % MODELS.length);

  const MODEL_URL = MODELS[ind];

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
        <Fog color="#b9b2b2" near={10} far={50} />
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

            
{/* <Dialogue dialogue={dialogue} side="right" face enabled /> */}
            
             
            
          </group>
        </group>


<group position-z={-3}>
        <Button onClick={next} position={[0.5, 0.5, 2]}>
          next model
        </Button>
        <Test name="basic model" position-x={1.2}>
          <Model src={MODEL_URL} />
        </Test>
        <Test name="center model" position-x={1.2 * 2}>
          <Model center src={MODEL_URL} />
        </Test>
        <Test name="normalize model" position-x={1.2 * 3}>
          <Model normalize src={MODEL_URL} />
        </Test>
        <Test name="normalize and center model" position-x={1.2 * 4}>
          <Model normalize center src={MODEL_URL} />
        </Test>
      </group>
      <group position-z={-3}>
        <Test name="fallback model (wireframe)" position-x={-1.2}>
          <Model normalize center src="sdjkfnoi" />
        </Test>
        <Test name="fallback image" position-x={-1.2 * 2}>
          <Image src="sdjkfnoi" />
        </Test>
      </group>



        
      </StandardReality>
    </>
  );
}
