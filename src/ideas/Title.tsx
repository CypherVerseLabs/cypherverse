import { FacePlayer, Image } from "cyengine";
import { GroupProps } from "@react-three/fiber";
import { Text } from "@react-three/drei";

type TitleProps = {
  children: string;
  image?: string;
  color?: string;
} & GroupProps;

const FONT = "https://d27rt3a60hh1lx.cloudfront.net/fonts/Quicksand_Bold.otf";

export default function Title(props: TitleProps) {
  const { children, image, color = "#000000", ...rest } = props;

  return (
    <group name="title" {...rest}>
      <FacePlayer>
        {image && (
          <Image src={image} position-z={-0.01} scale={3} position-y={0.25} />
        )}
        <Text
          color={color}
          font={FONT}
          fontSize={0.2}
          // Optional outline or shadow (adjust as needed)
          strokeWidth={0.02}
          strokeColor="#ffffff"
        >
          {children}
        </Text>
      </FacePlayer>
    </group>
  );
}
