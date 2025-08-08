import { Image, useToolbelt, useEnvironment, Interactable } from "cyengine";
import { Vector3 } from "three";

declare global {
  interface Window {
    randomimageshit: string;
  }
}

const MAP_URL =
  "https://www.wikihow.com/images/thumb/d/db/Get-the-URL-for-Pictures-Step-2-Version-6.jpg/v4-460px-Get-the-URL-for-Pictures-Step-2-Version-6.jpg";

export const MAP_SCALE = 0.05;
export const MAP_OFFSET = new Vector3(5.75, 0, 5);

export default function Clue() {
  const { device } = useEnvironment();
  const toolbelt = useToolbelt(); // ✅ only call useToolbelt once

  const SCALE = device.mobile ? 0.7 : 1;

  // Optional: assign test image to window if used elsewhere
  window.randomimageshit = "https://upload.wikimedia.org/wikipedia/commons/b/be/Random_pyramids.jpg";

  const OpenClue = () => {
    const index = toolbelt.tools.findIndex(tool => tool.name === "ClueTool");
    if (index !== -1) {
      toolbelt.setActiveIndex(index);
    } else {
      console.warn("ClueTool not found in toolbelt");
    }
  };

  return (
    <Interactable onClick={OpenClue}>
      <Image src={MAP_URL} scale={SCALE * 0.9} />
    </Interactable>
  );
}
