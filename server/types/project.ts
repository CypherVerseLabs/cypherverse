export const PROJECT_TEMPLATES = [
  "editor",
  "found",
] as const;

export type ProjectTemplate =
  typeof PROJECT_TEMPLATES[number];