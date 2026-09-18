import {
  Router,
  Response,
} from "express";

import {
  authenticateToken,
  AuthenticatedRequest,
} from "../../middleware/authMiddleware.js";

import {
  createProject,
  getProjectsByOwnerId,
  getProjectById,
  updateProject,
  deleteProject,
  publishProjectWithAssets,
} from "../../stores/projectStore.js";

import multer from "multer";

import {
  uploadToR2,
} from "../../lib/r2.js";

import crypto from "crypto";

import {
  Prisma,
} from "../../generated/prisma/client.js";

const router = Router();

/**
 * =========================================================
 * PROJECT ROUTES
 * =========================================================
 *
 * All routes require authentication.
 *
 * Project ownership is ALWAYS determined from:
 *
 *     req.user.id
 *
 * Never trust ownerId from the client.
 */

/**
 * =========================================================
 * GET /api/projects
 * =========================================================
 */
router.get(
  "/",
  authenticateToken,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      const projects =
        await getProjectsByOwnerId(
          req.user.id
        );

      return res.json({
        projects,
      });
    } catch (error) {
      console.error(
        "Get projects error:",
        error
      );

      return res.status(500).json({
        error: "Failed to load projects",
      });
    }
  }
);

/**
 * =========================================================
 * POST /api/projects
 * =========================================================
 */
router.post(
  "/",
  authenticateToken,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      const {
        name,
        description,
        template,
      } = req.body;

      if (
        template !== undefined &&
        template !== "editor" &&
        template !== "found"
      ) {
        return res.status(400).json({
          error:
            "Project template must be 'editor' or 'found'",
        });
      }

      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          error:
            "Project name is required",
        });
      }

      if (
        name.trim().length > 200
      ) {
        return res.status(400).json({
          error:
            "Project name must be 200 characters or less",
        });
      }

      if (
        description !== undefined &&
        description !== null &&
        typeof description !== "string"
      ) {
        return res.status(400).json({
          error:
            "Project description must be a string",
        });
      }

      if (
        typeof description === "string" &&
        description.trim().length > 5000
      ) {
        return res.status(400).json({
          error:
            "Project description must be 5000 characters or less",
        });
      }

      const project =
        await createProject(
          req.user.id,
          name,
          description,
          template
        );

      return res.status(201).json({
        project,
      });
    } catch (error) {
      console.error(
        "Create project error:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to create project",
      });
    }
  }
);

/**
 * =========================================================
 * MULTER
 * =========================================================
 *
 * Publishing sends:
 *
 *   scene
 *   assetManifest
 *   asset-<assetId>
 *
 * The actual asset files are uploaded as multipart
 * file fields.
 */
const publishUpload =
  multer({
    storage:
      multer.memoryStorage(),

    limits: {
      files: 100,

      fileSize:
        20 * 1024 * 1024,

      fieldSize:
        12 * 1024 * 1024,
    },
  });

/**
 * =========================================================
 * POST /api/projects/:id/publish
 * =========================================================
 *
 * Multipart fields:
 *
 *   scene
 *   assetManifest
 *
 * Multipart files:
 *
 *   asset-<assetId>
 *
 * Manifest format:
 *
 * [
 *   {
 *     assetId: "...",
 *     name: "image.png",
 *     fieldName: "asset-..."
 *   }
 * ]
 *
 * IMPORTANT:
 *
 * There is NO objectUrl here.
 *
 * objectUrl is browser-local and must never be
 * sent to the server.
 */
