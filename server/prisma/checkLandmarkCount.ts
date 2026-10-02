import { CYPHERVERSE_LANDMARKS } from "../data/cypherVerseLandmarks.js";

console.log(`Total: ${CYPHERVERSE_LANDMARKS.length}`);

for (const [i, landmark] of CYPHERVERSE_LANDMARKS.entries()) {
  console.log(
    `${String(i + 1).padStart(2, "0")}. ${landmark.name} | ` +
    `logical=(${landmark.x},${landmark.y}) | ` +
    `estateId=${landmark.estateId}`
  );
}
