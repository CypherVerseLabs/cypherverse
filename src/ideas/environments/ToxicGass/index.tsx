import { useEffect } from "react";

import { useThree } from "@react-three/fiber";

import {
  BufferAttribute,
  BufferGeometry,
  Color,
  ColorRepresentation,
  Points,
  PointsMaterial,
  Float32BufferAttribute,
} from "three";


type ToxicGassProps = {
  count?: number;

  color?: ColorRepresentation;

  size?: number;
};


export default function ToxicGass({
  count = 5000,

  color = "#7cff00",

  size = 0.1,
}: ToxicGassProps) {

  const {
    scene,
  } = useThree();


  useEffect(() => {

    const gassColor =
      color instanceof Color
        ? color
        : new Color(color);


    const positions: number[] = [];


    for (
      let i = 0;
      i < count;
      i++
    ) {

      positions.push(
        Math.random() * 200 - 100
      );

      positions.push(
        Math.random() * 200 - 100
      );

      positions.push(
        Math.random() * 200 - 100
      );
    }


    const geometry =
      new BufferGeometry();


    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(
        positions,
        3
      )
    );


    const material =
      new PointsMaterial({
        color: gassColor,

        size,

        transparent: true,

        opacity: 0.7,
      });


    const toxicGass =
      new Points(
        geometry,
        material
      );


    toxicGass.name =
      "toxic-gass";


    scene.add(
      toxicGass
    );


    const animate =
      () => {

        const position =
          geometry
            .attributes
            .position as BufferAttribute;


        const array =
          position.array as Float32Array;


        for (
          let i = 1;
          i < array.length;
          i += 3
        ) {

          /*
           * Toxic gas rises instead
           * of falling like Rain.
           */
          array[i] += 0.05;


          if (
            array[i] > 100
          ) {
            array[i] = -100;
          }
        }


        position.needsUpdate =
          true;


        requestAnimationFrame(
          animate
        );
      };


    animate();


    return () => {

      scene.remove(
        toxicGass
      );

      geometry.dispose();

      material.dispose();
    };

  }, [
    scene,
    count,
    color,
    size,
  ]);


  return null;
}