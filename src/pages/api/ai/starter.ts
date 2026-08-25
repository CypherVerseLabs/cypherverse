import type {
  NextApiRequest,
  NextApiResponse,
} from "next";

import {
  generateAIChatResponse,
  type AIChatMessage,
  type AIChatResult,
} from "../../../../server/ai/aiChatService";


/* =========================================
   REQUEST
========================================= */

type RequestBody = {
  prompt?: string;

  history?: AIChatMessage[];
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

const MAX_HISTORY_MESSAGES =
  12;

const MAX_MESSAGE_LENGTH =
  4000;


/* =========================================
   HANDLER
========================================= */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    AIChatResult |
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
      typeof body !== "object"
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
            "AI chat prompt cannot be empty.",
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
            "AI chat prompt is too long.",
        });
    }


    /* ---------------------------------------
       HISTORY
    --------------------------------------- */

    let history:
      AIChatMessage[] = [];


    if (
      body.history !==
      undefined
    ) {

      if (
        !Array.isArray(
          body.history
        )
      ) {

        return res
          .status(400)
          .json({
            error:
              "history must be an array.",
          });
      }


      if (
        body.history.length >
        MAX_HISTORY_MESSAGES
      ) {

        return res
          .status(400)
          .json({
            error:
              "Too many history messages.",
          });
      }


      for (
        const message
        of body.history
      ) {

        if (
          !message ||
          typeof message !==
            "object"
        ) {

          return res
            .status(400)
            .json({
              error:
                "Invalid history message.",
            });
        }


        if (
          message.role !==
            "user" &&
          message.role !==
            "assistant"
        ) {

          return res
            .status(400)
            .json({
              error:
                "History message role must be user or assistant.",
            });
        }


        if (
          typeof message.content !==
          "string"
        ) {

          return res
            .status(400)
            .json({
              error:
                "History message content must be a string.",
            });
        }


        if (
          message.content.length >
          MAX_MESSAGE_LENGTH
        ) {

          return res
            .status(400)
            .json({
              error:
                "History message is too long.",
            });
        }

      }


      history =
        body.history;
    }


    /* ---------------------------------------
       GENERATE AI RESPONSE
    --------------------------------------- */

    const result =
      await generateAIChatResponse(
        prompt,
        history
      );


    /* ---------------------------------------
       RESPONSE
    --------------------------------------- */

    return res
      .status(200)
      .json(result);

  } catch (error) {

    /* ---------------------------------------
       SERVER ERROR
    --------------------------------------- */

    console.error(
      "CypherVerse Starter AI error:",
      error
    );


    return res
      .status(500)
      .json({
        error:
          "AI chat generation failed.",
      });
  }
}