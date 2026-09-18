import { GroupProps } from "@react-three/fiber";
import { Text } from "@react-three/drei";

type WordsProps = {
  children: string;
  color?: string;
} & GroupProps;

const FONT =
  "https://d27rt3a60hh1lx.cloudfront.net/fonts/Quicksand_Bold.otf";

export default function Words(props: WordsProps) {
  const { children, color = "black", ...rest } = props;

  return (
    <group name="title" {...rest}>
      <Text color={color} font={FONT} fontSize={0.2}>
        {children}
      </Text>
    </group>
  );
}