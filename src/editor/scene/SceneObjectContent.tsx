import React, {
  useLayoutEffect,
  useRef,
} from "react";

import {
  Audio,
  Fog,
  Image,
  InfinitePlane,
  LostFloor,
  Model,
  Video,
} from "cyengine";

import {
  ColorRepresentation,
  Group,
  Object3D,
} from "three";

import CloudySky from "../../ideas/CloudySky";
import { Rain } from "../../ideas/environments/Rain";
import Title from "../../ideas/inputs/Title";
import Link from "../../ideas/inputs/Link";
import Speaker from "../../ideas/players/Speaker";
import Ground from "../../ideas/Ground";

import ToxicGass from "../../ideas/environments/ToxicGass";
import TransparentFloor from "../../ideas/environments/TransparentFloor";
import SpeakerRadio from "../../ideas/players/SpeakerRadio";
import VideoPlayer from "../../ideas/players/VideoPlayer";
import YouTubePlayer from "../../ideas/players/YouTubePlayer";
import Probe from "../../ideas/mediated/Probe";
import Cyrus from "../../ideas/characters/Cyrus";
import Bloom from "../../ideas/Bloom";

import {
  SceneObject,
} from "./objectTypes";

import {
  useEditor,
} from "../context/EditorContext";


/* =========================================
   TYPES
========================================= */

type SceneObjectContentProps = {
  object: SceneObject;
};


/* =========================================
   ENVIRONMENT TYPES
========================================= */

const ENVIRONMENT_TYPES =
  new Set<SceneObject["type"]>([
    "ground",
    "cloudySky",
    "rain",
    "toxicGass",
    "transparentFloor",
    "fog",
    "background",
    "hdri",
    "infinitePlane",
    "lostFloor",
  ]);


/* =========================================
   NON-INTERACTIVE ENVIRONMENT
========================================= */

/*
 * Environment objects remain visible in View
 * Mode but do not steal pointer events from
 * interactive runtime objects.
 *
 * In Edit Mode, their original raycasts are
 * restored so they can be selected.
 */

