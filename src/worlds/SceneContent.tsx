// worlds/SceneContent.tsx
import React from 'react'


import CloudySky from "../ideas/CloudySky";

import Ground from "../ideas/Ground";

import Title from "../ideas/Title";

import Bloom from "../ideas/Bloom";

import {
  LostWorld,   Fog, Spinning,
  Model,  Button, Dialogue,
   Floating
} from 'cyengine'
import { useApiDialogue } from "../ideas/Dialogues/useApiDialogue"
import { useAuthContext } from "ideas/context/AuthContext"
import Link from "../ideas/Link"
import Speaker from "ideas/players/Speaker"
import Analytics from "ideas/Analytics"
import Probe from "ideas/Probe"

export default function SceneContent() {
  const { walletAddress, loginWithWallet, logout } = useAuthContext()
  const dialogue = useApiDialogue()

  return (
    <>
      <Analytics />
      <LostWorld />
      <CloudySky position={[0, 0, 0]} colors={[0.7, 0.85, 1, 0.4, 0.65, 0.9, 0.2, 0.45, 0.7, 0.1, 0.2, 0.5]} />
      
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
              {/* Worlds */}
              
            </>
          )}

          <Spinning xSpeed={0} ySpeed={1} zSpeed={0}>
            <Model position={[0, 0.2, 1.5]} src="./cyLogoGold.glb" />
          </Spinning>

          <Model position={[-5, 0.90, -1.0]} src="./hall-transformed.glb" />
          <Floating height={0.2} speed={1}>
            <Probe position={[8, 0.4, -7]} scale={0.1} />
          </Floating>
          <Floating height={0.2} speed={1}>
            <Probe position={[4, 0.4, -7]} scale={0.05} rotation={[0, Math.PI / 2, 0]} />
          </Floating>
          <Bloom />
          <Ground y={-0.50} />
        </group>
      </group>

      <group>
        <Model position={[4, 0.0, 3.5]} src="./portal.glb" />
        <Dialogue position={[9, 1.3, 4.3]} dialogue={dialogue} side="right" face enabled>
          {walletAddress ? (
            <Button onClick={logout}>Log Out</Button>
          ) : (
            <Button onClick={loginWithWallet}>Sign In</Button>
          )}
        </Dialogue>
      </group>
    </>
  )
}
