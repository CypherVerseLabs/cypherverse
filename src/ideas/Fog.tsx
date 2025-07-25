import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { Color, ColorRepresentation, Fog as ThreeFog } from "three";

type FogProps = {
  color?: ColorRepresentation;
  near?: number;
  far?: number;
};

export function Fog({ color = "#ffffff", near = 10, far = 80 }: FogProps) {
  const { scene } = useThree();

  const fogColor = useMemo(() => new Color(color), [color]);

  useEffect(() => {
    const fog = new ThreeFog(fogColor, near, far);
    scene.fog = fog;

    return () => {
      if (scene.fog === fog) {
        scene.fog = null;
      }
    };
  }, [fogColor, near, far, scene]);

  return null;
}
