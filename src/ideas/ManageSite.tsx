// src/ideas/ManageSite.tsx

import {
  Button,
  TextInput,
} from "cyengine";

import {
  useEffect,
  useState,
} from "react";

import { Text } from "@react-three/drei";

import type { Project } from "../projects/useProjects";
import Words from "./inputs/Text";
import Title from "./inputs/Title";

type ManageSiteProps = {
  projects: Project[];
  loading?: boolean;
  error?: string | null;
};

/*
 * =========================================================
 * MANAGE SITE
 * =========================================================
 *
 * This component manages the user's ACTUAL projects.
 *
 * It is intentionally separate from TemplateSelector.
 *
 * TemplateSelector:
 *
 *   Templates -> create project
 *
 * ManageSite:
 *
 *   Projects -> manage / visit project
 *
 * IMPORTANT:
 *
 * We do NOT require project.scene here.
 *
 * A project is a project because it has an ID.
 *
 * The scene is only the website/world content.
 * =========================================================
 */

export default function ManageSite({
  projects,
  loading = false,
  error = null,
}: ManageSiteProps) {
  /*
   * =======================================================
   * CURRENT PROJECT
   * =======================================================
   */

  const [
    index,
    setIndex,
  ] = useState(0);

  /*
   * =======================================================
   * URL
   * =======================================================
   *
   * Your current Project type does not contain a URL field.
   *
   * Therefore we temporarily derive the site URL from the
   * project ID.
   *
   * Once the backend has a real slug/url column, replace
   * this with project.slug / project.url.
   * =======================================================
   */

  const [
    siteUrl,
    setSiteUrl,
  ] = useState("");

  /*
   * =======================================================
   * SAVE STATE
   * =======================================================
   */

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    saveMessage,
    setSaveMessage,
  ] = useState<string | null>(
    null
  );

  /*
   * =======================================================
   * CURRENT PROJECT
   * =======================================================
   */

  const project =
    projects[index];

  /*
   * =======================================================
   * KEEP INDEX VALID
   * =======================================================
   */

  useEffect(() => {
    if (!projects.length) {
      setIndex(0);
      return;
    }

    if (index >= projects.length) {
      setIndex(
        projects.length - 1
      );
    }
  }, [
    projects,
    index,
  ]);

  /*
   * =======================================================
   * LOAD CURRENT PROJECT URL
   * =======================================================
   */

  useEffect(() => {
  if (!project) {
    setSiteUrl("");
    return;
  }

  setSiteUrl(
    project.slug ?? ""
  );

  setSaveMessage(null);
}, [
  project,
]);

  /*
   * =======================================================
   * NEXT PROJECT
   * =======================================================
   */

  const nextProject = () => {
    if (!projects.length) {
      return;
    }

    setIndex(
      (current) =>
        (current + 1) %
        projects.length
    );
  };

  /*
   * =======================================================
   * PREVIOUS PROJECT
   * =======================================================
   */

  const previousProject = () => {
    if (!projects.length) {
      return;
    }

    setIndex(
      (current) =>
        (current - 1 + projects.length) %
        projects.length
    );
  };

  /*
   * =======================================================
   * SAVE URL
   * =======================================================
   *
   * NOTE:
   *
   * There is currently no backend URL endpoint exposed
   * through Project/useProjects.
   *
   * Therefore this validates the URL and prepares the UI,
   * but does not pretend that it has been persisted.
   *
   * We can wire this to:
   *
   * PATCH /api/projects/:id
   *
   * once that backend route exists.
   * =======================================================
   */

  const saveUrl = async () => {
  if (!project) {
    return;
  }

  const value =
    siteUrl
      .trim()
      .replace(/^\/+|\/+$/g, "")
      .toLowerCase();

  if (!value) {
    setSaveMessage(
      "Please enter a website URL."
    );

    return;
  }

  setSaving(true);
  setSaveMessage(null);

  try {
    const response =
      await fetch(
        `/api/projects/${project.id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            slug: value,
          }),
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
          "Unable to save website URL."
      );
    }

    setSiteUrl(
      data.project.slug
    );

    setSaveMessage(
      "Website URL saved."
    );
  } catch (error) {
    console.error(
      "Save URL failed:",
      error
    );

    setSaveMessage(
      error instanceof Error
        ? error.message
        : "Unable to save the website URL."
    );
  } finally {
    setSaving(false);
  }
};


  /*
   * =======================================================
   * GO TO SITE
   * =======================================================
   */

  const goToSite = () => {
  if (!project) {
    return;
  }

  const value =
    siteUrl.trim();

  if (!value) {
    return;
  }

  window.location.href =
    `/site/${value}`;
};


  /*
   * =======================================================
   * LOADING
   * =======================================================
   */

  if (loading) {
    return (
      <group
        name="manage-websites-panel"
      >
        <Words
          color="#00FF88"
          position={[
            0,
            2.2,
            0,
          ]}
        >
          Manage Your Websites
        </Words>

        <Words
          color="#00FF88"
          position={[
            0,
            1.6,
            0,
          ]}
        >
          Loading your websites...
        </Words>
      </group>
    );
  }

  /*
   * =======================================================
   * ERROR
   * =======================================================
   */

  if (error) {
    return (
      <group
        name="manage-websites-panel"
      >
        <Words
          color="#00FF88"
          position={[
            0,
            2.2,
            0,
          ]}
        >
          Manage Your Websites
        </Words>

        <Words
          color="#ff4444"
          position={[
            0,
            1.6,
            0,
          ]}
        >
          Unable to load your websites.
        </Words>

        <Text
          color="#ff6666"
          fontSize={0.09}
          maxWidth={3}
          position={[
            0,
            1.2,
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
          {error}
        </Text>
      </group>
    );
  }

  /*
   * =======================================================
   * NO PROJECTS
   * =======================================================
   */

  if (!projects.length) {
    return (
      <group
        name="manage-websites-panel"
      >
        <Words
          color="#00FF88"
          position={[
            0,
            2.2,
            0,
          ]}
        >
          Manage Your Websites
        </Words>

        <Words
          color="#cccccc"
          position={[
            0,
            1.6,
            0,
          ]}
        >
          You have not created a website yet.
        </Words>

        <Text
          color="#aaaaaa"
          fontSize={0.1}
          maxWidth={3}
          position={[
            0,
            1.1,
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
          Create a website first and it will appear here.
        </Text>

        <Button
          fontSize={0.1}
          position={[
            0,
            0.5,
            -1.55,
          ]}
          rotation={[
            0,
            Math.PI,
            0,
          ]}
        >
          Back
        </Button>
      </group>
    );
  }

  /*
   * =======================================================
   * SAFETY
   * =======================================================
   */

  if (!project) {
    return null;
  }

  /*
   * =======================================================
   * PROJECT MANAGEMENT VIEW
   * =======================================================
   */

  return (
    <group
      name="manage-websites-panel"
      position={[
        0,
        0.8,
        0,
      ]}
    >
      {/* ===================================================
          TITLE
          =================================================== */}

      <Title
        
        position={[
          0,
          1.0,
          0,
        ]}
      >
        Manage Your Websites
      </Title>

      {/* ===================================================
          PROJECT COUNTER
          =================================================== */}

      <Text
        color="#070000"
        fontSize={0.09}
        position={[
          0,
          0.10,
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
        {`${index + 1} of ${projects.length}`}
      </Text>

      {/* ===================================================
          PROJECT NAME
          =================================================== */}

      <Text
        color="white"
        fontSize={0.2}
        maxWidth={3}
        position={[
          0,
          0.25,
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
        {project.name}
      </Text>

      {/* ===================================================
          TEMPLATE
          =================================================== */}

      <Text
        color="#000202"
        fontSize={0.1}
        position={[
          0,
          0.00,
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
        {`Template: ${project.template}`}
      </Text>

      {/* ===================================================
          WEBSITE URL LABEL
          =================================================== */}

      <Text
        color="white"
        fontSize={0.11}
        position={[
          0,
          0.92,
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
        Website URL
      </Text>

      {/* ===================================================
          URL INPUT
          =================================================== */}

      <TextInput
        placeholder="Website URL"
        fontSize={0.11}
        width={2}
        position={[
          0,
          0.48,
          -1.55,
        ]}
        rotation={[
          0,
          Math.PI,
          0,
        ]}
        value={siteUrl}
        onChange={(value) => {
          setSiteUrl(value);
          setSaveMessage(null);
        }}
      />

      {/* ===================================================
          SAVE MESSAGE
          =================================================== */}

      {saveMessage && (
        <Text
          color={
            saveMessage.startsWith(
              "URL ready"
            )
              ? "#7dd3fc"
              : "#ff6b6b"
          }
          fontSize={0.08}
          maxWidth={3}
          position={[
            0,
            0.2,
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
          {saveMessage}
        </Text>
      )}

      {/* ===================================================
          PROJECT ACTIONS
          =================================================== */}

      <Button
        position={[
          -0.60,
          0.20,
          -1.55,
        ]}
        rotation={[
          0,
          Math.PI,
          0,
        ]}
        onClick={saveUrl}
      >
        {saving
          ? "Saving..."
          : "Save URL"}
      </Button>

      <Button
        position={[
          -0.60,
          0.10,
          -1.55,
        ]}
        rotation={[
          0,
          Math.PI,
          0,
        ]}
        onClick={goToSite}
      >
        Go To Site
      </Button>

      {/* ===================================================
          NAVIGATION
          =================================================== */}

      <Button
        position={[
          0.65,
          0.20,
          -1.55,
        ]}
        rotation={[
          0,
          Math.PI,
          0,
        ]}
        onClick={
          previousProject
        }
      >
        Previous
      </Button>

      <Button
        position={[
          0.65,
          0.10,
          -1.55,
        ]}
        rotation={[
          0,
          Math.PI,
          0,
        ]}
        onClick={
          nextProject
        }
      >
        Next
      </Button>

      {/* ===================================================
          PROJECT INFO
          =================================================== */}

      <Text
        color="#777777"
        fontSize={0.075}
        maxWidth={3}
        position={[
          0,
          -0.95,
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
        {`Project ID: ${project.id}`}
      </Text>

      {/* ===================================================
          BACK
          =================================================== */}

      <Button
        fontSize={0.1}
        position={[
          0,
          -1.35,
          -1.55,
        ]}
        rotation={[
          0,
          Math.PI,
          0,
        ]}
      >
        Back
      </Button>
    </group>
  );
}
