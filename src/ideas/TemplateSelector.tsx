import {
  Image,
  Button,
  TextInput,
  Model,
} from "cyengine";

import { useState } from "react";

import { Text } from "@react-three/drei";

import Title from "./Title";

import { useAuthContext } from "ideas/context/AuthContext";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type TemplateId = "editor" | "found";

type Template = {
  id: TemplateId;
  name: string;
  description: string;
  route: string;
  previewImage: string;
};

type CreatedProject = {
  id: string;
  ownerId?: string;
  name: string;
  template: TemplateId;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

/*
 * =========================================================
 * SESSION STORAGE KEYS
 * =========================================================
 *
 * Keep these keys centralized so TemplateSelector and
 * Orientation use the exact same creation-session contract.
 */

const SESSION_KEYS = {
  projectId: "cypherverse-project-id",
  template: "cypherverse-template",
  templateRoute: "cypherverse-template-route",
  worldName: "cypherverse-world-name",
  creationSession: "cypherverse-creation-session",
} as const;

/*
 * =========================================================
 * API CONFIGURATION
 * =========================================================
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

/*
 * =========================================================
 * TEMPLATES
 * =========================================================
 */

const TEMPLATES: Template[] = [
  {
    id: "editor",
    name: "Editor",
    description:
      "Start with a blank world and build it yourself.",
    route: "/editor",
    previewImage: "/editor_preview.png",
  },

  {
    id: "found",
    name: "Found",
    description:
      "Begin with a ready-made world and make it your own.",
    route: "/found",
    previewImage: "/found_preview.png",
  },
];

/*
 * =========================================================
 * SESSION HELPERS
 * =========================================================
 *
 * These helpers make the creation handoff explicit and
 * consistent.
 */

const clearCreationSession = () => {
  sessionStorage.removeItem(
    SESSION_KEYS.projectId
  );

  sessionStorage.removeItem(
    SESSION_KEYS.template
  );

  sessionStorage.removeItem(
    SESSION_KEYS.templateRoute
  );

  sessionStorage.removeItem(
    SESSION_KEYS.worldName
  );

  sessionStorage.removeItem(
    SESSION_KEYS.creationSession
  );
};

const saveCreationSession = ({
  projectId,
  template,
  worldName,
}: {
  projectId: string;
  template: Template;
  worldName: string;
}) => {
  /*
   * Project ID
   */

  sessionStorage.setItem(
    SESSION_KEYS.projectId,
    projectId
  );

  /*
   * IMPORTANT:
   *
   * Store the template ID here:
   *
   *   "editor"
   *   "found"
   *
   * NOT:
   *
   *   "/editor"
   *   "/found"
   */

  sessionStorage.setItem(
    SESSION_KEYS.template,
    template.id
  );

  /*
   * Keep the route separately for consumers that need it.
   */

  sessionStorage.setItem(
    SESSION_KEYS.templateRoute,
    template.route
  );

  /*
   * World / project name
   */

  sessionStorage.setItem(
    SESSION_KEYS.worldName,
    worldName
  );

  /*
   * Explicitly mark this as an active creation session.
   */

  sessionStorage.setItem(
    SESSION_KEYS.creationSession,
    "true"
  );
};

/*
 * =========================================================
 * TEMPLATE PREVIEW
 * =========================================================
 */

function TemplatePreview({
  template,
}: {
  template: Template;
}) {
  return (
    <>
      {/* =====================================================
          PREVIEW
          ===================================================== */}

      <group
        position={[-1.6, 2, -1.5]}
      >
        <Model
          rotation={[
            0,
            Math.PI / 2,
            0,
          ]}
          src="./3dpanelmodel.glb"
        />

        <Image
          src={template.previewImage}
          size={1}
          position={[
            0,
            0,
            -0.05,
          ]}
          rotation={[
            0,
            Math.PI,
            0,
          ]}
          framed
        />
      </group>

      {/* =====================================================
          TEMPLATE INFORMATION
          ===================================================== */}

      <group
        position={[
          1.5,
          2.25,
          -1.55,
        ]}
        rotation={[
          0,
          Math.PI,
          0,
        ]}
      >
        <Title>
          {template.name}
        </Title>

        <Text
          color="white"
          fontSize={0.11}
          maxWidth={2}
          position={[
            0,
            -0.45,
            0,
          ]}
          anchorX="center"
          anchorY="middle"
        >
          {template.description}
        </Text>
      </group>
    </>
  );
}

/*
 * =========================================================
 * TEMPLATE SELECTOR
 * =========================================================
 */

export default function TemplateSelector() {
  const {
    authFetch,
    isAuthenticated,
  } = useAuthContext();

  const [index, setIndex] =
    useState(0);

  const [
    selectedTemplate,
    setSelectedTemplate,
  ] =
    useState<Template | null>(
      null
    );

  const [
    worldName,
    setWorldName,
  ] = useState("");

  const [
    createdProject,
    setCreatedProject,
  ] =
    useState<CreatedProject | null>(
      null
    );

  const [
    creating,
    setCreating,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  const template =
    TEMPLATES[index];

  /*
   * =========================================================
   * NEXT TEMPLATE
   * =========================================================
   */

  const nextTemplate = () => {
    setIndex(
      (current) =>
        (current + 1) %
        TEMPLATES.length
    );
  };

  /*
   * =========================================================
   * SELECT TEMPLATE
   * =========================================================
   */

  const useTemplate = () => {
    /*
     * Clear any stale creation session before starting a
     * completely new project flow.
     */

    clearCreationSession();

    setSelectedTemplate(
      template
    );

    setWorldName("");

    setCreatedProject(
      null
    );

    setError(null);
  };

  /*
   * =========================================================
   * CANCEL
   * =========================================================
   */

  const cancel = () => {
    /*
     * Do not leave an old project/template handoff behind.
     */

    clearCreationSession();

    setSelectedTemplate(
      null
    );

    setWorldName("");

    setCreatedProject(
      null
    );

    setError(null);
  };

  /*
   * =========================================================
   * CREATE PROJECT
   * =========================================================
   *
   * Creates the actual project in Neon.
   *
   * POST /api/projects
   *
   * The authenticated server determines the owner from
   * the JWT. The client does NOT send ownerId.
   * =========================================================
   */

  const createWorld = async () => {
    if (!selectedTemplate) {
      return;
    }

    const name =
      worldName.trim();

    if (!name) {
      setError(
        "Please enter a website name."
      );

      return;
    }

    /*
     * User must be authenticated.
     */

    if (!isAuthenticated) {
      setError(
        "Please sign in before creating a website."
      );

      return;
    }

    /*
     * Prevent duplicate requests.
     */

    if (creating) {
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response =
        await authFetch(
          `${API_URL}/api/projects`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name,

              /*
               * Server expects the template ID.
               *
               * "editor"
               * "found"
               */

              template:
                selectedTemplate.id,
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      /*
       * Server error.
       */

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Failed to create your website."
        );
      }

      /*
       * Server must return the created project.
       */

      if (!data?.project) {
        throw new Error(
          "The server did not return the created project."
        );
      }

      const project =
        data.project as CreatedProject;

      /*
       * Validate the important server response fields.
       */

      if (
        !project.id ||
        !project.name
      ) {
        throw new Error(
          "The server returned an invalid project."
        );
      }

      /*
       * =====================================================
       * SAVE CREATION SESSION
       * =====================================================
       *
       * This is the handoff:
       *
       * TemplateSelector
       *        ↓
       * Orientation
       *
       * Orientation will read these exact values.
       */

      saveCreationSession({
        projectId:
          project.id,

        template:
          selectedTemplate,

        worldName:
          project.name,
      });

      /*
       * Project successfully exists in Neon.
       */

      setCreatedProject(
        project
      );
    } catch (error) {
      console.error(
        "Create project failed:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create your website."
      );
    } finally {
      setCreating(false);
    }
  };

  /*
   * =========================================================
   * CREATE WEBSITE
   * =========================================================
   *
   * At this point the project already exists.
   *
   * This function does NOT create another project.
   *
   * It refreshes the creation-session handoff and sends the
   * user to Orientation.
   * =========================================================
   */

  const createWebsite = () => {
    if (
      !createdProject ||
      !selectedTemplate
    ) {
      return;
    }

    /*
     * Refresh the complete creation session.
     *
     * This makes the flow resilient even if something
     * modified sessionStorage while the user was here.
     */

    saveCreationSession({
      projectId:
        createdProject.id,

      template:
        selectedTemplate,

      worldName:
        createdProject.name,
    });

    /*
     * Continue into Orientation.
     */

    window.location.href =
      "/orientation";
  };

  /*
   * =========================================================
   * SELECTED TEMPLATE
   * =========================================================
   */

  if (selectedTemplate) {
    return (
      <group
        position={[0, 0.8, 0]}
      >
        {/* =================================================
            PREVIEW
            ================================================= */}

        <TemplatePreview
          template={
            selectedTemplate
          }
        />

        {/* =================================================
            BEFORE PROJECT CREATION
            ================================================= */}

        {!createdProject ? (
          <group
            position={[
              0,
              0.65,
              -1.55,
            ]}
          >
            <Text
              color="white"
              fontSize={0.13}
              position={[
                0,
                0,
                0,
              ]}
              rotation={[
                0,
                Math.PI,
                0,
              ]}
              anchorX="center"
              anchorY="middle"
            >
              What world are you dreaming of?
            </Text>

            <TextInput
              placeholder="Website name"
              fontSize={0.12}
              width={1.6}
              position={[
                0,
                -0.3,
                0,
              ]}
              rotation={[
                0,
                Math.PI,
                0,
              ]}
              value={worldName}
              onChange={(value) => {
                setWorldName(
                  value
                );

                setError(null);
              }}
            />

            {/* =================================================
                ERROR
                ================================================= */}

            {error && (
              <Text
                color="#ff6b6b"
                fontSize={0.09}
                maxWidth={2.4}
                position={[
                  0,
                  -0.52,
                  0,
                ]}
                rotation={[
                  0,
                  Math.PI,
                  0,
                ]}
                anchorX="center"
                anchorY="middle"
              >
                {error}
              </Text>
            )}

            {/* =================================================
                CANCEL
                ================================================= */}

            <Button
              position={[
                -0.45,
                -0.85,
                0,
              ]}
              rotation={[
                0,
                Math.PI,
                0,
              ]}
              onClick={cancel}
            >
              Cancel
            </Button>

            {/* =================================================
                CREATE
                ================================================= */}

            {worldName.trim() && (
              <Button
                position={[
                  0.45,
                  -0.85,
                  0,
                ]}
                rotation={[
                  0,
                  Math.PI,
                  0,
                ]}
                onClick={
                  createWorld
                }
              >
                {creating
                  ? "Creating..."
                  : "Create"}
              </Button>
            )}
          </group>
        ) : (
          /*
           * =================================================
           * PROJECT CREATED
           * =================================================
           */

          <group
            position={[
              0,
              0.65,
              -1.55,
            ]}
          >
            <Text
              color="white"
              fontSize={0.14}
              maxWidth={3}
              position={[
                0,
                0.15,
                0,
              ]}
              rotation={[
                0,
                Math.PI,
                0,
              ]}
              anchorX="center"
              anchorY="middle"
            >
              You're the proud new owner of
            </Text>

            <Text
              color="#7dd3fc"
              fontSize={0.17}
              maxWidth={3}
              position={[
                0,
                -0.12,
                0,
              ]}
              rotation={[
                0,
                Math.PI,
                0,
              ]}
              anchorX="center"
              anchorY="middle"
            >
              {createdProject.name}
            </Text>

            <Text
              color="white"
              fontSize={0.11}
              maxWidth={2.8}
              position={[
                0,
                -0.42,
                0,
              ]}
              rotation={[
                0,
                Math.PI,
                0,
              ]}
              anchorX="center"
              anchorY="middle"
            >
              Click below to create your website.
            </Text>

            <Button
              position={[
                0,
                -0.78,
                0,
              ]}
              rotation={[
                0,
                Math.PI,
                0,
              ]}
              onClick={
                createWebsite
              }
            >
              Create Website
            </Button>
          </group>
        )}
      </group>
    );
  }

  /*
   * =========================================================
   * TEMPLATE SELECTOR
   * =========================================================
   */

  return (
    <group
      position={[0, 0.8, 0]}
    >
      {/* =====================================================
          PREVIEW
          ===================================================== */}

      <TemplatePreview
        template={template}
      />

      {/* =====================================================
          TEMPLATE ACTIONS
          ===================================================== */}

      <group
        position={[
          0,
          0.9,
          -1.55,
        ]}
      >
        <Button
          position={[
            0.5,
            -0.4,
            0,
          ]}
          rotation={[
            0,
            Math.PI,
            0,
          ]}
          onClick={
            nextTemplate
          }
        >
          {`Use ${template.name}`}
        </Button>

        <Button
          position={[
            0.5,
            -0.7,
            0,
          ]}
          rotation={[
            0,
            Math.PI,
            0,
          ]}
          onClick={
            useTemplate
          }
        >
          {`Select ${template.name}`}
        </Button>
      </group>
    </group>
  );
}