router.post(
  "/:id/publish",
  authenticateToken,
  publishUpload.any(),
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    console.log(
      "🔥 PUBLISH ROUTE HIT:",
      req.method,
      req.originalUrl,
      req.params.id
    );

    try {
      /* -----------------------------------------------
         AUTH
      ----------------------------------------------- */

      if (!req.user?.id) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      /* -----------------------------------------------
         PROJECT ID
      ----------------------------------------------- */

      const projectId =
        req.params.id;

      console.log(
        "🔥 PUBLISH PROJECT ID:",
        projectId
      );

      if (!projectId) {
        return res.status(400).json({
          error:
            "Project ID is required",
        });
      }

      /* -----------------------------------------------
         PROJECT OWNERSHIP
      ----------------------------------------------- */

      const project =
        await getProjectById(
          projectId,
          req.user.id
        );

      if (!project) {
        return res.status(404).json({
          error:
            "Project not found",
        });
      }

      /* -----------------------------------------------
         MULTIPART FIELDS
      ----------------------------------------------- */

      const sceneField =
        req.body?.scene;

      const manifestField =
        req.body?.assetManifest;

      if (
        typeof sceneField !==
        "string"
      ) {
        return res.status(400).json({
          error:
            "Publish request is missing scene",
        });
      }

      if (
        typeof manifestField !==
        "string"
      ) {
        return res.status(400).json({
          error:
            "Publish request is missing assetManifest",
        });
      }

      /* -----------------------------------------------
         PARSE SCENE
      ----------------------------------------------- */

      let scene: unknown;

      try {
        scene =
          JSON.parse(
            sceneField
          );
      } catch {
        return res.status(400).json({
          error:
            "Project scene must be valid JSON",
        });
      }

      if (
        !scene ||
        typeof scene !==
          "object" ||
        !Array.isArray(
          (
            scene as {
              objects?: unknown;
            }
          ).objects
        )
      ) {
        return res.status(400).json({
          error:
            "Project scene is invalid",
        });
      }

      /* -----------------------------------------------
         SCENE SIZE
      ----------------------------------------------- */

      const sceneSize =
        Buffer.byteLength(
          sceneField,
          "utf8"
        );

      if (
        sceneSize >
        10 * 1024 * 1024
      ) {
        return res.status(413).json({
          error:
            "Project scene must be 10 MB or smaller",
        });
      }

      /* -----------------------------------------------
         PARSE MANIFEST
      ----------------------------------------------- */

      type AssetManifestEntry = {
      assetId: string;
      name: string;
      fieldName: string;
      path: string;
    };


      let assetManifest:
        AssetManifestEntry[];

      try {
        assetManifest =
          JSON.parse(
            manifestField
          );
      } catch {
        return res.status(400).json({
          error:
            "Invalid asset manifest",
        });
      }

      if (
        !Array.isArray(
          assetManifest
        )
      ) {
        return res.status(400).json({
          error:
            "Asset manifest must be an array",
        });
      }

      /* -----------------------------------------------
         VALIDATE MANIFEST
      ----------------------------------------------- */

const manifestAssetIds =
  new Set<string>();

const manifestFieldNames =
  new Set<string>();

const manifestPaths =
  new Set<string>();

for (
  const manifestAsset of
    assetManifest
) {
  if (
    !manifestAsset ||
    typeof manifestAsset.assetId !== "string" ||
    !manifestAsset.assetId.trim() ||
    typeof manifestAsset.name !== "string" ||
    !manifestAsset.name.trim() ||
    typeof manifestAsset.fieldName !== "string" ||
    !manifestAsset.fieldName.trim() ||
    typeof manifestAsset.path !== "string" ||
    !manifestAsset.path.trim()
  ) {
    return res.status(400).json({
      error:
        "Invalid asset manifest entry",
    });
  }

  if (
  manifestAsset.fieldName !==
  `asset-${manifestAsset.assetId}`
) {
  return res.status(400).json({
    error:
      `Invalid asset field name for ${manifestAsset.assetId}`,
  });
}

if (
  manifestAsset.path.includes("..") ||
  manifestAsset.path.includes("\\") ||
  !manifestAsset.path.startsWith("assets/")
) {
  return res.status(400).json({
    error:
      `Invalid asset path for ${manifestAsset.assetId}`,
  });
}

if (
  manifestAssetIds.has(
    manifestAsset.assetId
  )
) {
  return res.status(400).json({
    error:
      `Duplicate asset ID: ${manifestAsset.assetId}`,
  });
}

if (
  manifestFieldNames.has(
    manifestAsset.fieldName
  )
) {
  return res.status(400).json({
    error:
      `Duplicate asset field: ${manifestAsset.fieldName}`,
  });
}

if (
  manifestPaths.has(
    manifestAsset.path
  )
) {
  return res.status(400).json({
    error:
      `Duplicate asset path: ${manifestAsset.path}`,
  });
}

manifestAssetIds.add(
  manifestAsset.assetId
);

manifestFieldNames.add(
  manifestAsset.fieldName
);

manifestPaths.add(
  manifestAsset.path
);
}



      /* -----------------------------------------------
         FILES
      ----------------------------------------------- */

           /* -----------------------------------------------
         FILES
      ----------------------------------------------- */

      const uploadedFiles =
        (req.files ?? []) as Express.Multer.File[];

      const filesByField =
        new Map<
          string,
          Express.Multer.File
        >();

      for (
        const file of
          uploadedFiles
      ) {
        /*
         * Reject duplicate field names.
         */
        if (
          filesByField.has(
            file.fieldname
          )
        ) {
          return res.status(400).json({
            error:
              `Duplicate asset file field: ${file.fieldname}`,
          });
        }

        filesByField.set(
          file.fieldname,
          file
        );
      }

      /* -----------------------------------------------
         REJECT UNEXPECTED FILES
      ----------------------------------------------- */

      const expectedFields =
        new Set(
          assetManifest.map(
            (asset) =>
              asset.fieldName
          )
        );

      for (
        const fieldName of
          filesByField.keys()
      ) {
        if (
          !expectedFields.has(
            fieldName
          )
        ) {
          return res.status(400).json({
            error:
              `Unexpected asset file field: ${fieldName}`,
          });
        }
      }

      /* -----------------------------------------------
         PREPARE SCENE
      ----------------------------------------------- */

      const sceneToPublish =
        structuredClone(
          scene
        ) as {
          objects: {
            props?: Record<
              string,
              unknown
            >;
          }[];
        };


      /* -----------------------------------------------
         ASSET RECORDS
      ----------------------------------------------- */

      const projectAssets: {
        originalName: string;
        storageKey: string;
        mimeType: string;
        sizeBytes: number;
      }[] = [];

      /* -----------------------------------------------
         PROCESS ASSETS
      ----------------------------------------------- */

      for (
        const manifestAsset of
          assetManifest
      ) {
        const fieldName =
          manifestAsset.fieldName;

        const file =
          filesByField.get(
            fieldName
          );

        if (!file) {
          return res.status(400).json({
            error:
              `Missing asset file: ${fieldName}`,
          });
        }

        /*
         * Use the manifest name for the logical
         * asset name, but use the actual uploaded
         * file for storage.
         */
        const safeOriginalName =
          sanitizeStorageName(
            manifestAsset.name
          );

        const storageKey =
          `projects/${projectId}/assets/${crypto.randomUUID()}-${safeOriginalName}`;

        const publicUrl =
          await uploadToR2(
            storageKey,
            file.buffer,
            file.mimetype ||
              "application/octet-stream"
          );

        projectAssets.push({
          originalName:
            manifestAsset.name,

          storageKey,

          mimeType:
            file.mimetype ||
            "application/octet-stream",

          sizeBytes:
            file.size,
        });

        /*
 * The manifest provides the exact portable path
 * used by the scene.
 *
 * Example:
 *
 *     manifestAsset.path
 *       -> "assets/image.png"
 *
 * Replace that client-safe portable path with
 * the permanent R2 URL.
 *
 * We do NOT look for blob:http:// URLs.
 */

        const portablePath =
  manifestAsset.path;


        for (
  const object of
    sceneToPublish.objects
) {
  if (
    !object.props
  ) {
    continue;
  }

  for (
    const key of
      Object.keys(
        object.props
      )
  ) {
    const value =
      object.props[key];

    if (
      value ===
      portablePath
    ) {
      object.props[key] =
        publicUrl;
    }
  }
}

      }

      /* -----------------------------------------------
         PUBLISH DATABASE STATE
      ----------------------------------------------- */

      const publishedProject =
        await publishProjectWithAssets(
          projectId,
          req.user.id,
          sceneToPublish,
          projectAssets
        );

      if (!publishedProject) {
        return res.status(404).json({
          error:
            "Project not found",
        });
      }

      /* -----------------------------------------------
         RESPONSE
      ----------------------------------------------- */

      return res.status(200).json({
        project:
          publishedProject,
      });
    } catch (error) {
      console.error(
        "Publish project error:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to publish project",
      });
    }
  }
);

