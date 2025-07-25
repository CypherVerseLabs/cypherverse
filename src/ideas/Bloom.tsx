import { VisualEffect } from "cyengine";
import { UnrealBloomPass } from "three-stdlib";
import { extend, ReactThreeFiber } from "@react-three/fiber";
import { useState } from "react";
import { Vector2 } from "three";

// ✅ Correct module name for augmentation
declare module '@react-three/fiber' {
  interface ThreeElements {
    unrealBloomPass: ReactThreeFiber.Node<UnrealBloomPass, typeof UnrealBloomPass>;
  }
}

extend({ UnrealBloomPass });

export default function Bloom() {
  const [res] = useState(() => new Vector2(256, 256));

  return (
    <VisualEffect index={1}>
      <unrealBloomPass args={[res, 0.1, 0.01, 0.95]} />
    </VisualEffect>
  );
}
