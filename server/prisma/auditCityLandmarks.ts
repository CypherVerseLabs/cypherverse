import "dotenv/config";
import { prisma } from "../lib/prisma.js";
import { PARCEL_SIZE } from "../../shared/world/CypherVerseWorldLayout.js";
import { CYPHERVERSE_LANDMARKS } from "../data/cypherVerseLandmarks.js";

async function main() {
  const failures: string[] = [];

  const parcels = await prisma.parcel.findMany({
    where: { type: "CITY_LANDMARK" },
    select: {
      id: true,
      estateId: true,
      x: true,
      y: true,
      type: true,
      status: true,
      name: true,
      description: true,
    },
  });

  const key = (x: number, y: number) => `${x},${y}`;
  const actualByCoordinate = new Map(
    parcels.map((p) => [key(p.x, p.y), p]),
  );

  for (const landmark of CYPHERVERSE_LANDMARKS) {
    const x = (landmark.x + 75) * PARCEL_SIZE;
    const y = (landmark.y + 75) * PARCEL_SIZE;
    const parcel = actualByCoordinate.get(key(x, y));

    if (!parcel) {
      failures.push(`Missing landmark at (${x},${y}): ${landmark.name}`);
      continue;
    }

    const expectedEstateId =
      landmark.name === "Genesis" ? "11326" : landmark.estateId;

    if (parcel.estateId !== expectedEstateId)
      failures.push(`${landmark.name}: estateId mismatch`);

    if (parcel.type !== landmark.type)
      failures.push(`${landmark.name}: type mismatch`);

    if (parcel.name !== landmark.name)
      failures.push(`${landmark.name}: name mismatch`);

    if (parcel.description !== landmark.description)
      failures.push(`${landmark.name}: description mismatch`);

    if (parcel.status !== "available")
      failures.push(`${landmark.name}: expected available, got ${parcel.status}`);

    if (landmark.name === "Genesis" &&
        parcel.id !== "75e005dc-7245-4862-a004-51979ca3b988") {
      failures.push("Genesis: fixed UUID mismatch");
    }
  }

  console.log(`Configured landmarks: ${CYPHERVERSE_LANDMARKS.length}`);
  console.log(`Database landmark parcels: ${parcels.length}`);

  if (parcels.length !== CYPHERVERSE_LANDMARKS.length)
    failures.push("Database landmark count differs from configuration");

  if (failures.length) {
    console.error("LANDMARK AUDIT FAILED:");
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exitCode = 1;
  } else {
    console.log("PASS: All landmark records match their configuration.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
