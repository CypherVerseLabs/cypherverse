import {
  defaultTransform,
  CloudySkyObject,
  RainObject,
  ToxicGassObject,
  TransparentFloorObject,
  TitleObject,
  LinkObject,
  SpeakerObject,
  SpeakerRadioObject,
  VideoPlayerObject,
  YouTubePlayerObject,
  ProbeObject,
  CyrusObject,
  GroundObject,
} from "../../scene/objectTypes";

import {
  AnyIdeaDefinition,
} from "../types";

function createId(
  type: string
) {
  return `${type}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

/* =========================================
   CUSTOM IDEAS
========================================= */

export const customIdeas:
  AnyIdeaDefinition[] = [

  /* =======================================
     CLOUDY SKY
  ======================================= */

  {
    type: "cloudySky",
    name: "Cloudy Sky",
    category: "Environment",

    schema: [
      {
        name: "color",
        type: "color",
        label: "Base Color",
      },

      {
        name: "colors",
        type: "array",
        itemType: "number",
        label: "Gradient Colors",
        step: 0.01,
      },
    ],

    ai: {
      description:
        "Creates a large cloudy procedural sky surrounding the scene.",

      tags: [
        "sky",
        "clouds",
        "environment",
        "atmosphere",
      ],

      skills: [
        "environment.sky",
      ],
    },

    create: (
      overrides: Partial<CloudySkyObject> = {}
    ) => ({
      id: createId("cloudySky"),
      type: "cloudySky",

      transform: {
        ...defaultTransform,
      },

      props: {
        color: "#9efcff",

        colors: [
          0.7, 0.85, 1,
          0.4, 0.65, 0.9,
          0.2, 0.45, 0.7,
          0.1, 0.2, 0.5,
        ],
      },

      ...overrides,
    }),
  },

  /* =======================================
     RAIN
  ======================================= */

  {
    type: "rain",
    name: "Rain",
    category: "Environment",

    schema: [
      {
        name: "count",
        type: "integer",
        label: "Count",
        step: 1,
      },

      {
        name: "color",
        type: "color",
        label: "Color",
      },

      {
        name: "size",
        type: "number",
        label: "Size",
        step: 0.01,
      },
    ],

    ai: {
      description:
        "Creates animated falling rain particles.",

      tags: [
        "rain",
        "weather",
        "particles",
        "atmosphere",
      ],

      skills: [
        "environment.weather",
      ],
    },

    create: (
      overrides: Partial<RainObject> = {}
    ) => ({
      id: createId("rain"),
      type: "rain",

      transform: {
        ...defaultTransform,
      },

      props: {
        count: 5000,
        color: "#8a2be2",
        size: 0.1,
      },

      ...overrides,
    }),
  },

  /* =======================================
     TITLE
  ======================================= */

  {
    type: "title",
    name: "Title",
    category: "Interface",

    schema: [
      {
        name: "text",
        type: "string",
        label: "Text",
        placeholder: "Title text",
      },

      {
        name: "image",
        type: "image",
        label: "Image",
        placeholder: "Image URL",
      },
    ],

    ai: {
      description:
        "Creates a player-facing 3D title.",

      tags: [
        "title",
        "text",
        "ui",
        "interface",
      ],

      skills: [
        "interface.title",
      ],
    },

    create: (
      overrides: Partial<TitleObject> = {}
    ) => ({
      id: createId("title"),
      type: "title",

      transform: {
        ...defaultTransform,
      },

      props: {
        text: "Welcome",
        image: "",
      },

      ...overrides,
    }),
  },

  /* =======================================
     LINK
  ======================================= */

  {
    type: "link",
    name: "Link",
    category: "Interface",

    schema: [
      {
        name: "href",
        type: "string",
        label: "URL",
        placeholder: "/page",
      },

      {
        name: "text",
        type: "string",
        label: "Text",
        placeholder: "Link text",
      },
    ],

    ai: {
      description:
        "Creates an interactive 3D navigation link.",

      tags: [
        "link",
        "navigation",
        "button",
        "interface",
      ],

      skills: [
        "interface.navigation",
      ],
    },

    create: (
      overrides: Partial<LinkObject> = {}
    ) => ({
      id: createId("link"),

      type: "link",

      transform: {
        ...defaultTransform,
      },

      props: {
        href: "/",
        text: "Visit page",
      },

      ...overrides,
    }),
  },

  /* =======================================
     SPEAKER
  ======================================= */

  {
    type: "speaker",
    name: "Speaker",
    category: "Audio",

    schema: [
      {
        name: "audioUrl",
        type: "audio",
        label: "Audio",
        placeholder: "Audio URL",
      },

      {
        name: "distance",
        type: "number",
        label: "Distance",
        step: 0.01,
      },

      {
        name: "volume",
        type: "number",
        label: "Volume",
        step: 0.01,
      },
    ],

    ai: {
      description:
        "Creates a 3D speaker with positional audio.",

      tags: [
        "audio",
        "speaker",
        "sound",
        "music",
      ],

      skills: [
        "audio.spatial",
      ],
    },

    create: (
      overrides: Partial<SpeakerObject> = {}
    ) => ({
      id: createId("speaker"),

      type: "speaker",

      transform: {
        ...defaultTransform,
      },

      props: {
        audioUrl:
          "https://d27rt3a60hh1lx.cloudfront.net/audio/nocopyright-lofi-muse.mp3",

        distance: 6,

        volume: 1,
      },

      ...overrides,
    }),
  },

  /* =======================================
   TOXIC GASS
======================================= */

{
  type: "toxicGass",

  name: "Toxic Gass",

  category: "Environment",

  schema: [
    {
      name: "count",
      type: "integer",
      label: "Count",
      step: 1,
    },

    {
      name: "color",
      type: "color",
      label: "Color",
    },

    {
      name: "size",
      type: "number",
      label: "Size",
      step: 0.01,
    },
  ],

  ai: {
    description:
      "Creates an animated toxic gas environment.",

    tags: [
      "toxic",
      "gas",
      "environment",
      "particles",
      "atmosphere",
    ],

    skills: [
      "environment.toxicGas",
    ],
  },

  create: (
    overrides: Partial<ToxicGassObject> = {}
  ) => ({
    id: createId("toxicGass"),

    type: "toxicGass",

    transform: {
      ...defaultTransform,
    },

    props: {
      count: 5000,
      color: "#7cff00",
      size: 0.1,
    },

    ...overrides,
  }),
},


/* =======================================
   TRANSPARENT FLOOR
======================================= */

{
  type: "transparentFloor",

  name: "Transparent Floor",

  category: "Environment",

  schema: [
    {
      name: "opacity",
      type: "number",
      label: "Opacity",
      step: 0.01,
    },

    {
      name: "color",
      type: "color",
      label: "Color",
    },
  ],

  ai: {
    description:
      "Creates a transparent floor surface.",

    tags: [
      "floor",
      "transparent",
      "surface",
      "environment",
    ],

    skills: [
      "environment.floor",
    ],
  },

  create: (
    overrides: Partial<TransparentFloorObject> = {}
  ) => ({
    id: createId(
      "transparentFloor"
    ),

    type: "transparentFloor",

    transform: {
      ...defaultTransform,
    },

    props: {
      opacity: 0.6,
      color: "#ffffff",
    },

    ...overrides,
  }),
},


/* =======================================
   SPEAKER RADIO
======================================= */

{
  type: "speakerRadio",

  name: "Speaker Radio",

  category: "Audio",

  schema: [
    {
      name: "distance",
      type: "number",
      label: "Distance",
      step: 0.01,
    },

    {
      name: "volume",
      type: "number",
      label: "Volume",
      step: 0.01,
    },

    {
      name: "shuffle",
      type: "boolean",
      label: "Shuffle",
    },
  ],

  ai: {
    description:
      "Creates a spatial radio speaker with a music playlist.",

    tags: [
      "audio",
      "radio",
      "music",
      "speaker",
    ],

    skills: [
      "audio.radio",
    ],
  },

  create: (
    overrides: Partial<SpeakerRadioObject> = {}
  ) => ({
    id: createId(
      "speakerRadio"
    ),

    type: "speakerRadio",

    transform: {
      ...defaultTransform,
    },

    props: {
      distance: 6,
      volume: 1,
      shuffle: false,
    },

    ...overrides,
  }),
},


/* =======================================
   VIDEO PLAYER
======================================= */

{
  type: "videoPlayer",

  name: "Video Player",

  category: "Media",

  schema: [
    {
      name: "videoSrc",
      type: "string",
      label: "Video URL",
    },

    {
      name: "videoDistance",
      type: "number",
      label: "Video Distance",
      step: 0.1,
    },

    {
      name: "framed",
      type: "boolean",
      label: "Framed",
    },

    {
      name: "volume",
      type: "number",
      label: "Volume",
      step: 0.01,
    },

    {
      name: "restartOnEnter",
      type: "boolean",
      label: "Restart On Enter",
    },

    {
      name: "audioDistance",
      type: "number",
      label: "Audio Distance",
      step: 0.1,
    },

    {
      name: "frameColor",
      type: "color",
      label: "Frame Color",
    },

    {
      name: "previewColor",
      type: "color",
      label: "Preview Color",
    },

    {
      name: "previewText",
      type: "string",
      label: "Preview Text",
    },

    {
      name: "previewTextColor",
      type: "color",
      label: "Preview Text Color",
    },

    {
      name: "previewTextFont",
      type: "string",
      label: "Preview Font",
    },

    {
      name: "previewTextSize",
      type: "number",
      label: "Preview Text Size",
      step: 0.01,
    },
  ],

  ai: {
    description:
      "Creates a spatial video player.",

    tags: [
      "video",
      "media",
      "screen",
      "player",
    ],

    skills: [
      "media.video",
    ],
  },

  create: (
    overrides: Partial<VideoPlayerObject> = {}
  ) => ({
    id: createId(
      "videoPlayer"
    ),

    type: "videoPlayer",

    transform: {
      ...defaultTransform,
    },

    props: {
      videoSrc:
        "https://d27rt3a60hh1lx.cloudfront.net/content/silksbyvp/video.mp4",

      videoDistance: 5,

      framed: false,

      volume: 1,

      restartOnEnter: false,

      audioDistance: 5,

      frameColor: "#888",

      previewColor: "black",

      previewText: "",

      previewTextColor: "white",

      previewTextFont:
        "https://d27rt3a60hh1lx.cloudfront.net/fonts/Quicksand_Bold.otf",

      previewTextSize: 0.05,
    },

    ...overrides,
  }),
},


/* =======================================
   YOUTUBE PLAYER
======================================= */

{
  type: "youtubePlayer",

  name: "YouTube Player",

  category: "Media",

  schema: [
    {
      name: "videoId",
      type: "string",
      label: "YouTube Video ID",
    },

    {
      name: "width",
      type: "number",
      label: "Width",
      step: 1,
    },

    {
      name: "height",
      type: "number",
      label: "Height",
      step: 1,
    },

    {
      name: "videoDistance",
      type: "number",
      label: "Video Distance",
      step: 0.1,
    },

    {
      name: "controls",
      type: "boolean",
      label: "Controls",
    },

    {
      name: "muted",
      type: "boolean",
      label: "Muted",
    },
  ],

  ai: {
    description:
      "Creates a spatial YouTube video player.",

    tags: [
      "youtube",
      "video",
      "media",
      "player",
    ],

    skills: [
      "media.youtube",
    ],
  },

  create: (
    overrides: Partial<YouTubePlayerObject> = {}
  ) => ({
    id: createId(
      "youtubePlayer"
    ),

    type: "youtubePlayer",

    transform: {
      ...defaultTransform,
    },

    props: {
      videoId: "",

      width: 640,

      height: 360,

      videoDistance: 5,

      controls: true,

      muted: false,
    },

    ...overrides,
  }),
},


/* =======================================
   PROBE
======================================= */

{
  type: "probe",

  name: "Probe",

  category: "Objects",

  schema: [],

  ai: {
    description:
      "Creates the Probe 3D object.",

    tags: [
      "probe",
      "object",
      "3d",
    ],

    skills: [
      "object.probe",
    ],
  },

  create: (
    overrides: Partial<ProbeObject> = {}
  ) => ({
    id: createId("probe"),

    type: "probe",

    transform: {
      ...defaultTransform,
    },

    props: {},

    ...overrides,
  }),
},


/* =======================================
   CYRUS
======================================= */

{
  type: "cyrus",

  name: "Cyrus",

  category: "Characters",

  schema: [
    {
      name: "dialogue",
      type: "string",
      label: "Dialogue",
    },

    {
      name: "response",
      type: "string",
      label: "Response",
    },

    {
      name: "link",
      type: "string",
      label: "Link",
    },

    {
      name: "anim",
      type: "string",
      label: "Animation",
    },
  ],

  ai: {
    description:
      "Creates the Cyrus interactive AI character.",

    tags: [
      "cyrus",
      "character",
      "ai",
      "npc",
    ],

    skills: [
      "character.cyrus",
    ],
  },

  create: (
    overrides: Partial<CyrusObject> = {}
  ) => ({
    id: createId("cyrus"),

    type: "cyrus",

    transform: {
      ...defaultTransform,
    },

    props: {
      dialogue: "",

      response: "",

      link: "",

      anim: "idle",
    },

    ...overrides,
  }),
},

  /* =======================================
     GROUND
  ======================================= */

  {
    type: "ground",
    name: "Ground",
    category: "Environment",

    schema: [
      {
        name: "size",
        type: "number",
        label: "Size",
        step: 1,
      },

      {
        name: "gridSize",
        type: "integer",
        label: "Grid Size",
        step: 1,
      },
    ],

    ai: {
      description:
        "Creates an interactive grid-based ground surface.",

      tags: [
        "ground",
        "floor",
        "grid",
        "surface",
      ],

      skills: [
        "environment.ground",
      ],
    },

    create: (
      overrides: Partial<GroundObject> = {}
    ) => ({
      id: createId("ground"),

      type: "ground",

      transform: {
        ...defaultTransform,
      },

      props: {
        size: 500,
        gridSize: 100,
      },

      ...overrides,
    }),
  },
];