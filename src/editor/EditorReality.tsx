import { StandardReality } from "cyengine";
import { ReactNode } from "react";

import {
  EditorProvider,
} from "./context/EditorContext";

import Scene from "./scene/Scene";

import {
  Scene as SceneData,
} from "./scene/objectTypes";

import EditorUI from "./ui/EditorUI";

import {
  EditorTemplate,
} from "./templates/types";

import {
  defaultEditorTemplate,
} from "./templates";


type EditorRealityProps = {
  children?: ReactNode | ReactNode[];

  initialScene?: SceneData;

  template?: EditorTemplate;
};


export default function EditorReality({
  children,
  initialScene,
  template = defaultEditorTemplate,
}: EditorRealityProps) {

  const startingScene =
    initialScene ??
    template.scene;


  return (
    <StandardReality>

      <EditorProvider
        initialScene={startingScene}
      >

        {/* TEMPLATE ENVIRONMENT */}

        {template.environment}


        {/* EDITABLE SCENE */}

        <Scene />


        {/* EDITOR UI */}

        <EditorUI />


        {/* EXTRA CHILDREN */}

        {children}

      </EditorProvider>

    </StandardReality>
  );
}