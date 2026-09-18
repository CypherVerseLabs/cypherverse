
import type {
  IdeaMetadata,
} from "./types";


/* =========================================
   OPTIONAL MANIFEST IMPORTS
========================================= */

/*
 * These imports are intentionally explicit.
 *
 * Next.js does not support import.meta.glob().
 *
 * Add an entry here when an Idea has an
 * extended idea.json manifest.
 *
 * World/template manifests such as:
 *
 *   src/ideas/editor/idea.json
 *   src/ideas/found/idea.json
 *
 * are intentionally NOT included.
 *
 * They are worlds/templates, not Ideas.
 */


/* =========================================
   LEGACY / EXTENDED IDEA MANIFESTS
========================================= */

import cyrusManifest from "../../ideas/characters/Cyrus/idea.json";

import proximityPictureManifest from "../../ideas/decorations/ProximityPicture/idea.json";

import buttonManifest from "../../ideas/inputs/Button/idea.json";

import linkManifest from "../../ideas/inputs/Link/idea.json";

import speakerManifest from "../../ideas/players/Speaker/idea.json";

import videoPlayerManifest from "../../ideas/players/VideoPlayer/idea.json";


/* =========================================
   RAW MANIFEST TYPE
========================================= */

type RawManifest = {

  id: string;

  type?: string;

  name?: string;

  description?: string;

  category?: string;

  kind?: "scene-object" | "component";

  tags?: string[];

  skills?: string[];

  schema?: Array<{
    name: string;
    type: string;
    required?: boolean;
    description?: string;
  }>;

  predecessor?: string;

  purpose?: string;

  npm_dependencies?: Record<
    string,
    string
  >;

  data_url?: string | null;

  ai?: {

    description?: string;

    tags?: string[];

    skills?: string[];

    examples?: string[];

    synonyms?: string[];

    instructions?: string;
  };
};


/* =========================================
   NORMALIZE
========================================= */

function normalizeManifest(
  manifest: RawManifest
): IdeaMetadata {

  return {
    id:
      manifest.type ??
      manifest.id,

    type:
      manifest.type,

    name:
      manifest.name ??
      manifest.id,

    description:
      manifest.description,

    category:
      manifest.category ??
      "Uncategorized",

    kind:
      manifest.kind,

    tags:
      manifest.tags,

    skills:
      manifest.skills,

    schema:
      manifest.schema,

    predecessor:
      manifest.predecessor,

    purpose:
      manifest.purpose,

    npm_dependencies:
      manifest.npm_dependencies,

    data_url:
      manifest.data_url,

    ai:
      manifest.ai,
  };
}


/* =========================================
   MANIFESTS
========================================= */

const manifests:
  RawManifest[] = [

    cyrusManifest as RawManifest,

    proximityPictureManifest as RawManifest,

    buttonManifest as RawManifest,

    linkManifest as RawManifest,

    speakerManifest as RawManifest,

    videoPlayerManifest as RawManifest,
  ];


/* =========================================
   MAP
========================================= */

const metadataById =
  new Map<
    string,
    IdeaMetadata
  >();


for (
  const manifest
  of manifests
) {

  const metadata =
    normalizeManifest(
      manifest
    );

  metadataById.set(
    metadata.id,
    metadata
  );

  if (
    metadata.type
  ) {

    metadataById.set(
      metadata.type,
      metadata
    );
  }
}


/* =========================================
   PUBLIC API
========================================= */

export function getIdeaMetadata(
  id: string
):
  IdeaMetadata | undefined {

  return metadataById.get(
    id
  );
}


export function getAllIdeaMetadata():
  IdeaMetadata[] {

  return Array.from(
    metadataById.values()
  );
}

