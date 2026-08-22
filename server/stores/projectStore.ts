import { prisma } from "../lib/prisma.js";
import {
  Prisma,
  ProjectTemplate,
} from "../generated/prisma/client.js";

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  template: ProjectTemplate;
  scene?: unknown;
  createdAt: string;
  updatedAt: string;
}

function toProject(project: {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  template: ProjectTemplate;
  scene: unknown;
  createdAt: Date;
  updatedAt: Date;
}): Project {
  return {
    id: project.id,
    ownerId: project.ownerId,
    name: project.name,

    ...(project.description
      ? {
          description: project.description,
        }
      : {}),

    template: project.template,

    ...(project.scene !== null &&
    project.scene !== undefined
      ? {
          scene: project.scene,
        }
      : {}),

    createdAt:
      project.createdAt.toISOString(),

    updatedAt:
      project.updatedAt.toISOString(),
  };
}

/**
 * Convert arbitrary JSON data into the
 * Prisma JSON input type.
 *
 * Prisma requires Prisma.JsonNull
 * instead of plain JavaScript null
 * for a nullable JSON field.
 */
function toPrismaJson(
  value: unknown
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

/**
 * =========================================================
 * CREATE PROJECT
 * =========================================================
 */
export async function createProject(
  ownerId: string,
  name: string,
  description?: string,
  template: ProjectTemplate = ProjectTemplate.editor
): Promise<Project> {
  const project =
    await prisma.project.create({
      data: {
        ownerId,
        name: name.trim(),
        description:
          description?.trim() || null,
        template,
      },
    });

  return toProject(project);
}

/**
 * =========================================================
 * GET PROJECTS BY OWNER
 * =========================================================
 */
export async function getProjectsByOwnerId(
  ownerId: string
): Promise<Project[]> {
  const projects =
    await prisma.project.findMany({
      where: {
        ownerId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  return projects.map(toProject);
}

/**
 * =========================================================
 * GET PROJECT BY ID
 * =========================================================
 */
export async function getProjectById(
  projectId: string,
  ownerId: string
): Promise<Project | undefined> {
  const project =
    await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId,
      },
    });

  if (!project) {
    return undefined;
  }

  return toProject(project);
}

/**
 * =========================================================
 * UPDATE PROJECT
 * =========================================================
 *
 * Template is intentionally NOT updateable.
 *
 * scene contains the editor/world state
 * and is updateable.
 */
export async function updateProject(
  projectId: string,
  ownerId: string,
  updates: {
    name?: string;
    description?: string;
    scene?: unknown;
  }
): Promise<Project | undefined> {
  const existing =
    await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId,
      },
    });

  if (!existing) {
    return undefined;
  }

  const project =
    await prisma.project.update({
      where: {
        id: existing.id,
      },
      data: {
        ...(updates.name !== undefined
          ? {
              name: updates.name.trim(),
            }
          : {}),

        ...(updates.description !== undefined
          ? {
              description:
                updates.description.trim() ||
                null,
            }
          : {}),

        ...(updates.scene !== undefined
          ? {
              scene: toPrismaJson(
                updates.scene
              ),
            }
          : {}),
      },
    });

  return toProject(project);
}

/**
 * =========================================================
 * DELETE PROJECT
 * =========================================================
 */
export async function deleteProject(
  projectId: string,
  ownerId: string
): Promise<boolean> {
  const result =
    await prisma.project.deleteMany({
      where: {
        id: projectId,
        ownerId,
      },
    });

  return result.count === 1;
}