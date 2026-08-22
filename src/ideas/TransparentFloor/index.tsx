import { ColorRepresentation } from "three";

type TransparentFloorProps = {
  opacity?: number;
  color?: ColorRepresentation; // ✅ Correct type
};

export default function TransparentFloor({
  opacity = 0.6,
  color = "white",
}: TransparentFloorProps) {
  return (
    <group name="transparent-floor">
      {/* Main transparent surface */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeBufferGeometry args={[500, 500]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} />
      </mesh>

      {/* Grid / wireframe overlay */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]}>
        <planeBufferGeometry args={[500, 500, 500, 500]} />
        <meshStandardMaterial color="#ddd" wireframe />
      </mesh>
    </group>
  );
}
