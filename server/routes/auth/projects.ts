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
 *
 * Get all projects owned by the authenticated user.
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
 *
 * Create a project for the authenticated user.
 *
 * Request:
 *
 * {
 *   "name": "My Project",
 *   "description": "Project description"
 * }
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

      /**
       * Validate name.
       */
      if (
        typeof name !== "string" ||
        !name.trim()
      ) {
        return res.status(400).json({
          error:
            "Project name is required",
        });
      }

      /**
       * Prevent unbounded project names.
       */
      if (
        name.trim().length > 200
      ) {
        return res.status(400).json({
          error:
            "Project name must be 200 characters or less",
        });
      }

      /**
       * Validate description if supplied.
       */
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

      /**
       * Prevent unbounded descriptions.
       */
      if (
        typeof description === "string" &&
        description.trim().length > 5000
      ) {
        return res.status(400).json({
          error:
            "Project description must be 5000 characters or less",
        });
      }

      /**
       * IMPORTANT:
       *
       * ownerId comes from the verified JWT.
       */
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


// =========================================================
// POST /api/projects/:id/publish
// =========================================================
//
// Publish the current project scene and assets.
//
// Multipart fields:
//
//   scene
//   assetManifest
//   asset-<assetId>
// =========================================================

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
          (scene as {
            objects?: unknown;
          }).objects
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

      let assetManifest: {
        assetId: string;
        objectUrl: string;
      }[];

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
        filesByField.set(
          file.fieldname,
          file
        );
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
        if (
          !manifestAsset ||
          typeof manifestAsset.assetId !==
            "string" ||
          typeof manifestAsset.objectUrl !==
            "string"
        ) {
          return res.status(400).json({
            error:
              "Invalid asset manifest entry",
          });
        }

        const fieldName =
          `asset-${manifestAsset.assetId}`;

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

        const storageKey =
          `projects/${projectId}/assets/${crypto.randomUUID()}-${sanitizeStorageName(
            file.originalname
          )}`;

        const publicUrl =
          await uploadToR2(
            storageKey,
            file.buffer,
            file.mimetype
          );

        projectAssets.push({
          originalName:
            file.originalname,

          storageKey,

          mimeType:
            file.mimetype ||
            "application/octet-stream",

          sizeBytes:
            file.size,
        });

        /* -------------------------------------------
           REWRITE SCENE REFERENCES
        ------------------------------------------- */

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
            if (
              object.props[key] ===
              manifestAsset.objectUrl
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
 *
 * Get one project belonging to the authenticated user.
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
 *
 * Update a project owned by the authenticated user.
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

      const projectId = req.params.id;

      if (!projectId) {
        return res.status(400).json({
          error: "Project ID is required",
        });
      }

      const {
        name,
        description,
        scene,
      } = req.body;

      /**
       * Don't perform an empty update.
       */
      if (
        name === undefined &&
        description === undefined &&
        scene === undefined
      ) {
        return res.status(400).json({
          error:
            "No project fields were provided",
        });
      }

      /**
       * Validate name.
       */
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

      /**
       * Validate description.
       */
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

      /**
       * Validate scene.
       *
       * The scene must be JSON data.
       * Limit serialized size to 10 MB.
       */
      if (scene !== undefined) {
        let sceneSize: number;

        try {
          sceneSize = Buffer.byteLength(
            JSON.stringify(scene),
            "utf8"
          );
        } catch {
          return res.status(400).json({
            error: "Project scene must be valid JSON",
          });
        }

        if (sceneSize > 10 * 1024 * 1024) {
          return res.status(413).json({
            error:
              "Project scene must be 10 MB or smaller",
          });
        }
      }

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
 *
 * Delete a project owned by the authenticated user.
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

export default router;

function sanitizeStorageName(
  originalname: string
): string {
  return originalname
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 200);
}
