/* =========================================
   AI SCENE CONTEXT
========================================= */

export type AIGenerateContext = {
  objects: {
    id: string;

    type: string;

    name?: string;

    props?: Record<
      string,
      unknown
    >;

    transform?: {
      position: [
        number,
        number,
        number
      ];

      rotation: [
        number,
        number,
        number
      ];

      scale: [
        number,
        number,
        number
      ];
    };
  }[];
};


/* =========================================
   AI SCENE ACTIONS
========================================= */

export type AISceneAction =
  | {
      action: "create";

      type: string;

      props?: Record<
        string,
        unknown
      >;

      transform?: {
        position?: [
          number,
          number,
          number
        ];

        rotation?: [
          number,
          number,
          number
        ];

        scale?: [
          number,
          number,
          number
        ];
      };
    }

  | {
      action: "update";

      id: string;

      props?: Record<
        string,
        unknown
      >;

      transform?: {
        position?: [
          number,
          number,
          number
        ];

        rotation?: [
          number,
          number,
          number
        ];

        scale?: [
          number,
          number,
          number
        ];
      };
    }

  | {
      action: "delete";

      id: string;
    };


/* =========================================
   AI RESPONSE
========================================= */

export type AIActionResponse = {
  actions: AISceneAction[];
};