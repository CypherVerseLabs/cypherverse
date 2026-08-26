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
import { Rain } from "ideas/Rain";
import Speaker from "ideas/players/Speaker";
import Analytics from "ideas/Analytics";
import Title from "ideas/Title";

import { useApiDialogue } from "../ideas/Dialogues/useApiDialogue";
import { introDialogue } from "ideas/Dialogues/intro";
import { useAuthContext } from "ideas/context/AuthContext";

import TemplateSelector from "ideas/TemplateSelector";
import Words from "ideas/Text";

import WorldCard from "ideas/WorldCard";
import {
  useProjects,
  type Project,
} from "ideas/projects/useProjects";

import type { Scene } from "../editor/scene/objectTypes";
import Cyrus from "ideas/characters/Cyrus";
import Ground from "ideas/Ground";
import ManageSite from "ideas/ManageSite";

export default function Starter() {
  /* =========================================================
     AUTHENTICATION
  ========================================================= */

  const {
    walletAddress,
    loginWithWallet,
    logout,
    loading,
  } = useAuthContext();

  /* =========================================================
     API DIALOGUE
  ========================================================= */

  const dialogue = useApiDialogue();

  /* =========================================================
     PROJECTS
  ========================================================= */

  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
  } = useProjects();

  console.log("STARTER PROJECTS:", projects);

  /* =========================================================
     WALLET AUTH
  ========================================================= */

  const handleAuth = async () => {
    try {
      if (walletAddress) {
        await logout();
      } else {
        await loginWithWallet();
      }
    } catch (error) {
      console.error("Authentication failed:", error);
    }
  };

  /* =========================================================
     PROJECTS WITH SCENES
  ========================================================= */

  const projectsWithScenes = projects.filter(
    (project: Project) =>
      project.scene !== undefined &&
      project.scene !== null
  );

  return (
    <StandardReality
      environmentProps={{
        dev: process.env.NODE_ENV === "development",

        canvasProps: {
          frameloop: "demand",
        },
      }}
      playerProps={{
        flying: false,
      }}
    >
      {/* =====================================================
          ANALYTICS
      ===================================================== */}

      <Analytics />

      {/* =====================================================
          BASE WORLD
      ===================================================== */}

      <LostWorld />

      {/* =====================================================
          SKY
      ===================================================== */}

      <CloudySky
        position={[0, 0, 0]}
        colors={[
          0.7,
          0.85,
          1,

          0.4,
          0.65,
          0.9,

          0.2,
          0.45,
          0.7,

          0.1,
          0.2,
          0.5,
        ]}
      />

      {/* =====================================================
          FOG
      ===================================================== */}

      <Fog
        color="#00ff00"
        near={10}
        far={50}
      />

      <ambientLight />

      {/* =====================================================
          MAIN STARTER WORLD
      ===================================================== */}

      <group position-z={-2.25}>
        <Title
          position-y={1.2}
          position-z={-0.75}
        >
          welcome to cyengine
        </Title>

        <Model
          position={[0, 2.0, -1.5]}
          src="./cyLogo.glb"
        />

        <group position-y={0.8}>
          <Button
            onClick={() =>
              console.log("GitHub button clicked")
            }
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

          <Rain color="blueviolet" />

          <Speaker position={[1, 0, -4]} />

          <Cyrus
            position={[0, 0.0, 0]}
            dialogue="i'm daydreaming ... and i want to build what i see!"
          />
        </group>
      </group>

      {/* =====================================================
          INTRO DIALOGUE
      ===================================================== */}

      <group>
        <Dialogue
          position={[1, 1.3, 0.3]}
          dialogue={introDialogue}
          side="right"
          face
          enabled
        />

        <Words color="#00FF88">
          Hello
        </Words>
      </group>

      {/* =====================================================
          TEST OBJECT
      ===================================================== */}

      

      {/* =====================================================
          ACCOUNT DIALOGUE

          useApiDialogue() controls:
          - Login
          - Signup
          - Create a Website
          - Manage My Websites
          - Logout
      ===================================================== */}

      <Dialogue
        position={[9, 1.3, 4.3]}
        dialogue={dialogue}
        side="right"
        face
        enabled
      >
        <Button
          onClick={handleAuth}
          fontSize={0.1}
          maxWidth={1}
        >
          {loading
            ? "Loading..."
            : walletAddress
              ? "Log Out"
              : "Sign In"}
        </Button>
      </Dialogue>

      {/* =====================================================
          CREATE PROJECT

          TemplateSelector already exists here.
          Do NOT duplicate it inside the dialogue.
      ===================================================== */}

      <group position={[3, -0.5, 7]}>
        <TemplateSelector />
      </group>

      {/* =====================================================
          USER WORLDS
      ===================================================== */}

      <group position={[0, 0, 5]}>
        <Title position={[0, 2.8, 0]}>
          Your Worlds
        </Title>

        {/* ===================================================
            LOADING
        =================================================== */}

        {projectsLoading && (
          <Words
            color="#00FF88"
            position={[0, 2.2, 0]}
          >
            Loading your worlds...
          </Words>
        )}

        {/* ===================================================
            ERROR
        =================================================== */}

        {projectsError && (
          <Words
            color="#ff4444"
            position={[0, 2.2, 0]}
          >
            Unable to load your worlds.
          </Words>
        )}

        {/* ===================================================
            NO PROJECTS
        =================================================== */}

        {!projectsLoading &&
          !projectsError &&
          projects.length === 0 && (
            <Words
              color="#cccccc"
              position={[0, 2.2, 0]}
            >
              You have not created a world yet.
            </Words>
          )}

        {/* ===================================================
            WORLD CARDS
        =================================================== */}

        {projectsWithScenes.map(
          (project, index) => {
            const column = index % 3;
            const row = Math.floor(index / 3);

            return (
              <WorldCard
                key={project.id}
                name={project.name}
                scene={project.scene as Scene}
                position={[
                  (column - 1) * 3.5,
                  -row * 4,
                  0,
                ]}
                projectId={""}
              />
            );
          }
        )}

        {/* ===================================================
            PROJECT EXISTS BUT HAS NO SCENE
        =================================================== */}

        {!projectsLoading &&
          !projectsError &&
          projects.length > 0 &&
          projectsWithScenes.length === 0 && (
            <Words
              color="#aaaaaa"
              position={[0, 1.7, 0]}
            >
              Your worlds are being prepared...
            </Words>
          )}
      </group>

        
      <group
  position={[10 , 0, 5,]}
>
  <ManageSite
    projects={projects}
    loading={projectsLoading}
    error={projectsError}
  />
</group>

      {/* =====================================================
          GROUND
      ===================================================== */}

      <group position-y={0.1}>
        <Ground />
      </group>


    </StandardReality>
  );
}

