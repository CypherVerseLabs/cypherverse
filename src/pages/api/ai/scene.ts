import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import type {
  AIActionResponse,
  AIGenerateContext,
} from "../../../../server/ai/aiTypes.js";

import type {
  AIIdeaContext,
} from "../../../../server/ai/aiService.js";

import {
  generateSceneActions,
} from "../../../../server/ai/aiService.js";


/* =========================================
   REQUEST
========================================= */

type RequestBody = {
  prompt?: string;

  ideas?: AIIdeaContext[];

  scene?: AIGenerateContext;
};


/* =========================================
   RESPONSE
========================================= */

type ErrorResponse = {
  error: string;
};


/* =========================================
   LIMITS
========================================= */

const MAX_PROMPT_LENGTH =
  4000;

const MAX_IDEAS =
  100;

const MAX_SCENE_OBJECTS =
  500;


/* =========================================
   HANDLER
========================================= */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    AIActionResponse |
    ErrorResponse
  >
) {

  /* -----------------------------------------
     METHOD
  ----------------------------------------- */

  if (
    req.method !==
    "POST"
  ) {

    res.setHeader(
      "Allow",
      "POST"
    );

    return res
      .status(405)
      .json({
        error:
          "Method not allowed.",
      });
  }


  try {

    /* ---------------------------------------
       BODY
    --------------------------------------- */

    const body =
      req.body as RequestBody;


    if (
      !body ||
      typeof body !==
        "object"
    ) {

      return res
        .status(400)
        .json({
          error:
            "Invalid request body.",
        });
    }


    /* ---------------------------------------
       PROMPT
    --------------------------------------- */

    if (
      typeof body.prompt !==
      "string"
    ) {

      return res
        .status(400)
        .json({
          error:
            "prompt must be a string.",
        });
    }


    const prompt =
      body.prompt.trim();


    if (!prompt) {

      return res
        .status(400)
        .json({
          error:
            "AI prompt cannot be empty.",
        });
    }


    if (
      prompt.length >
      MAX_PROMPT_LENGTH
    ) {

      return res
        .status(400)
        .json({
          error:
            "AI prompt is too long.",
        });
    }


    /* ---------------------------------------
       IDEAS
    --------------------------------------- */

    if (
      !Array.isArray(
        body.ideas
      )
    ) {

      return res
        .status(400)
        .json({
          error:
            "ideas must be an array.",
        });
    }


    if (
      body.ideas.length ===
      0
    ) {

      return res
        .status(400)
        .json({
          error:
            "No CyBuilder ideas were supplied.",
        });
    }


    if (
      body.ideas.length >
      MAX_IDEAS
    ) {

      return res
        .status(400)
        .json({
          error:
            "Too many CyBuilder ideas.",
        });
    }


    /* ---------------------------------------
       SCENE
    --------------------------------------- */

    const scene =
      body.scene;


    if (
      scene !== undefined &&
      (
        typeof scene !==
          "object" ||
        scene === null ||
        !Array.isArray(
          scene.objects
        )
      )
    ) {

      return res
        .status(400)
        .json({
          error:
            "scene must contain an objects array.",
        });
    }


    if (
      scene?.objects &&
      scene.objects.length >
      MAX_SCENE_OBJECTS
    ) {

      return res
        .status(400)
        .json({
          error:
            "Scene contains too many objects.",
        });
    }


    /* ---------------------------------------
       GENERATE
    --------------------------------------- */

    const result =
      await generateSceneActions(
        prompt,
        body.ideas,
        scene
      );


    /* ---------------------------------------
       RESPONSE
    --------------------------------------- */

    return res
      .status(200)
      .json(result);

  } catch (error) {

    console.error(
      "CyBuilder AI error:",
      error
    );


    /* ---------------------------------------
       SAFE ERROR
    --------------------------------------- */

    return res
      .status(500)
      .json({
        error:
          "AI scene generation failed.",
      });
  }
}