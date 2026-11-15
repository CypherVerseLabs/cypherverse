import {
  Router,
  Request,
  Response,
} from "express";

import {
  getIdeas,
  getIdeaById,
} from "../stores/ideaStore.js";

function singleRouteParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

const router = Router();

/*
 * =========================================================
 * GET /api/ideas
 * =========================================================
 *
 * Return all available ideas.
 */

router.get(
  "/",
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const ideas =
        await getIdeas();

      return res.json({
        ideas,
      });
    } catch (error) {
      console.error(
        "Get ideas error:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to load ideas",
      });
    }
  }
);

/*
 * =========================================================
 * GET /api/ideas/:id
 * =========================================================
 *
 * Return one idea.
 */

router.get(
  "/:id",
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const idea =
        await getIdeaById(
          singleRouteParam(req.params.id)
        );

      if (!idea) {
        return res.status(404).json({
          error: "Idea not found",
        });
      }

      return res.json({
        idea,
      });
    } catch (error) {
      console.error(
        "Get idea error:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to load idea",
      });
    }
  }
);

export default router;
