CyBuilder AI — Current Checkpoint
What is already done

Your existing CyBuilder editor/scene system is considered stable. We are not changing those files unless an actual error requires it.

The AI backend layer has been added around the existing system.

Backend structure
server/
├── index.ts
├── routes/
│   └── auth/
│       └── ai.ts
└── ai/
    ├── aiService.ts
    └── aiTypes.ts
server/index.ts

Already connected:

import aiRouter from "./routes/auth/ai.js";

and:

app.use(
  "/api/ai",
  aiRouter
);

So the endpoint is:

POST /api/ai

index.ts is done. Leave it alone.

server/routes/auth/ai.ts

Already created.

It:

Authenticates the user.
Receives:
{
  prompt,
  ideas
}
Validates the prompt.
Validates the Ideas array.
Calls:
generateSceneActions(prompt, ideaContext)
Returns the generated result.

So this file is also done for now.

server/ai/aiService.ts

Already created.

This is the current AI engine.

It:

Uses the OpenAI Responses API.
Receives the user's prompt.
Receives CyBuilder's available Ideas.
Gives those Ideas to the model as context.
Prevents the model from inventing object types.
Requests structured JSON.
Supports multiple actions.
Supports:
create
update
delete

The intended output is essentially:

{
  actions: [
    {
      action: "create",
      type: "...",
      props: {},
      transform: {}
    }
  ]
}

This is the foundation we want.

One thing we have NOT done yet

The server package currently doesn't have the OpenAI SDK installed.

Your aiService.ts contains:

import OpenAI from "openai";

but server/package.json didn't contain:

openai

So the next step when you return is:

cd server
yarn add openai

Then start the server and test it.

What happens after that
Phase 1 — Test backend

Test:

POST /api/ai

with something simple like:

Create a box.

We want to confirm the server returns valid actions.

Phase 2 — Test more complex AI

For example:

Create three boxes in a row with the second one higher than the others.

Confirm the AI produces multiple valid actions.

Phase 3 — Connect frontend

Currently the AI can generate actions, but the frontend still needs to actually execute those actions through your existing scene system.

Conceptually:

User
 ↓
AI prompt
 ↓
/api/ai
 ↓
AI actions
 ↓
existing scene functions
 ↓
3D scene

We will use your existing:

addObject
updateObject
removeObject
updateTransform
select

rather than redesigning the editor.

After that: production

Once the end-to-end system works:

Prompt
 ↓
AI
 ↓
actions
 ↓
scene

we do the production hardening:

action validation
rate limiting
request limits
error handling
API-key security
provider abstraction
VPS environment configuration
production build
final testing

Then you're at the launch stage.

Important decision we already made

We're starting with OpenAI for testing, but we're not designing CyBuilder to be permanently locked to OpenAI.

Later we can support:

OpenAI
Ollama
Anthropic
other providers

behind the same AI service/provider layer.

🚩 EXACT PLACE TO RESUME

When you come back, start here:

1. cd server
2. yarn add openai
3. start server
4. test POST /api/ai
5. inspect returned actions

Do not modify index.ts, the editor, Ideas, or scene architecture before that test.

That's our current checkpoint.