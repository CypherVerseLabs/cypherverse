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
import TemplateSelector from "ideas/TemplateSelector";

export default function Starter() {
  const {
    walletAddress,
    loginWithWallet,
    logout,
    loading,
  } = useAuthContext();

  /*
   * =========================================================
   * API DIALOGUE
   * =========================================================
   *
   * This is the main authentication / account dialogue.
   *
   * It handles:
   *
   * - Login with email
   * - Signup
   * - Login with wallet
   * - Logout
   * - Create a website
   * - Manage websites
   */
  const dialogue = useApiDialogue();

  /*
   * =========================================================
   * WALLET BUTTON
   * =========================================================
   *
   * This button is the small authentication button attached
   * to the dialogue.
   *
   * The actual email/password authentication is handled by
   * useApiDialogue().
   */
  const handleAuth = async () => {
    try {
      if (walletAddress) {
        await logout();
      } else {
        await loginWithWallet();
      }
    } catch (error) {
      console.error(
        "Authentication failed:",
        error
      );
    }
  };

  return (
    <StandardReality
      environmentProps={{
        dev:
          process.env.NODE_ENV ===
          "development",

        canvasProps: {
          frameloop: "demand",
        },
      }}
      playerProps={{
        flying: false,
      }}
    >
      <Analytics />

      <LostWorld />

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
          {/* =================================================
              NAVIGATION
              ================================================= */}

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

          <Button
            onClick={() =>
              console.log(
                "GitHub button clicked"
              )
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

          {/* =================================================
              LOGO
              ================================================= */}

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

          {/* =================================================
              ENVIRONMENT
              ================================================= */}

          <Rain color="blueviolet" />

          <PreloadImage />

          <Speaker
            position={[1, 0.0, -4.0]}
          />

          <Button
            onClick={() =>
              console.log(
                "Starter button clicked"
              )
            }
            fontSize={0.1}
            maxWidth={1}
            textColor="#120606ff"
            color="#b9c1f3ff"
            outline={false}
            outlineColor="#9f9f9f"
          >
            Click me!
          </Button>
        </group>
      </group>

      {/* =====================================================
          AUTHENTICATION / ACCOUNT DIALOGUE
          =====================================================

          THIS is the login/create-account dialogue.

          useApiDialogue() controls the state.

          When logged out:
            - Login with Wallet
            - Login with Email
            - Signup
            - What is Cypherverse?

          When logged in:
            - Create a Website
            - Manage My Websites
            - Logout

          "Create a Website" eventually leads to the
          TemplateSelector below.
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
          WEBSITE / PROJECT CREATION
          =====================================================

          TemplateSelector handles:

          1. Choosing Editor or Found
          2. Entering website name
          3. Creating the project in Neon
          4. Showing ownership confirmation
          5. Moving to Orientation

          The component itself verifies authentication before
          calling POST /api/projects.
          ===================================================== */}

      <group
        position={[3, -0.5, 7]}
      >
        <TemplateSelector />
      </group>
    </StandardReality>
  );
}