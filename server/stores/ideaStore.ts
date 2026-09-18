import fs from "node:fs/promises";
import path from "node:path";

export interface Idea {
  id: string;
  name: string;
  description: string;
  route: string;
  previewImage: string;
  scene: unknown;
}

/*
 * =========================================================
 * IDEA CATALOG
 * =========================================================
 *
 * These are the ideas currently available.
 *
 * Later you can add:
 *
 *   "portfolio"
 *   "business"
 *   "game"
 *   "blog"
 *   etc.
 *
 */

const IDEA_IDS = [
  "editor",
  "found",
] as const;

/*
 * =========================================================
 * IDEA DIRECTORY
 * =========================================================
 */

const IDEAS_DIRECTORY =
  path.resolve(
    process.cwd(),
    "ideas"
  );

/*
 * =========================================================
 * LOAD IDEA
 * =========================================================
 */

async function loadIdea(
  id: string
): Promise<Idea | undefined> {
  /*
   * Only allow IDs that are part of the
   * server-side catalog.
   */

  if (
    !IDEA_IDS.includes(
      id as (typeof IDEA_IDS)[number]
    )
  ) {
    return undefined;
  }

  const filePath =
    path.join(
      IDEAS_DIRECTORY,
      id,
      "idea.json"
    );

  try {
    const contents =
      await fs.readFile(
        filePath,
        "utf8"
      );

    const idea =
      JSON.parse(contents);

    /*
     * Basic validation.
     */

    if (
      !idea ||
      typeof idea !== "object"
    ) {
      throw new Error(
        "Idea file must contain an object"
      );
    }

    if (
  typeof idea.id !== "string" ||
  typeof idea.name !== "string" ||
  typeof idea.description !== "string" ||
  typeof idea.route !== "string" ||
  typeof idea.previewImage !== "string" ||
  !idea.scene ||
  typeof idea.scene !== "object"
) {
  throw new Error(
    "Idea file is missing required fields"
  );
}


    return {
  id: idea.id,
  name: idea.name,
  description: idea.description,
  route: idea.route,
  previewImage: idea.previewImage,
  scene: idea.scene,
};

  } catch (error) {
    console.error(
      `Failed to load idea "${id}":`,
      error
    );

    return undefined;
  }
}

/*
 * =========================================================
 * GET ALL IDEAS
 * =========================================================
 */

export async function getIdeas(): Promise<
  Idea[]
> {
  const ideas: Idea[] = [];

  for (
    const id of IDEA_IDS
  ) {
    const idea =
      await loadIdea(id);

    if (idea) {
      ideas.push(idea);
    }
  }

  return ideas;
}

/*
 * =========================================================
 * GET ONE IDEA
 * =========================================================
 */

export async function getIdeaById(
  id: string
): Promise<Idea | undefined> {
  return loadIdea(id);
}