/**
 * =========================================================
 * GET /api/projects/:id
 * =========================================================
 */
router.get(
  "/:id",
  authenticateToken,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      const projectId =
        req.params.id;

      if (!projectId) {
        return res.status(400).json({
          error:
            "Project ID is required",
        });
      }

      const project =
        await getProjectById(
          projectId,
          req.user.id
        );

      if (!project) {
        return res.status(404).json({
          error: "Project not found",
        });
      }

      return res.json({
        project,
      });
    } catch (error) {
      console.error(
        "Get project error:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to load project",
      });
    }
  }
);

/**
 * =========================================================
 * PATCH /api/projects/:id
 * =========================================================
 */
router.patch(
  "/:id",
  authenticateToken,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      const projectId =
        req.params.id;

      if (!projectId) {
        return res.status(400).json({
          error:
            "Project ID is required",
        });
      }

      const {
        name,
        description,
        scene,
        slug,
      } = req.body;

      /* -----------------------------------------------
         SLUG
      ----------------------------------------------- */

      if (
        slug !== undefined &&
        typeof slug !== "string"
      ) {
        return res.status(400).json({
          error:
            "Project URL must be a string",
        });
      }

      const normalizedSlug =
        typeof slug === "string"
          ? slug
              .trim()
              .toLowerCase()
              .replace(
                /^\/+|\/+$/g,
                ""
              )
          : undefined;

      if (
        normalizedSlug !== undefined &&
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
          normalizedSlug
        )
      ) {
        return res.status(400).json({
          error:
            "Project URL may only contain letters, numbers, and hyphens",
        });
      }

      if (
        normalizedSlug !== undefined &&
        normalizedSlug.length > 60
      ) {
        return res.status(400).json({
          error:
            "Project URL must be 60 characters or less",
        });
      }

      /* -----------------------------------------------
         NAME
      ----------------------------------------------- */

      if (
        name !== undefined &&
        typeof name !== "string"
      ) {
        return res.status(400).json({
          error:
            "Project name must be a string",
        });
      }

      if (
        name !== undefined &&
        !name.trim()
      ) {
        return res.status(400).json({
          error:
            "Project name cannot be empty",
        });
      }

      if (
        typeof name === "string" &&
        name.trim().length > 200
      ) {
        return res.status(400).json({
          error:
            "Project name must be 200 characters or less",
        });
      }

      /* -----------------------------------------------
         DESCRIPTION
      ----------------------------------------------- */

      if (
        description !== undefined &&
        description !== null &&
        typeof description !== "string"
      ) {
        return res.status(400).json({
          error:
            "Project description must be a string",
        });
      }

      if (
        typeof description === "string" &&
        description.trim().length > 5000
      ) {
        return res.status(400).json({
          error:
            "Project description must be 5000 characters or less",
        });
      }

      /* -----------------------------------------------
         SCENE
      ----------------------------------------------- */

      if (
        scene !== undefined
      ) {
        let sceneSize: number;

        try {
          sceneSize =
            Buffer.byteLength(
              JSON.stringify(scene),
              "utf8"
            );
        } catch {
          return res.status(400).json({
            error:
              "Project scene must be valid JSON",
          });
        }

        if (
          sceneSize >
          10 * 1024 * 1024
        ) {
          return res.status(413).json({
            error:
              "Project scene must be 10 MB or smaller",
          });
        }
      }

      /* -----------------------------------------------
         UPDATE
      ----------------------------------------------- */

      const project =
        await updateProject(
          projectId,
          req.user.id,
          {
            ...(name !== undefined
              ? { name }
              : {}),

            ...(description !== undefined
              ? { description }
              : {}),

            ...(scene !== undefined
              ? { scene }
              : {}),

            ...(normalizedSlug !== undefined
              ? {
                  slug:
                    normalizedSlug,
                }
              : {}),
          }
        );

      if (!project) {
        return res.status(404).json({
          error: "Project not found",
        });
      }

      return res.json({
        project,
      });
    } catch (error) {
      console.error(
        "Update project error:",
        error
      );

      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return res.status(409).json({
          error:
            "That project URL is already in use",
        });
      }

      return res.status(500).json({
        error:
          "Failed to update project",
      });
    }
  }
);

