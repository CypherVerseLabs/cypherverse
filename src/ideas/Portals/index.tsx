// components/portal.tsx
import React from "react";
import { Model, TextInput } from "cyengine"; // Cyengine components only
import { Spinning } from "cyengine";

const GOLDENRATIO = 1.618;

// Optional custom Frame component
export default function PortalScene() {
  return (
    <group position={[0, 0, 0]}>
      {/* Optional text frame */}
      <TextInput
        value="Jesse"
        fontSize={0.1}
        width={1.5}
        position={[-0.375, 0.715, 0.01]}
      />
      <TextInput
        value="/01"
        fontSize={0.05}
        width={1}
        position={[0.4, -0.659, 0.01]}
      />
      <TextInput
        value="McCree"
        fontSize={0.04}
        width={1}
        position={[0.0, -0.677, 0.01]}
      />

      {/* Your model */}
      <Spinning ySpeed={0.5}>
        <Model
          src="/low_poly_mccree-transformed.glb"
          position={[0, -2, 0]}
          normalize
          center
        />
      </Spinning>
    </group>
  );
}
