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

  // Publishing
  slug?: string;
  publishedAt?: string;

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

  slug: string | null;
  publishedAt: Date | null;

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

    ...(project.slug
      ? {
          slug: project.slug,
        }
      : {}),

    ...(project.publishedAt
      ? {
          publishedAt:
            project.publishedAt.toISOString(),
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
 * PUBLISH PROJECT
 * =========================================================
 */
export async function publishProject(
  projectId: string,
  ownerId: string
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

  /*
   * If the project already has a slug,
   * keep it when republishing.
   */
  const slug =
    existing.slug ??
    createProjectSlug(
      existing.name,
      existing.id
    );

  const project =
    await prisma.project.update({
      where: {
        id: existing.id,
      },
      data: {
        slug,
        publishedAt: new Date(),
      },
    });

  return toProject(project);
}

/**
 * =========================================================
 * UNPUBLISH PROJECT
 * =========================================================
 */
export async function unpublishProject(
  projectId: string,
  ownerId: string
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
        publishedAt: null,
      },
    });

  return toProject(project);
}

/**
 * =========================================================
 * GET PUBLIC PROJECT
 * =========================================================
 *
 * IMPORTANT:
 *
 * This does NOT require authentication.
 *
 * A project is public only when
 * publishedAt is not null.
 */
export async function getPublicProject(
  slug: string
): Promise<Project | undefined> {
  const project =
    await prisma.project.findFirst({
      where: {
        slug,
        publishedAt: {
          not: null,
        },
      },
    });

  if (!project) {
    return undefined;
  }

  return toProject(project);
}

/**
 * =========================================================
 * SLUG GENERATOR
 * =========================================================
 */
function createProjectSlug(
  name: string,
  id: string
): string {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      )
      .slice(0, 60) ||
    "project";

  /*
   * Add part of the project ID so
   * two projects with the same name
   * cannot collide.
   */
  return `${base}-${id.slice(0, 8)}`;
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