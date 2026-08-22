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

type Template = {
  id: "editor" | "found";
  name: string;
  description: string;
  route: string;
  previewImage: string;
};

type CreatedProject = {
  id: string;
  ownerId?: string;
  name: string;
  template: "editor" | "found";
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

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
   * THIS is where the actual Neon database creation happens.
   *
   * The request:
   *
   * POST /api/projects
   *
   * sends:
   *
   * {
   *   name,
   *   template
   * }
   *
   * The server determines ownerId from the JWT.
   *
   * The client NEVER sends ownerId.
   * =========================================================
   */

  const createWorld = async () => {
    if (!selectedTemplate) {
      return;
    }

    const name =
      worldName.trim();

    if (!name) {
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
     * Prevent duplicate clicks.
     */

    if (creating) {
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response =
        await authFetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/projects`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name,

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
       * Server must return the
       * newly created project.
       */

      if (!data?.project) {
        throw new Error(
          "The server did not return the created project."
        );
      }

      const project =
        data.project as CreatedProject;

      /*
       * =====================================================
       * SAVE CREATION STATE
       * =====================================================
       *
       * We keep these values in sessionStorage so the next
       * page in the creation flow knows which project the
       * user is working on.
       */

      sessionStorage.setItem(
        "cypherverse-project-id",
        project.id
      );

      sessionStorage.setItem(
        "cypherverse-template",
        selectedTemplate.route
      );

      sessionStorage.setItem(
        "cypherverse-world-name",
        project.name
      );

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
   * At this point the project already exists in Neon.
   *
   * This button does NOT create another project.
   *
   * It moves the user into the actual website/world
   * creation experience.
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
     * Make absolutely sure the next page has the
     * information it needs.
     */

    sessionStorage.setItem(
      "cypherverse-project-id",
      createdProject.id
    );

    sessionStorage.setItem(
      "cypherverse-template",
      selectedTemplate.route
    );

    sessionStorage.setItem(
      "cypherverse-world-name",
      createdProject.name
    );

    /*
     * Continue into orientation.
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