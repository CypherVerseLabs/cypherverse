import assert from "node:assert/strict";
import test from "node:test";

import starterHandler from "../../src/pages/api/ai/starter.js";

test("Next StarterAI endpoint accepts history and returns the message contract", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        message: {
          content: JSON.stringify({ message: "Welcome back.", link: null }),
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  let statusCode = 0;
  let responseBody: unknown;
  const request = {
    method: "POST",
    body: {
      prompt: "What can I do here?",
      history: [{ role: "user", content: "Hello" }],
    },
  };
  const response = {
    setHeader() {
      return this;
    },
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(body: unknown) {
      responseBody = body;
      return this;
    },
  };

  try {
    await starterHandler(request as never, response as never);
    assert.equal(statusCode, 200);
    assert.deepEqual(responseBody, { message: "Welcome back." });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
