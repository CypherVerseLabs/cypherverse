import {
  VisualWorld,
} from "cyengine";

import {
  Text,
} from "@react-three/drei";

import {
  GroupProps,
} from "@react-three/fiber";

import {
  Scene,
} from "../editor/scene/objectTypes";

import {
  sceneToWorld,
} from "../editor/scene/sceneToWorld";


/* =========================================================
   TYPES
========================================================= */

type WorldCardProps = {
  projectId: string;
  scene: Scene;
  name: string;
} & GroupProps;


/* =========================================================
   WORLD CARD
========================================================= */

export default function WorldCard(
  props: WorldCardProps
) {
  const {
    projectId,
    scene,
    name,
    ...rest
  } = props;


  /* =======================================================
     WORLD
  ======================================================= */

  const world =
    sceneToWorld(scene);


  /* =======================================================
     INFORMATION
  ======================================================= */

  const objectCount =
    scene.objects.length;

  const modelCount =
    scene.objects.filter(
      (object) =>
        object.type === "model"
    ).length;

  const linkCount =
    scene.objects.filter(
      (object) =>
        object.type === "link"
    ).length;

  const hasRain =
    scene.objects.some(
      (object) =>
        object.type === "rain"
    );

  const hasGround =
    scene.objects.some(
      (object) =>
        object.type === "ground"
    );


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <group
      {...rest}
      name={`world-card-${projectId}`}
    >

      {/* =================================================
          WORLD VISUAL
      ================================================= */}

      <VisualWorld
        world={world}
        position={[0, 2.5, 0]}
      />


      {/* =================================================
          INFORMATION
      ================================================= */}

      <group
        position-y={0.7}
      >

        {/* NAME */}

        <Text
          position={[0, 0.8, 0]}
          fontSize={0.3}
          color="#000000"
          anchorX="center"
          anchorY="middle"
        >
          {name}
        </Text>


        {/* OBJECT COUNT */}

        <Text
          position={[0, 0.4, 0]}
          fontSize={0.15}
          color="#00ff88"
          anchorX="center"
          anchorY="middle"
        >
          {objectCount} objects
        </Text>


        {/* DETAILS */}

        <Text
          position={[0, 0.15, 0]}
          fontSize={0.12}
          color="#cccccc"
          anchorX="center"
          anchorY="middle"
        >
          {modelCount} models •{" "}
          {linkCount} links
        </Text>


        {/* ENVIRONMENT */}

        <Text
          position={[0, -0.1, 0]}
          fontSize={0.12}
          color="#aaaaaa"
          anchorX="center"
          anchorY="middle"
        >
          {hasRain ? "Rain" : "No Rain"}{" "}
          •{" "}
          {hasGround ? "Ground" : "No Ground"}
        </Text>

      </group>

    </group>
  );
}