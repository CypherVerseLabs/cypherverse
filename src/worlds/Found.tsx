import {
  useEffect,
  useState,
} from "react";

import EditorReality from "../editor/EditorReality";

import {
  foundTemplate,
} from "../editor/templates/found";


/*
 * =========================================================
 * FOUND WORLD
 * =========================================================
 *
 * This is the actual Found editor experience.
 *
 * /pages/found.tsx only routes to this component.
 *
 * The Found starter scene comes from:
 *
 *   src/editor/templates/found.tsx
 *
 * TemplateSelector creates the project before the user
 * arrives here.
 *
 * The project ID is preserved in sessionStorage.
 * =========================================================
 */

export default function Found() {

  /*
   * =======================================================
   * PROJECT ID
   * =======================================================
   */

  const [
    projectId,
    setProjectId,
  ] = useState<string | null>(null);


  /*
   * =======================================================
   * LOAD PROJECT ID
   * =======================================================
   *
   * sessionStorage only exists in the browser.
   *
   * Reading it inside useEffect prevents SSR/browser
   * differences.
   */

  useEffect(() => {

    const id =
      sessionStorage.getItem(
        "cypherverse-project-id"
      );

    setProjectId(id);

    if (
      process.env.NODE_ENV ===
      "development"
    ) {
      console.log(
        "FOUND PROJECT ID:",
        id
      );
    }

  }, []);


  /*
   * =======================================================
   * WAIT FOR BROWSER
   * =======================================================
   */

  if (projectId === null) {
    return null;
  }


  /*
   * =======================================================
   * EDITOR
   * =======================================================
   *
   * foundTemplate provides the starter scene.
   *
   * projectId identifies the user's project.
   */

  return (
    <EditorReality
      template={
        foundTemplate
      }

      projectId={
        projectId
      }
    />
  );
}
