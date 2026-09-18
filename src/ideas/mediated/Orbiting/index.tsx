import { ReactNode, useRef, useState } from "react";
import { Group } from "three";
import { useLimitedFrame } from "cyengine"; // adjust import path

type OrbitingProps = {
  children: ReactNode;
  radius?: number;
  ySpeed?: number;
};

export function Orbiting({ children, radius = 2, ySpeed = 1 }: OrbitingProps) {
  const group = useRef<Group>(null);
  const [seed] = useState(Math.random());

  useLimitedFrame(75, ({ clock }) => {
    if (!group.current) return;

    group.current.rotation.y =
      clock.elapsedTime * ySpeed * (0.25 + seed / 10) + ySpeed * seed * 1000;
  });

  return (
    <group ref={group}>
      <group position={[radius, 0, 0]}>
        {children}
      </group>
    </group>
  );
}