/**
 * =========================================================
 * DELETE /api/projects/:id
 * =========================================================
 */
router.delete(
  "/:id",
  authenticateToken,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.user?.id) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      const projectId =
        req.params.id;

      if (!projectId) {
        return res.status(400).json({
          error:
            "Project ID is required",
        });
      }

      const deleted =
        await deleteProject(
          projectId,
          req.user.id
        );

      if (!deleted) {
        return res.status(404).json({
          error: "Project not found",
        });
      }

      return res.status(204).send();
    } catch (error) {
      console.error(
        "Delete project error:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to delete project",
      });
    }
  }
);

/**
 * =========================================================
 * ROUTE DEBUG
 * =========================================================
 */

console.log(
  "PROJECT ROUTER STACK:",
  router.stack
    .filter(
      (layer: any) =>
        layer.route
    )
    .map(
      (layer: any) => ({
        path:
          layer.route.path,
        methods:
          layer.route.methods,
      })
    )
);

export default router;

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

/**
 * Make an uploaded filename safe for storage.
 */
function sanitizeStorageName(
  originalname: string
): string {
  return originalname
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    )
    .slice(0, 200);
}

/**
 * Match the same filename sanitization used
 * by the editor's asset path helper.
 *
 * Keep this compatible with the client-side
 * sanitizeAssetFileName().
 */
function sanitizeAssetFileName(
  name: string
): string {
  return name
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    )
    .slice(0, 200);
}
