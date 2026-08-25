import {
  Suspense,
  useRef,
  useState,
} from "react";

import { Group } from "three";

import { GroupProps } from "@react-three/fiber";

import { useProximity } from "./utils/proximity";

import BuilderModel, {
  type ActionName,
} from "./models/Builder";

import {
  Dialogue,
  VisualDialogue,
} from "./layers/communication";

import LookAtPlayer from "./modifiers/LookAtPlayer";

import { useCyrusAI } from "./useCyrusAI";


/* =========================================================
   PROPS
========================================================= */

type CyrusProps = {
  dialogue?: string;

  response?: string;

  link?: string;

  anim?: ActionName;
} & GroupProps;


/* =========================================================
   DEFAULT MESSAGES
========================================================= */

const MESSAGES = [
  "i'm daydreaming ... and i want to build what i see!",
];


/* =========================================================
   COMPONENT
========================================================= */

export default function Cyrus(
  props: CyrusProps
) {

  const {
    dialogue,
    response,
    link,
    anim = "idle",
    ...rest
  } = props;


  /* =========================================================
     MODEL GROUP
  ========================================================= */

  const group =
    useRef<Group>(null);


  /* =========================================================
     AI CHAT
  ========================================================= */

  const {
    loading,
    error,
    sendMessage,
  } = useCyrusAI();


  /* =========================================================
     USER INPUT
  ========================================================= */

  const [
    inputValue,
    setInputValue,
  ] = useState("");


  /* =========================================================
     AI RESPONSE
  ========================================================= */

  const [
    aiResponse,
    setAIResponse,
  ] = useState<
    string | null
  >(null);


  const [
    aiLink,
    setAILink,
  ] = useState<
    {
      label: string;
      href: string;
    } | null
  >(null);


  /* =========================================================
     DEFAULT MESSAGE
  ========================================================= */

  const message =
    useRef(
      MESSAGES[
        Math.floor(
          Math.random() *
            MESSAGES.length
        )
      ]
    );


  /* =========================================================
     LEGACY LINK SUPPORT
  ========================================================= */

  const modUrl =
    link &&
    link.indexOf("://") === -1
      ? `https://${link}`
      : link;


  /* =========================================================
     PROXIMITY
  ========================================================= */

  const proximity =
    useProximity(group);


  /* =========================================================
     SEND MESSAGE
  ========================================================= */

  const handleSubmit =
    async () => {

      const cleanPrompt =
        inputValue.trim();


      if (
        !cleanPrompt ||
        loading
      ) {
        return;
      }


      const result =
        await sendMessage(
          cleanPrompt
        );


      if (!result) {
        return;
      }


      setInputValue("");


      setAIResponse(
        result.message
      );


      setAILink(
        result.link ?? null
      );
    };


  /* =========================================================
     DIALOGUE
  ========================================================= */

  const d: Dialogue = [
    {
      key: "init",

      text:
        aiResponse ||
        (
          loading
            ? "let me think..."
            : error
              ? "hmm... something went wrong."
              : dialogue ||
                message.current
        ),

      input: {
        value:
          inputValue,

        setValue: (
          value: string
        ) => {

          setInputValue(
            value
          );

          return value;
        },

        type: "text",

        persist: true,
      },

      decisions: [
        {
          name: "submit",

          onClick:
            handleSubmit,
        },
      ],
    },
  ];


  /* =========================================================
     AI NAVIGATION LINK
  ========================================================= */

  if (aiLink) {

    d[0].decisions?.push({
      name:
        aiLink.label,

      onClick: () => {

        window.location.href =
          aiLink.href;

      },
    });

  }


  /* =========================================================
     LEGACY RESPONSE / LINK
  ========================================================= */

  else if (
    !aiResponse &&
    (response || link)
  ) {

    d[0].decisions?.push({

      name:
        response || "",

      onClick:
        modUrl
          ? () => {

              window.open(
                modUrl,
                "_blank"
              );

            }
          : undefined,

    });

  }


  /* =========================================================
     DEFAULT BUILD LINK
  ========================================================= */

  else if (
    !aiResponse &&
    !dialogue &&
    !response &&
    !link
  ) {

    d[0].decisions?.push({

      name:
        "build a world",

      onClick: () => {

        window.location.href =
          "/found";

      },

    });

  }


  /* =========================================================
     ANIMATION
  ========================================================= */

  const animation:
    ActionName =
    proximity.idle
      ? anim
      : "idle";


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <group
      name="builder-08"
      {...rest}
      rotation-x={0}
      rotation-z={0}
    >

      <LookAtPlayer
        enabled={
          !proximity.idle
        }
      >

        <group
          ref={group}
        >

          <group
            position-y={-0.5}
          >

            <Suspense
              fallback={null}
            >

              <BuilderModel
                animation={
                  animation
                }
              />

            </Suspense>


            {!proximity.idle && (

              <VisualDialogue
  enabled={true}
  position={[0.2, 1.05, 0.25]}
  dialogue={d}
/>

            )}

          </group>

        </group>

      </LookAtPlayer>

    </group>
  );
}