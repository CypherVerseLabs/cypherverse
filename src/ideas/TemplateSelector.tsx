import {
  Image,
  Button,
  TextInput,
  Model,
} from "cyengine";

import {
  useEffect,
  useState,
} from "react";

import { Text } from "@react-three/drei";

import Title from "./inputs/Title";

import { useAuthContext } from "ideas/context/AuthContext";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type TemplateId = string;

type Template = {
  id: string;
  name: string;
  description: string;
  route: string;
  previewImage: string;
  scene: unknown;
};


type CreatedProject = {
  id: string;
  ownerId?: string;
  name: string;
  template: TemplateId;
  description?: string;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
};


/*
 * =========================================================
 * SESSION STORAGE KEYS
 * =========================================================
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
 * SESSION HELPERS
 * =========================================================
 */

const clearCreationSession = () => {
  if (typeof window === "undefined") {
    return;
  }

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
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(
    SESSION_KEYS.projectId,
    projectId
  );

  sessionStorage.setItem(
    SESSION_KEYS.template,
    template.id
  );

  sessionStorage.setItem(
    SESSION_KEYS.templateRoute,
    template.route
  );

  sessionStorage.setItem(
    SESSION_KEYS.worldName,
    worldName
  );

  sessionStorage.setItem(
    SESSION_KEYS.creationSession,
    "true"
  );
};

/*
 * =========================================================
 * NORMALIZE TEMPLATE
 * =========================================================
 *
 * This is the important part.
 *
 * The API might return a template with a missing field.
 * We make sure every value used by the 3D UI is a string.
 */

