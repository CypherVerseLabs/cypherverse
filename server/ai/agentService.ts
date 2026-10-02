import {
  generateOllamaJSON,
} from "./ollamaClient.js";

import type {
  AgentContext,
  AgentReport,
  AgentRole,
  AgentWorkflowResult,
} from "./agentTypes.js";


/* =========================================
   AVAILABLE AGENTS
========================================= */

const AGENT_ROLES: AgentRole[] = [
  "architect",
  "frontend",
  "backend",
  "scene",
  "marketplace",
  "testing",
  "documentation",
];


/* =========================================
   CONTEXT LIMIT
========================================= */

const MAX_CONTEXT_LENGTH =
  16000;


/* =========================================
   SANITIZE CONTEXT
========================================= */

function serializeContext(
  context?: AgentContext
): string {

  if (!context) {
    return "No additional project context was supplied.";
  }

  let serialized = "";

  try {
    serialized =
      JSON.stringify(
        context,
        null,
        2
      );
  } catch {
    serialized =
      "Project context could not be serialized.";
  }

  if (
    serialized.length >
    MAX_CONTEXT_LENGTH
  ) {
    return (
      serialized.slice(
        0,
        MAX_CONTEXT_LENGTH
      ) +
      "\n...[context truncated]"
    );
  }

  return serialized;
}


/* =========================================
   MANAGER SCHEMA
========================================= */

const managerSchema = {
  type: "object",

  additionalProperties:
    false,

  properties: {
    roles: {
      type: "array",

      minItems: 1,

      maxItems: 4,

      items: {
        type: "string",

        enum:
          AGENT_ROLES,
      },
    },

    plan: {
      type: "string",
    },
  },

  required: [
    "roles",
    "plan",
  ],
};


/* =========================================
   REPORT SCHEMA
========================================= */

const reportSchema = {
  type: "object",

  additionalProperties:
    false,

  properties: {
    summary: {
      type: "string",
    },

    findings: {
      type: "array",

      items: {
        type: "string",
      },
    },

    recommendations: {
      type: "array",

      items: {
        type: "string",
      },
    },

    files: {
      type: "array",

      items: {
        type: "string",
      },
    },

    risks: {
      type: "array",

      items: {
        type: "string",
      },
    },
  },

  required: [
    "summary",
    "findings",
    "recommendations",
    "files",
    "risks",
  ],
};


/* =========================================
   REVIEWER SCHEMA
========================================= */

const reviewerSchema = {
  type: "object",

  additionalProperties:
    false,

  properties: {
    summary: {
      type: "string",
    },

    verified: {
      type: "array",

      items: {
        type: "string",
      },
    },

    concerns: {
      type: "array",

      items: {
        type: "string",
      },
    },

    nextSteps: {
      type: "array",

      items: {
        type: "string",
      },
    },
  },

  required: [
    "summary",
    "verified",
    "concerns",
    "nextSteps",
  ],
};


/* =========================================
   ROLE PROMPTS
========================================= */

