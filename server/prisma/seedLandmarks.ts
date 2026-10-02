import {
  PrismaClient,
} from "../generated/prisma/client.js";

import {
  CYPHERVERSE_LANDMARKS,
} from "../data/cypherVerseLandmarks.js";

const prisma =
  new PrismaClient();

async function seedLandmarks() {
  console.log(
    "Seeding CypherVerse landmarks..."
  );

  for (
    const landmark
    of CYPHERVERSE_LANDMARKS
  ) {
    const parcel =
      await prisma.parcel.upsert({
        where: {
          estateId:
            landmark.estateId,
        },

        create: {
          estateId:
            landmark.estateId,

          x:
            landmark.x,

          y:
            landmark.y,

          type:
            landmark.type,

          status:
            "owned",

          ownerId:
            null,

          price:
            null,

          name:
            landmark.name,

          description:
            landmark.description,

          blockchainAddress:
            null,

          tokenId:
            null,
        },

        update: {
          x:
            landmark.x,

          y:
            landmark.y,

          type:
            landmark.type,

          name:
            landmark.name,

          description:
            landmark.description,

          /**
           * Intentionally do NOT update:
           *
           * ownerId
           * price
           * status
           * blockchainAddress
           * tokenId
           *
           * Those fields represent runtime/database state
           * and should not be overwritten every time the
           * seed is executed.
           */
        },
      });

    console.log(
      `✓ ${parcel.name} (${parcel.x}, ${parcel.y})`
    );
  }

  console.log(
    `\nSeeded ${CYPHERVERSE_LANDMARKS.length} landmarks.`
  );
}

seedLandmarks()
  .catch((error) => {
    console.error(
      "Landmark seed failed:",
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
