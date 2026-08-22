import { GroupProps } from "@react-three/fiber";
import { Color, ColorRepresentation } from "three";
import { useSkyMat } from "./materials/sky";

import React, { useMemo } from "react";


const RADIUS = 200;

type CloudySkyProps = {
  color?: string;         // base color hex string (optional)
  colors?: number[];      // explicit colors array [r,g,b,...] normalized floats (optional)
} & GroupProps;

export default function CloudySky({ color = "#9efcff", colors, ...restProps }: CloudySkyProps) {
  // If explicit colors provided, use them; otherwise generate from base color
  const COLORS = useMemo(() => {
    if (colors && colors.length >= 12) return colors;

    // Generate a palette from base color with 4 steps (can tweak as you want)
    const base = new Color(color as ColorRepresentation);


    // Create darker variations for smooth gradient
    const palette = [
      base.clone().multiplyScalar(1.0),
      base.clone().multiplyScalar(0.8),
      base.clone().multiplyScalar(0.6),
      base.clone().multiplyScalar(0.4),
    ];

    // Flatten to [r,g,b,...] normalized floats
    return palette.flatMap(c => [c.r, c.g, c.b]);
  }, [color, colors]);

  // Create the shader material
  const mat = useSkyMat(RADIUS, COLORS);

  return (
    <group {...restProps} name="cloudy-sky">
      <mesh material={mat}>
        <sphereBufferGeometry args={[RADIUS, 50, 50]} />
      </mesh>
    </group>
  );
}