const ROLE_PROMPTS:
  Record<AgentRole, string> = {

  architect: `
You are the CypherVerse Architecture Agent.

Inspect the task from an architecture perspective.

Rules:

- CypherVerse is the product.
- CyEngine is the supporting runtime/3D engine.
- Do not move CypherVerse application logic into CyEngine.
- Reuse existing systems.
- Do not invent duplicate stores, models, routes, providers, or scene systems.
- Prefer the smallest correct change.
- Identify what is verified versus what must still be inspected.
`,

  frontend: `
You are the CypherVerse Frontend Agent.

Focus on the existing React/Next.js frontend.

Rules:

- Reuse existing components and hooks.
- Reuse existing EditorContext for Builder scene changes.
- Preserve current UI conventions.
- Do not create a second scene/editor state system.
- Do not replace existing CyEngine runtime behavior.
- Identify exact files that should change.
`,

  backend: `
You are the CypherVerse Backend Agent.

Focus on Express, authentication, Prisma, routes, services, and database behavior.

Rules:

- Authentication must use the existing authenticated user.
- Existing Prisma models must be reused.
- Do not create duplicate marketplace/project/scene models.
- Server remains authoritative for ownership, prices, payments, and permissions.
- Identify transaction and concurrency risks.
`,

  scene: `
You are the CypherVerse Scene Agent.

Focus on CyBuilder scenes.

Rules:

- Scene data belongs to CypherVerse.
- EditorContext is the mutation boundary.
- SceneObject is the persisted representation.
- SceneObjectContent connects scene objects to runtime implementations.
- CyEngine is used after CypherVerse scene data reaches the runtime.
- Never invent scene object types.
- Never directly mutate CyEngine runtime objects when an EditorContext mutation exists.
`,

  marketplace: `
You are the CypherVerse Marketplace Agent.

This is a dedicated specialist.

Current verified marketplace architecture includes:

- Parcel
- ParcelListing
- MarketplaceOrder
- MarketplacePayment
- MarketplacePaymentEvent
- MarketplaceEntitlement
- MarketplaceIdempotencyKey

The current marketplace primarily handles parcel buying, selling, reservations, orders, payments, and parcel ownership.

Current frontend marketplace services include:

- buyParcel
- createPayment
- confirmTestPayment
- failTestPayment
- cancelTestPayment
- reserveParcel
- listParcel
- releaseParcel

Important rules:

- Never invent an existing 3D asset marketplace.
- ProjectAsset is currently project publishing/storage infrastructure, not a complete asset marketplace.
- Do not create a second marketplace architecture.
- Do not bypass server-authoritative marketplace services.
- Never treat client price as authoritative.
- Never let an AI agent silently purchase a parcel.
- Test payment endpoints are not production payment infrastructure.
- Future 3D asset marketplace work must reuse the existing ProjectAsset/storage/ownership architecture after inspection.

Focus on marketplace lifecycle, ownership, listing, payment, entitlement, idempotency, and future asset-marketplace integration.
`,

  testing: `
You are the CypherVerse Testing Agent.

Focus on verification.

Identify:

- unit tests
- integration tests
- API tests
- Builder/scene tests
- marketplace concurrency tests
- authentication tests
- failure paths
- regression risks

Do not claim that tests passed unless the task context explicitly says they passed.
`,

  documentation: `
You are the CypherVerse Documentation Agent.

Focus on documenting existing behavior accurately.

Rules:

- Do not document proposed behavior as existing behavior.
- Clearly distinguish VERIFIED, PROPOSED, and UNKNOWN.
- Document APIs and workflows only when supported by the supplied context.
- Preserve CypherVerse terminology.
`,
};


/* =========================================
   FALLBACK ROLE SELECTION
========================================= */

function fallbackRoles(
  task: string
): AgentRole[] {

  const value =
    task.toLowerCase();

  const roles =
    new Set<AgentRole>();


  roles.add(
    "architect"
  );


  if (
    value.includes("market") ||
    value.includes("parcel") ||
    value.includes("listing") ||
    value.includes("payment") ||
    value.includes("purchase") ||
    value.includes("asset")
  ) {
    roles.add(
      "marketplace"
    );
  }


  if (
    value.includes("scene") ||
    value.includes("builder") ||
    value.includes("object") ||
    value.includes("transform") ||
    value.includes("3d")
  ) {
    roles.add(
      "scene"
    );
  }


  if (
    value.includes("ui") ||
    value.includes("frontend") ||
    value.includes("react") ||
    value.includes("component")
  ) {
    roles.add(
      "frontend"
    );
  }


  if (
    value.includes("api") ||
    value.includes("server") ||
    value.includes("backend") ||
    value.includes("prisma") ||
    value.includes("database")
  ) {
    roles.add(
      "backend"
    );
  }


  if (
    value.includes("test") ||
    value.includes("bug") ||
    value.includes("audit")
  ) {
    roles.add(
      "testing"
    );
  }


  return Array.from(
    roles
  ).slice(
    0,
    4
  );
}


/* =========================================
   MANAGER
========================================= */

async function runManager(
  task: string,
  context?: AgentContext
) {

  const result =
    await generateOllamaJSON<{
      roles: AgentRole[];

      plan: string;
    }>(
      [
        {
          role: "system",

          content: `
You are the CypherVerse Project Manager Agent.

You coordinate work inside CypherVerse.

CyEngine is only the runtime/engine layer.

Choose the smallest number of specialist agents needed.

Available specialists:

${AGENT_ROLES.join(", ")}

Rules:

- Select no more than four specialists.
- Do not select specialists unrelated to the task.
- Marketplace has its own specialist and must be selected for marketplace work.
- Scene work should use the Scene specialist.
- Code architecture should normally include Architect.
- Testing should be selected when the task changes behavior.
- Do not invent repository facts.
`,
        },

        {
          role: "user",

          content: `
TASK:

${task}

CURRENT CONTEXT:

${serializeContext(
  context
)}
`,
        },
      ],

      managerSchema
    );


  const validRoles =
    result.roles.filter(
      (role) =>
        AGENT_ROLES.includes(
          role
        )
    );


  if (!validRoles.length) {

    return {
      roles:
        fallbackRoles(
          task
        ),

      plan:
        "Fallback specialist selection was used because the manager returned no valid roles.",
    };
  }


  return {
    roles:
      validRoles.slice(
        0,
        4
      ),

    plan:
      result.plan,
  };
}


