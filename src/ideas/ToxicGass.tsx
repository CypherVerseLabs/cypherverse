import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { BufferGeometry, Float32BufferAttribute, Points, PointsMaterial, Color, ColorRepresentation, BufferAttribute } from "three";

type RainProps = {
  count?: number; // Number of raindrops
  color?: ColorRepresentation; // Color of raindrops
  size?: number; // Size of raindrops
};

export function Rain({ count = 5000, color = "white", size = 0.1 }: RainProps) {
  const { scene } = useThree();

  useEffect(() => {
    // Convert the color prop to a THREE.Color object if it's not already a Color
    const rainColor = color instanceof Color ? color : new Color(color); // This ensures color is a valid THREE.Color instance

    // Generate random positions for raindrops
    const positions: number[] = [];
    for (let i = 0; i < count; i++) {
      positions.push(Math.random() * 200 - 100); // X position
      positions.push(Math.random() * 200 - 100); // Y position
      positions.push(Math.random() * 200 - 100); // Z position
    }

    // Create geometry for raindrops
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));

    // Create a material for raindrops (a simple color with adjusted opacity)
    const material = new PointsMaterial({
      color: rainColor, // Use the THREE.Color object for the material color
      size,
      transparent: true,
      opacity: 0.7,
    });

    // Create Points object (raindrops)
    const rain = new Points(geometry, material);
    scene.add(rain);

    // Animation: Make raindrops fall
    const animateRain = () => {
      // Ensure positions is a BufferAttribute and access its array
      const positions = geometry.attributes.position as BufferAttribute;
      const array = positions.array as Float32Array;

      for (let i = 1; i < array.length; i += 3) {
        // Move raindrops downward
        array[i] -= 0.5; // Adjust speed of rain falling
        if (array[i] < -100) {
          array[i] = 100; // Reset raindrop position after it falls below scene
        }
      }

      // Update the geometry to reflect the new positions
      positions.needsUpdate = true;
      requestAnimationFrame(animateRain);
    };

    animateRain();

    // Cleanup on unmount
    return () => {
      scene.remove(rain);
    };
  }, [scene, count, color, size]);

  return null;
}