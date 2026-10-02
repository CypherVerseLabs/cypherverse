import {
  Router,
  Request,
  Response,
} from "express";

import {
  authenticateToken,
} from "../../middleware/authMiddleware.js";

import {
  runAgentWorkflow,
  runSingleAgent,
} from "../../ai/agentService.js";

import type {
  AgentContext,
  AgentRole,
} from "../../ai/agentTypes.js";


const router =
  Router();


/* =========================================
   POST /api/ai/agents
========================================= */

router.post(
  "/",
  authenticateToken,
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const {
        task,
        role,
        context,
      } =
        req.body ?? {};


      /* -------------------------------------
         TASK
      ------------------------------------- */

      if (
        typeof task !== "string" ||
        !task.trim()
      ) {
        return res.status(400).json({
          error:
            "A non-empty task is required.",
        });
      }


      if (
        task.trim().length >
        4000
      ) {
        return res.status(400).json({
          error:
            "Task must be 4000 characters or less.",
        });
      }


      /* -------------------------------------
         CONTEXT
      ------------------------------------- */

      let safeContext:
        | AgentContext
        | undefined;


      if (
        context !== undefined
      ) {

        if (
          !context ||
          typeof context !==
            "object" ||
          Array.isArray(
            context
          )
        ) {
          return res.status(400).json({
            error:
              "Agent context must be an object.",
          });
        }


        safeContext =
          context as AgentContext;
      }


      /* -------------------------------------
         SINGLE AGENT
      ------------------------------------- */

      if (
        typeof role === "string"
      ) {

        const result =
          await runSingleAgent(
            role as AgentRole,
            task.trim(),
            safeContext
          );


        return res.json({
          mode:
            "single",

          result,
        });
      }


      /* -------------------------------------
         FULL WORKFLOW
      ------------------------------------- */

      const result =
        await runAgentWorkflow(
          task.trim(),
          safeContext
        );


      return res.json({
        mode:
          "workflow",

        result,
      });

    } catch (error) {

      console.error(
        "CypherVerse agent error:",
        error
      );


      return res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to run CypherVerse agent.",
      });
    }
  }
);


export default router;