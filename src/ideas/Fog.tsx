import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Color, ColorRepresentation, Fog as ThreeFog } from "three";

type FogProps = {
  color?: ColorRepresentation;
  near?: number;
  far?: number;
};

export function Fog({ color = "white", near = 10, far = 80 }: FogProps) {
  const { scene } = useThree();

  useEffect(() => {
    const col = color instanceof Color ? color : new Color(color);
    scene.fog = new ThreeFog(col, near, far);

    return () => {
      scene.fog = null;
    };
  }, [color, near, far]); // no need for `scene` here

  return null;
}