/* =========================================
   SPECIALIST
========================================= */

async function runSpecialist(
  role: AgentRole,
  task: string,
  context: AgentContext | undefined,
  previousReports: AgentReport[]
): Promise<AgentReport> {

  const previous =
    previousReports.length
      ? JSON.stringify(
          previousReports,
          null,
          2
        )
      : "No previous specialist reports.";


  const result =
    await generateOllamaJSON<{
      summary: string;

      findings: string[];

      recommendations: string[];

      files: string[];

      risks: string[];
    }>(
      [
        {
          role: "system",

          content:
            ROLE_PROMPTS[
              role
            ],
        },

        {
          role: "user",

          content: `
TASK:

${task}

PROJECT CONTEXT:

${serializeContext(
  context
)}

PREVIOUS SPECIALIST REPORTS:

${previous}

Return an audit/report only.

Do not claim that you inspected a file unless its contents
were supplied in the context.

Do not claim that a change was implemented.

Separate known facts from recommendations.
`,
        },
      ],

      reportSchema
    );


  return {
    role,

    summary:
      result.summary,

    findings:
      result.findings,

    recommendations:
      result.recommendations,

    files:
      result.files,

    risks:
      result.risks,
  };
}


/* =========================================
   REVIEWER
========================================= */

async function runReviewer(
  task: string,
  context: AgentContext | undefined,
  reports: AgentReport[]
) {

  return generateOllamaJSON<{
    summary: string;

    verified: string[];

    concerns: string[];

    nextSteps: string[];
  }>(
    [
      {
        role: "system",

        content: `
You are the CypherVerse Reviewer Agent.

You are the final reviewer.

Review the task and specialist reports.

Reject:

- invented repository facts
- duplicate architecture
- unnecessary new models
- unnecessary new routes
- unnecessary new scene state
- moving CypherVerse logic into CyEngine
- marketplace logic that bypasses server authority
- claims that something was tested when it was not
- claims that something was implemented when it was only proposed

The reviewer must preserve human approval.

The agent system is advisory until explicitly approved by the user.
`,
      },

      {
        role: "user",

        content: `
TASK:

${task}

PROJECT CONTEXT:

${serializeContext(
  context
)}

SPECIALIST REPORTS:

${JSON.stringify(
  reports,
  null,
  2
)}
`,
      },
    ],

    reviewerSchema
  );
}


/* =========================================
   WORKFLOW
========================================= */

export async function runAgentWorkflow(
  task: string,
  context?: AgentContext
): Promise<AgentWorkflowResult> {

  const cleanTask =
    task.trim();

  if (!cleanTask) {
    throw new Error(
      "Agent task cannot be empty."
    );
  }


  const manager =
    await runManager(
      cleanTask,
      context
    );


  const specialists:
    AgentReport[] = [];


  /*
   * IMPORTANT:
   *
   * Agents intentionally run sequentially.
   *
   * This is designed for low-resource local Ollama
   * environments.
   */

  for (
    const role of
      manager.roles
  ) {

    const report =
      await runSpecialist(
        role,
        cleanTask,
        context,
        specialists
      );

    specialists.push(
      report
    );
  }


  const reviewer =
    await runReviewer(
      cleanTask,
      context,
      specialists
    );


  return {
    manager,

    specialists,

    reviewer,
  };
}


/* =========================================
   SINGLE SPECIALIST
========================================= */

export async function runSingleAgent(
  role: AgentRole,
  task: string,
  context?: AgentContext
): Promise<AgentReport> {

  if (
    !AGENT_ROLES.includes(
      role
    )
  ) {
    throw new Error(
      `Unknown agent role: ${role}`
    );
  }


  return runSpecialist(
    role,
    task,
    context,
    []
  );
}