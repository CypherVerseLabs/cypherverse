import {
  Router,
  Request,
  Response,
} from "express";

import {
  getPublicProject,
} from "../../stores/projectStore.js";

const router =
  Router();

/* =========================================================
   GET PUBLIC PROJECT
========================================================= */

router.get(
  "/:slug",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const slug =
        req.params.slug;

      if (!slug) {
        return res.status(400).json({
          error:
            "Project slug is required",
        });
      }

      const project =
        await getPublicProject(
          slug
        );

      if (!project) {
        return res.status(404).json({
          error:
            "Published project not found",
        });
      }

      return res.json({
        project,
      });
    } catch (error) {
      console.error(
        "Get public project error:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to load public project",
      });
    }
  }
);

export default router;