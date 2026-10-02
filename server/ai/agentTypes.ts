/* =========================================
   CYPHERVERSE AGENTS
========================================= */

export type AgentRole =
  | "architect"
  | "frontend"
  | "backend"
  | "scene"
  | "marketplace"
  | "testing"
  | "documentation";


export type AgentContext = {
  surface?: string;

  projectId?: string;

  selectedId?: string;

  scene?: unknown;

  files?: unknown;

  marketplace?: unknown;

  additional?: unknown;
};


export type AgentReport = {
  role: AgentRole;

  summary: string;

  findings: string[];

  recommendations: string[];

  files: string[];

  risks: string[];
};


export type AgentWorkflowResult = {
  manager: {
    roles: AgentRole[];

    plan: string;
  };

  specialists: AgentReport[];

  reviewer: {
    summary: string;

    verified: string[];

    concerns: string[];

    nextSteps: string[];
  };
};