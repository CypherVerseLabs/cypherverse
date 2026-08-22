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
} from "../../stores/projectStore.js";

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