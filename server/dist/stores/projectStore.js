import crypto from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { Prisma, ProjectTemplate, } from "../generated/prisma/client.js";
import { getIdeaById, } from "./ideaStore.js";
function toProject(project) {
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
        parcelId: project.parcelId,
        ...(project.slug
            ? {
                slug: project.slug,
            }
            : {}),
        ...(project.publishedAt
            ? {
                publishedAt: project.publishedAt.toISOString(),
            }
            : {}),
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
    };
}
function toProjectAsset(asset) {
    return {
        id: asset.id,
        projectId: asset.projectId,
        originalName: asset.originalName,
        storageKey: asset.storageKey,
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        createdAt: asset.createdAt.toISOString(),
        updatedAt: asset.updatedAt.toISOString(),
    };
}
function toPrismaJson(value) {
    if (value === null) {
        return Prisma.JsonNull;
    }
    return value;
}
/* =========================================================
   CREATE
========================================================= */
export async function createProject(ownerId, name, description, template = ProjectTemplate.editor) {
    const idea = await getIdeaById(template);
    if (!idea) {
        throw new Error(`Unknown project template: ${template}`);
    }
    const project = await prisma.project.create({
        data: {
            id: crypto.randomUUID(),
            ownerId,
            name: name.trim(),
            description: description?.trim() ||
                null,
            template,
            scene: toPrismaJson(idea.scene),
        },
    });
    return toProject(project);
}
/* =========================================================
   GET PROJECTS
========================================================= */
export async function getProjectsByOwnerId(ownerId) {
    const projects = await prisma.project.findMany({
        where: {
            ownerId,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return projects.map(toProject);
}
/* =========================================================
   GET PROJECT
========================================================= */
export async function getProjectById(projectId, ownerId) {
    const project = await prisma.project.findFirst({
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
/* =========================================================
   UPDATE PROJECT
========================================================= */
export async function updateProject(projectId, ownerId, updates) {
    const existing = await prisma.project.findFirst({
        where: {
            id: projectId,
            ownerId,
        },
    });
    if (!existing) {
        return undefined;
    }
    const project = await prisma.project.update({
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
                    description: updates.description.trim() ||
                        null,
                }
                : {}),
            ...(updates.scene !== undefined
                ? {
                    scene: toPrismaJson(updates.scene),
                }
                : {}),
            ...(updates.slug !== undefined
                ? {
                    slug: updates.slug,
                }
                : {}),
        },
    });
    return toProject(project);
}
/* =========================================================
   DEPLOY PROJECT TO PARCEL
========================================================= */
export class ParcelProjectConflictError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = "ParcelProjectConflictError";
        this.code = code;
    }
}
export async function deployProjectToParcel(projectId, ownerId, parcelId) {
    const MAX_RETRIES = 3;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            return await prisma.$transaction(async (tx) => {
                const project = await tx.project.findFirst({
                    where: {
                        id: projectId,
                        ownerId,
                    },
                });
                if (!project) {
                    return undefined;
                }
                if (project.parcelId === parcelId) {
                    return toProject(project);
                }
                if (project.parcelId) {
                    throw new ParcelProjectConflictError("PROJECT_ALREADY_DEPLOYED", "Project is already deployed to another parcel");
                }
                const parcel = await tx.parcel.findFirst({
                    where: {
                        id: parcelId,
                        ownerId,
                    },
                    select: {
                        id: true,
                        project: {
                            select: {
                                id: true,
                            },
                        },
                    },
                });
                if (!parcel) {
                    throw new Error("PARCEL_NOT_FOUND");
                }
                if (parcel.project) {
                    throw new ParcelProjectConflictError("PARCEL_ALREADY_HAS_PROJECT", "Parcel already has an active project");
                }
                try {
                    const updated = await tx.project.update({
                        where: {
                            id: project.id,
                        },
                        data: {
                            parcelId: parcel.id,
                        },
                    });
                    return toProject(updated);
                }
                catch (error) {
                    if (error?.code === "P2002") {
                        throw new ParcelProjectConflictError("PARCEL_ALREADY_HAS_PROJECT", "Parcel already has an active project");
                    }
                    throw error;
                }
            }, {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            });
        }
        catch (error) {
            if (error?.code === "P2034" && attempt < MAX_RETRIES - 1) {
                continue;
            }
            throw error;
        }
    }
    throw new Error("Project deployment transaction failed");
}
/* =========================================================
   CREATE ASSET
========================================================= */
export async function createProjectAsset(projectId, originalName, storageKey, mimeType, sizeBytes) {
    const asset = await prisma.projectAsset.create({
        data: {
            projectId,
            originalName,
            storageKey,
            mimeType,
            sizeBytes,
        },
    });
    return toProjectAsset(asset);
}
/* =========================================================
   GET ASSETS
========================================================= */
export async function getProjectAssets(projectId) {
    const assets = await prisma.projectAsset.findMany({
        where: {
            projectId,
        },
        orderBy: {
            createdAt: "asc",
        },
    });
    return assets.map(toProjectAsset);
}
/* =========================================================
   PUBLISH
========================================================= */
export async function publishProject(projectId, ownerId) {
    const existing = await prisma.project.findFirst({
        where: {
            id: projectId,
            ownerId,
        },
    });
    if (!existing) {
        return undefined;
    }
    const slug = existing.slug ??
        createProjectSlug(existing.name, existing.id);
    const project = await prisma.project.update({
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
/* =========================================================
   publishProjectWithAssets
========================================================= */
export async function publishProjectWithAssets(projectId, ownerId, scene, assets) {
    const existing = await prisma.project.findFirst({
        where: {
            id: projectId,
            ownerId,
        },
    });
    if (!existing) {
        return undefined;
    }
    const slug = existing.slug ??
        createProjectSlug(existing.name, existing.id);
    const project = await prisma.$transaction(async (tx) => {
        /*
         * Replace the project's asset records
         * with the assets from this publication.
         */
        await tx.projectAsset.deleteMany({
            where: {
                projectId: existing.id,
            },
        });
        if (assets.length > 0) {
            await tx.projectAsset.createMany({
                data: assets.map((asset) => ({
                    projectId: existing.id,
                    originalName: asset.originalName,
                    storageKey: asset.storageKey,
                    mimeType: asset.mimeType,
                    sizeBytes: asset.sizeBytes,
                })),
            });
        }
        return tx.project.update({
            where: {
                id: existing.id,
            },
            data: {
                scene: toPrismaJson(scene),
                slug,
                publishedAt: new Date(),
            },
        });
    });
    return toProject(project);
}
/* =========================================================
   UNPUBLISH
========================================================= */
export async function unpublishProject(projectId, ownerId) {
    const existing = await prisma.project.findFirst({
        where: {
            id: projectId,
            ownerId,
        },
    });
    if (!existing) {
        return undefined;
    }
    const project = await prisma.project.update({
        where: {
            id: existing.id,
        },
        data: {
            publishedAt: null,
        },
    });
    return toProject(project);
}
/* =========================================================
   PUBLIC PROJECT
========================================================= */
export async function getPublicProject(slug) {
    const project = await prisma.project.findFirst({
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
/* =========================================================
   SLUG
========================================================= */
function createProjectSlug(name, id) {
    const base = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) ||
        "project";
    return `${base}-${id.slice(0, 8)}`;
}
/* =========================================================
   DELETE
========================================================= */
export async function deleteProject(projectId, ownerId) {
    const result = await prisma.project.deleteMany({
        where: {
            id: projectId,
            ownerId,
        },
    });
    return result.count === 1;
}
