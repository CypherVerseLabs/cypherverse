// MyTool.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Tool, useToolbelt, useEnvironment, useHudDims } from "cyengine";
import { animated, useSpring, config } from "@react-spring/three";
import { useKeypress, isTyping } from "cyengine"; // adjust path if needed

export function MyTool() {
  const { device, paused } = useEnvironment();
  const toolbelt = useToolbelt();

  const [open, setOpen] = useState(false);
  const ENABLED = toolbelt.activeTool?.name === "MyTool";

  const dims = useHudDims?.(); // optional: only if you have this helper like in Camera
  const SCALE = dims ? Math.min(dims.width * 0.25, device.mobile ? 0.2 : 0.325) : 1;

  // Smooth transitions like in Camera
  const { scale, rotX, rotY } = useSpring({
    rotX: open ? 0 : 0.3,
    rotY: open ? 0 : device.mobile ? Math.PI - 0.5 : -0.1,
    scale: open ? SCALE : device.mobile ? 0.1 : 0.25,
    config: config.stiff,
  });

  // Keyboard shortcut to toggle
  const index = toolbelt.tools.findIndex((t) => t.name === "MyTool");
  useKeypress(
    ["m", "M"],
    () => {
      if (isTyping() || paused) return;
      if (ENABLED) {
        toolbelt.setActiveIndex(undefined); // close
      } else {
        if (index !== -1) toolbelt.setActiveIndex(index); // open
      }
    },
    [ENABLED, index, paused]
  );

  // Example: trigger event when open and active
  const onClick = useCallback(() => {
    console.log("Clicked inside MyTool");
  }, []);

  useEffect(() => {
    if (!ENABLED || paused || !open) return;
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [ENABLED, open, paused, onClick]);

  const POS: [number, number] = open
    ? [0, 0]
    : device.mobile
    ? [0.9, 0.9]
    : [0.8, -0.8];

  return (
    <Tool
      name="MyTool"
      pos={POS}
      pinY
      face
      range={0}
      disableDraggable={open}
      onSwitch={(enabled) => setOpen(enabled)}
    >
      <animated.group scale={scale} rotation-x={rotX} rotation-y={rotY}>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={open ? "orange" : "blue"} />
        </mesh>
      </animated.group>
    </Tool>
  );
}
