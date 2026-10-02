import { prisma } from "../lib/prisma.js";
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
/**
 * =========================================================
 * CREATE PROJECT ASSET
 * =========================================================
 */
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
/**
 * =========================================================
 * GET ASSETS BY PROJECT
 * =========================================================
 */
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
/**
 * =========================================================
 * GET ASSET BY ID
 * =========================================================
 */
export async function getProjectAssetById(assetId, projectId) {
    const asset = await prisma.projectAsset.findFirst({
        where: {
            id: assetId,
            projectId,
        },
    });
    if (!asset) {
        return undefined;
    }
    return toProjectAsset(asset);
}
/**
 * =========================================================
 * DELETE PROJECT ASSET
 * =========================================================
 */
export async function deleteProjectAsset(assetId, projectId) {
    const existing = await prisma.projectAsset.findFirst({
        where: {
            id: assetId,
            projectId,
        },
    });
    if (!existing) {
        return undefined;
    }
    const asset = await prisma.projectAsset.delete({
        where: {
            id: existing.id,
        },
    });
    return toProjectAsset(asset);
}
