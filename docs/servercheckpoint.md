Where we are

The AI layer has now been added as a separate backend layer:

server/
├── ai/
│   ├── aiService.ts
│   └── aiTypes.ts
│
├── routes/
│   └── auth/
│       └── ai.ts
│
├── middleware/
├── routes/auth/
├── stores/
└── index.ts
Current flow
CyBuilder frontend
      ↓
POST /api/ai
      ↓
server/routes/auth/ai.ts
      ↓
authenticateToken
      ↓
server/ai/aiService.ts
      ↓
OpenAI
      ↓
structured JSON
      ↓
array of scene actions
      ↓
frontend

The important part is that the AI doesn't directly modify the scene.

It returns actions such as:

{
  "actions": [
    {
      "action": "create",
      "type": "box",
      "props": {},
      "transform": {
        "position": [0, 1, 0],
        "rotation": [0, 0, 0],
        "scale": [1, 1, 1]
      }
    }
  ]
}

The frontend will ultimately interpret those actions and modify the scene.

What we do next
1. Install OpenAI in the server

From the server directory:

yarn add openai
2. Add the API key

In:

server/.env

add:

OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini

Do not commit .env.

3. Start the server

Then run your existing development setup:

yarn dev
4. Test /api/ai

First verify authentication still works.

Then send a request to:

POST /api/ai

with:

{
  "prompt": "Create a red cube in front of me",
  "ideas": []
}

But: the ideas array must contain the actual registered CyBuilder ideas. The frontend should eventually send those definitions to the AI endpoint.

5. Verify the returned actions

We want to confirm:

AI responds
JSON is valid
actions are an array
only registered idea types are used
properties match the idea schemas
transforms are valid
multiple actions work
6. Connect the frontend

Once the backend test works, we connect the existing Ideas UI → AI → scene action execution.

That's the next major piece.

After testing

If everything works:

AI endpoint
   ↓
AI action validation
   ↓
frontend action executor
   ↓
scene changes

Then we test more complicated requests:

"Create a house with a red roof, two windows and a door."

The AI should return multiple actions, not one giant object.

After that: production

Before VPS launch:

move OpenAI key to VPS environment variables
never expose the API key to the browser
add request/rate limits
verify authentication on /api/ai
test malformed requests
test AI failures/timeouts
build the frontend
build the server
test the production VPS deployment
verify CORS
verify HTTPS
verify .env isn't committed
monitor API usage/costs

Then you're essentially at launch.

And later, if you want Ollama or another provider, we can keep the same /api/ai contract and action format and swap the AI implementation behind aiService.ts. That is exactly why we're keeping this layer separated.