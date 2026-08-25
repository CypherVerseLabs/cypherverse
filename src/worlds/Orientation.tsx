import {
  Spinning,
  StandardReality,
  Button,
  Model,
  LostWorld,
  Fog,
  Dialogue,
  Key,
} from "cyengine";

import Analytics from "ideas/Analytics";
import Title from "ideas/Title";
import { createOrientationDialogue } from "ideas/Dialogues/useOrientationDialogue";
import { useAuthContext } from "ideas/context/AuthContext";

type ProjectTemplate = "editor" | "found";

export default function Orientation() {
  const {
    walletAddress,
    loginWithWallet,
    logout,
    loading,
    isAuthenticated,
  } = useAuthContext();

  /*
   * =========================================================
   * CREATION SESSION
   * =========================================================
   *
   * TemplateSelector creates the project in Neon before
   * sending the user here.
   *
   * The session contains:
   *
   *   cypherverse-project-id
   *   cypherverse-template
   *   cypherverse-template-route
   *   cypherverse-world-name
   *   cypherverse-creation-session
   *
   * sessionStorage is intentional here.
   *
   * This is a temporary handoff between:
   *
   * TemplateSelector
   *        ↓
   * Orientation
   *        ↓
   * Editor / Found
   */

  const projectId = sessionStorage.getItem(
    "cypherverse-project-id"
  );

  const templateValue = sessionStorage.getItem(
    "cypherverse-template"
  );

  const templateRoute = sessionStorage.getItem(
    "cypherverse-template-route"
  );

  const worldName = sessionStorage.getItem(
    "cypherverse-world-name"
  );

  const creationSession = sessionStorage.getItem(
    "cypherverse-creation-session"
  );

  /*
   * =========================================================
   * VALIDATE CREATION SESSION
   * =========================================================
   *
   * We do NOT want Orientation to silently create an editor
   * project if the session is missing.
   */

  const hasCreationSession =
    creationSession === "true" &&
    Boolean(projectId) &&
    Boolean(worldName);

  /*
   * =========================================================
   * DETERMINE TEMPLATE
   * =========================================================
   */

  const template: ProjectTemplate | null =
    templateValue === "editor" ||
    templateValue === "found"
      ? templateValue
      : templateRoute === "/found"
        ? "found"
        : templateRoute === "/editor"
          ? "editor"
          : null;

  /*
   * =========================================================
   * FINISH ORIENTATION
   * =========================================================
   *
   * The project has already been created in Neon.
   *
   * We are now handing the user and project into the
   * appropriate world experience.
   */

  const finishOrientation = () => {
    /*
     * Never enter a world without a valid creation session.
     */

    if (
      !hasCreationSession ||
      !projectId ||
      !template
    ) {
      console.error(
        "Invalid Cypherverse creation session.",
        {
          projectId,
          template,
          templateRoute,
          worldName,
          creationSession,
        }
      );

      /*
       * Return to the starter page rather than guessing
       * which world the user intended to enter.
       */

      window.location.href = "/";

      return;
    }

    /*
     * Keep the project information available to the
     * destination world.
     *
     * The editor/found world can use this project ID to
     * load/save the correct Neon project.
     */

    sessionStorage.setItem(
      "cypherverse-project-id",
      projectId
    );

    sessionStorage.setItem(
      "cypherverse-template",
      template
    );

    sessionStorage.setItem(
      "cypherverse-world-name",
      worldName || ""
    );

    /*
     * The creation session remains active because the next
     * world needs the project ID.
     */

    if (template === "found") {
      window.location.href = "/found";
      return;
    }

    window.location.href = "/editor";
  };

  /*
   * =========================================================
   * ORIENTATION DIALOGUE
   * =========================================================
   *
   * The dialogue receives finishOrientation so the final
   * "Enter Builder" button can directly enter the selected
   * project template.
   */

  const orientationDialogue =
    createOrientationDialogue(
      finishOrientation
    );

  /*
   * =========================================================
   * AUTH BUTTON
   * =========================================================
   *
   * This is only the wallet authentication button attached
   * to the Orientation dialogue.
   *
   * Email/password authentication is handled by the main
   * API dialogue in Starter.
   */

  const handleAuth = async () => {
    try {
      if (walletAddress) {
        await logout();
        return;
      }

      await loginWithWallet();
    } catch (error) {
      console.error(
        "Authentication failed:",
        error
      );
    }
  };

  /*
   * =========================================================
   * DEVELOPMENT LOGGING
   * =========================================================
   */

  if (
    process.env.NODE_ENV ===
    "development"
  ) {
    console.log(
      "CYPHERVERSE CREATION SESSION:",
      {
        projectId,
        template,
        templateRoute,
        worldName,
        creationSession,
        hasCreationSession,
        isAuthenticated,
      }
    );
  }

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

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

      <Fog
        color="#00ff00"
        near={10}
        far={50}
      />

      <ambientLight />

      {/* =====================================================
          ORIENTATION SCENE
          ===================================================== */}

      <group position-z={-2.25}>
        <Title
          position-y={1.2}
          position-z={-0.75}
        >
          welcome to Orientation
        </Title>

        <Model
          position={[
            0,
            2.0,
            -1.5,
          ]}
          src="./cyLogo.glb"
        />

        <group position-y={0.8}>
          <Spinning
            xSpeed={0}
            ySpeed={0.05}
            zSpeed={0}
          >
            <Model
              position={[
                0,
                0.2,
                1.5,
              ]}
              src="./cyLogo.glb"
            />
          </Spinning>
        </group>
      </group>

      {/* =====================================================
          SKIP ORIENTATION
          ===================================================== */}

      <Key
        keyCode="y"
        keyPress={["y", "Y"]}
        onPress={finishOrientation}
      />

      {/* =====================================================
          ORIENTATION DIALOGUE
          ===================================================== */}

      <Dialogue
        position={[
          1,
          1.3,
          0.3,
        ]}
        dialogue={orientationDialogue}
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

      
        
      
    </StandardReality>
  );
}