const normalizeTemplate = (
  value: any
): Template | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const id =
    typeof value.id === "string"
      ? value.id
      : "";

  const name =
    typeof value.name === "string"
      ? value.name
      : id || "Untitled Template";

  const description =
    typeof value.description === "string"
      ? value.description
      : "";

  const route =
    typeof value.route === "string"
      ? value.route
      : id
        ? `/${id}`
        : "";

  const previewImage =
    typeof value.previewImage === "string"
      ? value.previewImage
      : "";

  const scene =
    value.scene &&
    typeof value.scene === "object"
      ? value.scene
      : null;

  /*
   * A template without an ID is not usable.
   */

  if (!id) {
    console.warn(
      "Ignoring template without an id:",
      value
    );

    return null;
  }

  return {
    id,
    name,
    description,
    route,
    previewImage,
    scene,
  };
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
  /*
   * Extra protection.
   *
   * These are guaranteed strings even if something
   * unexpected reaches this component.
   */

  const name =
    typeof template.name === "string"
      ? template.name
      : "Untitled Template";

  const description =
    typeof template.description === "string"
      ? template.description
      : "";

  const previewImage =
    typeof template.previewImage === "string"
      ? template.previewImage
      : "";

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
          {name}
        </Title>

        {description && (
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
            {description}
          </Text>
        )}
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

  /*
   * =======================================================
   * TEMPLATE STATE
   * =======================================================
   */

  const [
    templates,
    setTemplates,
  ] = useState<Template[]>([]);

  const [
    loadingTemplates,
    setLoadingTemplates,
  ] = useState(true);

  const [
    templateError,
    setTemplateError,
  ] = useState<string | null>(
    null
  );

  const [
    index,
    setIndex,
  ] = useState(0);

  /*
   * =======================================================
   * SELECTED TEMPLATE
   * =======================================================
   */

  const [
    selectedTemplate,
    setSelectedTemplate,
  ] =
    useState<Template | null>(
      null
    );

  /*
   * =======================================================
   * WORLD NAME
   * =======================================================
   */

  const [
    worldName,
    setWorldName,
  ] = useState("");

  /*
   * =======================================================
   * CREATED PROJECT
   * =======================================================
   */

  const [
    createdProject,
    setCreatedProject,
  ] =
    useState<CreatedProject | null>(
      null
    );

  /*
   * =======================================================
   * CREATION STATE
   * =======================================================
   */

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

  /*
   * =========================================================
   * LOAD TEMPLATES
   * =========================================================
   */

  useEffect(() => {
    let cancelled = false;

    const loadTemplates =
      async () => {
        try {
          setLoadingTemplates(
            true
          );

          setTemplateError(
            null
          );

          const response =
            await authFetch(
              `${API_URL}/api/ideas`
            );

          const data =
            await response
              .json()
              .catch(() => null);

          if (!response.ok) {
            throw new Error(
              data?.error ||
                data?.message ||
                "Failed to load templates."
            );
          }

          /*
           * Support both:
           *
           * [...]
           *
           * and:
           *
           * { ideas: [...] }
           */

          const rawIdeas =
            Array.isArray(data)
              ? data
              : Array.isArray(
                  data?.ideas
                )
                ? data.ideas
                : [];

          /*
           * Normalize EVERY template.
           *
           * This prevents undefined values from reaching
           * Title, Image, Button, etc.
           */

          const normalizedTemplates: Template[] =
  rawIdeas
    .map(normalizeTemplate)
    .filter(
      (item: Template | null): item is Template =>
        item !== null
    );

          console.log(
            "Loaded templates:",
            normalizedTemplates
          );

          if (cancelled) {
            return;
          }

          setTemplates(
            normalizedTemplates
          );

          setIndex(0);
        } catch (error) {
          if (cancelled) {
            return;
          }

          console.error(
            "Failed to load templates:",
            error
          );

          setTemplateError(
            error instanceof Error
              ? error.message
              : "Failed to load templates."
          );

          setTemplates([]);
        } finally {
          if (!cancelled) {
            setLoadingTemplates(
              false
            );
          }
        }
      };

    loadTemplates();

    return () => {
      cancelled = true;
    };
  }, [authFetch]);

  /*
   * =========================================================
   * CURRENT TEMPLATE
   * =========================================================
   */

  const template =
    templates[index];

  /*
   * =========================================================
   * NEXT TEMPLATE
   * =========================================================
   */

  const nextTemplate = () => {
    if (!templates.length) {
      return;
    }

    setIndex(
      (current) =>
        (current + 1) %
        templates.length
    );
  };

  /*
   * =========================================================
   * SELECT TEMPLATE
   * =========================================================
   */

  const useTemplate = () => {
    if (!template) {
      return;
    }

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

    if (!isAuthenticated) {
      setError(
        "Please sign in before creating a website."
      );

      return;
    }

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

              template:
                selectedTemplate.id,
            }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Failed to create your website."
        );
      }

      if (!data?.project) {
        throw new Error(
          "The server did not return the created project."
        );
      }

      const project =
        data.project as CreatedProject;

      if (
        !project.id ||
        !project.name
      ) {
        throw new Error(
          "The server returned an invalid project."
        );
      }

      saveCreationSession({
        projectId:
          project.id,

        template:
          selectedTemplate,

        worldName:
          project.name,
      });

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
   */

  const createWebsite = () => {
    if (
      !createdProject ||
      !selectedTemplate
    ) {
      return;
    }

    saveCreationSession({
      projectId:
        createdProject.id,

      template:
        selectedTemplate,

      worldName:
        createdProject.name,
    });

    window.location.href =
      "/orientation";
  };

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loadingTemplates) {
    return null;
  }

  /*
   * =========================================================
   * TEMPLATE LOAD ERROR
   * =========================================================
   */

  if (
    templateError &&
    !templates.length
  ) {
    return (
      <group
        position={[0, 0.8, 0]}
      >
        <Text
          color="#ff6b6b"
          fontSize={0.12}
          maxWidth={3}
          position={[
            0,
            0,
            -1.55,
          ]}
          rotation={[
            0,
            Math.PI,
            0,
          ]}
          anchorX="center"
          anchorY="middle"
        >
          {templateError}
        </Text>
      </group>
    );
  }

  /*
   * =========================================================
   * NO TEMPLATES
   * =========================================================
   */

  if (!templates.length) {
    return (
      <group
        position={[0, 0.8, 0]}
      >
        <Text
          color="white"
          fontSize={0.14}
          position={[
            0,
            0,
            -1.55,
          ]}
          rotation={[
            0,
            Math.PI,
            0,
          ]}
          anchorX="center"
          anchorY="middle"
        >
          No templates are currently available.
        </Text>
      </group>
    );
  }

  /*
   * =========================================================
   * SAFETY CHECK
   * =========================================================
   */

  if (!template) {
    return null;
  }

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
        <TemplatePreview
          template={
            selectedTemplate
          }
        />

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
              You&apos;re the proud new owner of
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
      <TemplatePreview
        template={template}
      />

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
          Next Template
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
