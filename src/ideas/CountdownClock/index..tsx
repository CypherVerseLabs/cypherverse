import { useState, useEffect } from "react";
import { Text } from "@react-three/drei"; // for 3D text rendering
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";

type CountdownClockProps = {
  start?: number;
  position?: [number, number, number];
  onEnd?: () => void;
};

function CountdownClock({
  start = 10,
  position = [0, 0, 0],
  onEnd,
}: CountdownClockProps) {
  const [timeLeft, setTimeLeft] = useState<number>(start);

  useEffect(() => {
    if (timeLeft <= 0) {
      onEnd?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onEnd]);

  return (
    <Text
      position={position}
      fontSize={0.15}
      color="orange"
      anchorX="center"
      anchorY="middle"
    >
      {timeLeft > 0 ? `${timeLeft}` : "Time's up!"}
    </Text>
  );
}

export default CountdownClock;
