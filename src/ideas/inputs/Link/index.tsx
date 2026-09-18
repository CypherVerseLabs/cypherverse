import {
  FacePlayer,
  Anchor,
  Button,
} from "cyengine";

import {
  GroupProps,
} from "@react-three/fiber";

import {
  useEditor,
} from "../../../editor/context/EditorContext";


type LinkProps = {
  href: string;
  children: string;
} & GroupProps;


export default function Link(
  props: LinkProps
) {
  const {
    href,
    children,
    ...rest
  } = props;

  const {
    editorActive,
  } = useEditor();

  /*
   * In Edit Mode, render the visual link but
   * disable its runtime navigation.
   *
   * The invisible editor selection mesh in
   * SceneObject handles selecting the object.
   */

  if (editorActive) {
    return (
      <group
        name={`link-${href}`}
        {...rest}
      >
        <FacePlayer>
          <group
            raycast={() => null}
          >
            <Button
              maxWidth={0.4}
            >
              {children}
            </Button>
          </group>
        </FacePlayer>
      </group>
    );
  }

  /*
   * In View Mode, preserve normal runtime
   * navigation.
   */

  return (
    <group
      name={`link-${href}`}
      {...rest}
    >
      <FacePlayer>
        <Anchor href={href}>
          <Button maxWidth={0.4}>
            {children}
          </Button>
        </Anchor>
      </FacePlayer>
    </group>
  );
}