
// src/ideas/ManageSite.tsx

import { Button } from "cyengine";
import type { Scene } from "../editor/scene/objectTypes";
import type { Project } from "./projects/useProjects";
import WorldCard from "./WorldCard";
import Words from "./Text";

type ManageSiteProps = {
  projects: Project[];
  loading?: boolean;
  error?: string | null;
};

export default function ManageSite({
  projects,
  loading = false,
  error = null,
}: ManageSiteProps) {
  const projectsWithScenes = projects.filter(
    (project) =>
      project.scene !== undefined &&
      project.scene !== null
  );

  return (
    <group name="manage-websites-panel">
      <Words
        color="#00FF88"
        position={[0, 2.2, 0]}
      >
        Manage Your Websites
      </Words>

      {loading && (
        <Words
          color="#00FF88"
          position={[0, 1.6, 0]}
        >
          Loading your websites...
        </Words>
      )}

      {error && (
        <Words
          color="#ff4444"
          position={[0, 1.6, 0]}
        >
          Unable to load your websites.
        </Words>
      )}

      {!loading &&
        !error &&
        projects.length === 0 && (
          <Words
            color="#cccccc"
            position={[0, 1.6, 0]}
          >
            You have not created a website yet.
          </Words>
        )}

      {!loading &&
        !error &&
        projectsWithScenes.map((project, index) => {
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
              projectId={project.id}
            />
          );
        })}

      {!loading &&
        !error &&
        projects.length > 0 &&
        projectsWithScenes.length === 0 && (
          <Words
            color="#aaaaaa"
            position={[0, 1.1, 0]}
          >
            Your websites are being prepared...
          </Words>
        )}

      <Button
        fontSize={0.1}
        maxWidth={1.5}
        position={[0, -3, 0]}
      >
        Back
      </Button>
    </group>
  );
}

