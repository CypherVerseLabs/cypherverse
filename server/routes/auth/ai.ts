import express, {
  Request,
  Response,
} from "express";

import {
  authenticateToken,
} from "../../middleware/authMiddleware.js";

import {
  generateSceneActions,
  type AIIdeaContext,
} from "../../ai/aiService.js";

import {
  generateAIChatResponse,
  type AIChatMessage,
} from "../../ai/aiChatService.js";


const router =
  express.Router();


/* =========================================
   POST /api/ai
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
        prompt,
        ideas,
        scene,
      } = req.body;


      if (
        typeof prompt !== "string" ||
        !prompt.trim()
      ) {
        return res.status(400).json({
          error:
            "A non-empty prompt is required.",
        });
      }


      if (
        !Array.isArray(ideas)
      ) {
        return res.status(400).json({
          error:
            "Ideas must be an array.",
        });
      }


      const ideaContext =
        ideas as AIIdeaContext[];


      const result =
        await generateSceneActions(
          prompt,
          ideaContext,
          scene
        );


      return res.json(
        result
      );

    } catch (error) {

      console.error(
        "AI scene generation error:",
        error
      );


      return res.status(500).json({
        error:
          "Failed to generate scene actions.",
      });
    }
  }
);


/* =========================================
   POST /api/ai/starter
========================================= */

/*
 * Existing StarterAI.tsx expects:
 *
 * {
 *   response: string
 * }
 *
 * The underlying Ollama service returns:
 *
 * {
 *   message: string
 * }
 *
 * Keep that translation at the API boundary.
 */

router.post(
  "/starter",
  authenticateToken,
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const {
        prompt,
        messages,
      } = req.body;


      if (
        typeof prompt !== "string" ||
        !prompt.trim()
      ) {
        return res.status(400).json({
          error:
            "A non-empty prompt is required.",
        });
      }


      const history:
        AIChatMessage[] =
        Array.isArray(messages)
          ? messages
              .filter(
                (
                  message
                ) =>
                  message &&
                  (
                    message.role ===
                      "user" ||
                    message.role ===
                      "assistant"
                  ) &&
                  typeof message.content ===
                    "string"
              )
              .slice(-12)
          : [];


      const result =
        await generateAIChatResponse(
          prompt,
          history
        );


      return res.json({
        response:
          result.message,

        ...(result.link
          ? {
              link:
                result.link,
            }
          : {}),
      });

    } catch (error) {

      console.error(
        "Starter AI error:",
        error
      );


      return res.status(500).json({
        error:
          "Failed to generate AI response.",
      });
    }
  }
);


export default router;