function NonInteractiveEnvironment({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const groupRef = useRef<Group>(null);

  const {
    editorActive,
  } = useEditor();

  useLayoutEffect(() => {
    const group = groupRef.current;

    if (!group) {
      return;
    }

    const originalRaycasts = new Map<
      Object3D,
      Object3D["raycast"]
    >();

    group.traverse((child) => {
      if (
        "raycast" in child &&
        typeof child.raycast === "function"
      ) {
        originalRaycasts.set(
          child,
          child.raycast
        );

        if (!editorActive) {
          child.raycast = () => {
  // Intentionally disabled while editor mode is active.
};

        }
      }
    });

    return () => {
      originalRaycasts.forEach(
        (raycast, child) => {
          child.raycast = raycast;
        }
      );
    };
  }, [
    editorActive,
  ]);

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
}


/* =========================================
   EDITOR INTERACTION SHIELD
========================================= */

/*
 * Runtime Ideas such as Link, Speaker, and
 * other interactive components may contain
 * their own pointer handlers.
 *
 * In Edit Mode, the parent SceneObject must
 * receive the selection click instead of the
 * Idea activating its runtime behavior.
 *
 * Disabling raycasts on the rendered content
 * prevents child meshes from receiving pointer
 * events while editing.
 *
 * The parent SceneObject group still receives
 * the click through its own editor handler.
 */

function EditorInteractionShield({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}): React.ReactElement {
  const groupRef = useRef<Group>(null);

  useLayoutEffect(() => {
    const group = groupRef.current;

    if (!group) {
      return;
    }

    const originalRaycasts = new Map<
      Object3D,
      Object3D["raycast"]
    >();

    group.traverse((child) => {
      if (
        "raycast" in child &&
        typeof child.raycast === "function"
      ) {
        originalRaycasts.set(
          child,
          child.raycast
        );

        if (enabled) {
          child.raycast = () => {
  // Intentionally disabled while the editor interaction shield is enabled.
};

        }
      }
    });

    return () => {
      originalRaycasts.forEach(
        (raycast, child) => {
          child.raycast = raycast;
        }
      );
    };
  }, [
    enabled,
  ]);

  return (
    <group ref={groupRef}>
      {children}
    </group>
  );
}



/* =========================================
   SCENE OBJECT CONTENT
========================================= */

export default function SceneObjectContent({
  object,
}: SceneObjectContentProps): React.ReactElement | null {
  const {
    editorActive,
  } = useEditor();

  let content:
    React.ReactElement | null;


  /* =======================================
     IMAGE
  ======================================= */

  switch (object.type) {
    case "image":
      content = object.props.src ? (
        <Image
          src={object.props.src}
        />
      ) : (
        <ImagePlaceholder />
      );
      break;


    /* =====================================
       MODEL
    ===================================== */

    case "model":
      content = object.props.src ? (
        <Model
          src={object.props.src}
          center={object.props.center}
          normalize={object.props.normalize}
        />
      ) : (
        <ModelPlaceholder />
      );
      break;


    /* =====================================
       VIDEO
    ===================================== */

    case "video":
      content = object.props.src ? (
        <Video
          src={object.props.src}
          size={object.props.size}
          framed={object.props.framed}
          muted={object.props.muted}
          volume={object.props.volume}
        />
      ) : (
        <VideoPlaceholder />
      );
      break;


    /* =====================================
       AUDIO
    ===================================== */

    case "audio":
      content = object.props.url ? (
        <Audio
          url={object.props.url}
          volume={object.props.volume}
          rollOff={object.props.rollOff}
        />
      ) : (
        <AudioPlaceholder />
      );
      break;


    /* =====================================
       HDRI
    ===================================== */

    case "hdri":
      /*
       * HDRI rendering can be connected to
       * the actual CyEngine HDRI component
       * later.
       */
      content = null;
      break;


    /* =====================================
       BACKGROUND
    ===================================== */

    case "background":
      content = (
        <color
          attach="background"
          args={[
            object.props.color as ColorRepresentation,
          ]}
        />
      );
      break;


    /* =====================================
       FOG
    ===================================== */

    case "fog":
      content = (
        <Fog
          color={
            object.props.color as ColorRepresentation
          }
          near={
            object.props.near
          }
          far={
            object.props.far
          }
        />
      );
      break;


    /* =====================================
       INFINITE PLANE
    ===================================== */

    case "infinitePlane":
      content = (
        <InfinitePlane
          height={
            object.props.height
          }
          size={
            object.props.size
          }
          visible={
            object.props.visible
          }
        />
      );
      break;


    /* =====================================
       LOST FLOOR
    ===================================== */

    case "lostFloor":
      content = object.props.visible ? (
        <LostFloor />
      ) : null;
      break;


    /* =====================================
       CLOUDY SKY
    ===================================== */

    case "cloudySky":
      content = (
        <CloudySky
          color={
            object.props.color
          }
          colors={
            object.props.colors
          }
        />
      );
      break;


    /* =====================================
       RAIN
    ===================================== */

    case "rain":
      content = (
        <Rain
          count={
            object.props.count
          }
          color={
            object.props.color as ColorRepresentation
          }
          size={
            object.props.size
          }
        />
      );
      break;


    /* =====================================
       TITLE
    ===================================== */

    case "title":
      content = (
        <Title
          image={
            object.props.image ||
            undefined
          }
        >
          {object.props.text}
        </Title>
      );
      break;


    /* =====================================
       LINK
    ===================================== */

    case "link":
      content = (
        <Link
          href={
            object.props.href
          }
        >
          {object.props.text}
        </Link>
      );
      break;


    /* =====================================
       SPEAKER
    ===================================== */

    case "speaker":
      content = (
        <Speaker
          audioUrl={
            object.props.audioUrl
          }
          distance={
            object.props.distance
          }
          volume={
            object.props.volume
          }
        />
      );
      break;


    /* =====================================
       GROUND
    ===================================== */

    case "ground":
      content = (
        <Ground
          size={
            object.props.size
          }
          gridSize={
            object.props.gridSize
          }
        />
      );
      break;


      case "toxicGass":
  content = (
    <ToxicGass
      count={object.props.count}
      color={
        object.props.color as ColorRepresentation
      }
      size={object.props.size}
    />
  );
  break;

case "transparentFloor":
  content = (
    <TransparentFloor
      opacity={object.props.opacity}
      color={
        object.props.color as ColorRepresentation
      }
    />
  );
  break;



case "speakerRadio":
  content = (
    <SpeakerRadio
      distance={object.props.distance}
      volume={object.props.volume}
      shuffle={object.props.shuffle}
    />
  );
  break;


case "videoPlayer":
  content = (
    <VideoPlayer
      videoSrc={object.props.videoSrc}
      videoDistance={object.props.videoDistance}
      framed={object.props.framed}
      volume={object.props.volume}
      restartOnEnter={object.props.restartOnEnter}
      audioDistance={object.props.audioDistance}
      frameColor={object.props.frameColor}
      previewColor={object.props.previewColor}
      previewText={object.props.previewText}
      previewTextColor={object.props.previewTextColor}
      previewTextFont={object.props.previewTextFont}
      previewTextSize={object.props.previewTextSize}
    />
  );
  break;


case "youtubePlayer":
  content = (
    <YouTubePlayer
      videoId={object.props.videoId}
      width={object.props.width}
      height={object.props.height}
      videoDistance={object.props.videoDistance}
      controls={object.props.controls}
      muted={object.props.muted}
    />
  );
  break;


case "probe":
  content = (
    <Probe />
  );
  break;


case "cyrus":
  content = (
    <Cyrus
      dialogue={object.props.dialogue}
      response={object.props.response}
      link={object.props.link}
      anim={object.props.anim as any}
    />
  );
  break;


    /* =====================================
       FALLBACK
    ===================================== */

    default:
      content = null;
      break;
  }


  /* =========================================
     EMPTY CONTENT
  ========================================= */

  if (!content) {
    return null;
  }


  /* =========================================
     ENVIRONMENT
  ========================================= */

  if (
    ENVIRONMENT_TYPES.has(
      object.type
    )
  ) {
    return (
      <NonInteractiveEnvironment>
        {content}
      </NonInteractiveEnvironment>
    );
  }


  /* =========================================
     NORMAL OBJECT
  ========================================= */

  return (
    <EditorInteractionShield
      enabled={editorActive}
    >
      {content}
    </EditorInteractionShield>
  );
}


/* =========================================
   IMAGE PLACEHOLDER
========================================= */

function ImagePlaceholder(): React.ReactElement {
  return (
    <mesh>
      <planeGeometry
        args={[
          1,
          1,
        ]}
      />

      <meshBasicMaterial
        color="#555566"
        wireframe
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}


/* =========================================
   MODEL PLACEHOLDER
========================================= */

function ModelPlaceholder(): React.ReactElement {
  return (
    <group>
      <mesh>
        <boxGeometry
          args={[
            1,
            1,
            1,
          ]}
        />

        <meshBasicMaterial
          color="#4c7dff"
          wireframe
          transparent
          opacity={0.8}
        />
      </mesh>

      <mesh>
        <sphereGeometry
          args={[
            0.08,
            12,
            12,
          ]}
        />

        <meshBasicMaterial
          color="#ffffff"
        />
      </mesh>
    </group>
  );
}


/* =========================================
   VIDEO PLACEHOLDER
========================================= */

function VideoPlaceholder(): React.ReactElement {
  return (
    <mesh>
      <planeGeometry
        args={[
          1.6,
          0.9,
        ]}
      />

      <meshBasicMaterial
        color="#663366"
        wireframe
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}


/* =========================================
   AUDIO PLACEHOLDER
========================================= */

function AudioPlaceholder(): React.ReactElement {
  return (
    <group>
      <mesh>
        <sphereGeometry
          args={[
            0.2,
            16,
            16,
          ]}
        />

        <meshBasicMaterial
          color="#ffaa00"
          wireframe
        />
      </mesh>

      <mesh>
        <coneGeometry
          args={[
            0.12,
            0.3,
            8,
          ]}
        />

        <meshBasicMaterial
          color="#ffaa00"
        />
      </mesh>
    </group>
  );
}