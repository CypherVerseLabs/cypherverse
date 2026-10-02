import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { $Enums } from "../generated/prisma/client.js";
import { CYPHERVERSE_LANDMARKS } from "../data/cypherVerseLandmarks.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const DRY_RUN = process.env.APPLY_CITY_LANDMARKS !== "true";

function toProductionCoordinate(value: number): number {
  return (value + 75) * 16;
}

async function main() {
  console.log(
    DRY_RUN
      ? "CITY_LANDMARK assignment DRY RUN — NO DATABASE CHANGES"
      : "CITY_LANDMARK assignment APPLY MODE",
  );

  console.log(`Configured landmarks: ${CYPHERVERSE_LANDMARKS.length}`);

  if (CYPHERVERSE_LANDMARKS.length !== 45) {
    throw new Error(
      `Expected exactly 45 landmarks, found ${CYPHERVERSE_LANDMARKS.length}`,
    );
  }

  const mappings = [];

  for (const landmark of CYPHERVERSE_LANDMARKS) {
    const productionX = toProductionCoordinate(landmark.x);
    const productionY = toProductionCoordinate(landmark.y);

    const parcels = await prisma.parcel.findMany({
      where: {
        x: productionX,
        y: productionY,
      },
      select: {
        id: true,
        estateId: true,
        x: true,
        y: true,
        name: true,
        type: true,
        status: true,
        ownerId: true,
        price: true,
      },
    });

    if (parcels.length !== 1) {
      throw new Error(
        `${landmark.name}: expected exactly 1 parcel at ` +
          `(${productionX},${productionY}), found ${parcels.length}`,
      );
    }

    const parcel = parcels[0];

    if (
      parcel.estateId === "1" ||
      parcel.estateId === "11325"
    ) {
      throw new Error(
        `${landmark.name} resolves to protected Estate ${parcel.estateId}`,
      );
    }

    if (parcel.ownerId !== null) {
      throw new Error(
        `${landmark.name} resolves to owned parcel ` +
          `${parcel.id} with owner ${parcel.ownerId}`,
      );
    }

    if (parcel.status !== "available") {
      throw new Error(
        `${landmark.name} resolves to parcel ${parcel.id} ` +
          `with status ${parcel.status}`,
      );
    }

    if (parcel.price !== null) {
      throw new Error(
        `${landmark.name} resolves to parcel ${parcel.id} ` +
          `with price ${parcel.price}`,
      );
    }

    if (
      landmark.x === 0 &&
      landmark.y === 0
    ) {
      if (parcel.estateId !== "11326") {
        throw new Error(
          `Genesis must resolve to Estate 11326, found Estate ${parcel.estateId}`,
        );
      }

      if (
        parcel.id !==
        "75e005dc-7245-4862-a004-51979ca3b988"
      ) {
        throw new Error(
          `Genesis must resolve to the known Estate 11326 parcel ID`,
        );
      }
    }

    mappings.push({
      landmark: landmark.name,
      logical: `(${landmark.x},${landmark.y})`,
      production: `(${productionX},${productionY})`,
      estateId: parcel.estateId,
      parcelId: parcel.id,
      currentType: parcel.type,
      currentStatus: parcel.status,
    });
  }

  console.table(mappings);

  if (DRY_RUN) {
    console.log("");
    console.log(
      "DRY RUN PASSED: all 45 landmarks map to exactly one safe production parcel.",
    );
    console.log(
      "No database changes were made.",
    );
    console.log("");
    console.log(
      "To apply the assignment after reviewing the mapping:",
    );
    console.log(
      "$env:APPLY_CITY_LANDMARKS='true'; npx tsx server/prisma/assignCityLandmarks.ts",
    );
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const landmark of CYPHERVERSE_LANDMARKS) {
      const productionX = toProductionCoordinate(landmark.x);
      const productionY = toProductionCoordinate(landmark.y);

      const parcels = await tx.parcel.findMany({
        where: {
          x: productionX,
          y: productionY,
        },
        select: {
          id: true,
          estateId: true,
          status: true,
          ownerId: true,
          price: true,
        },
      });

      if (parcels.length !== 1) {
        throw new Error(
          `${landmark.name}: expected exactly one parcel during apply`,
        );
      }

      const parcel = parcels[0];

      if (
        parcel.estateId === "1" ||
        parcel.estateId === "11325"
      ) {
        throw new Error(
          `Protected Estate ${parcel.estateId} encountered during apply`,
        );
      }

      if (parcel.ownerId !== null) {
        throw new Error(
          `${landmark.name}: parcel is owned during apply`,
        );
      }

      if (parcel.status !== "available") {
        throw new Error(
          `${landmark.name}: parcel is not available during apply`,
        );
      }

      if (parcel.price !== null) {
        throw new Error(
          `${landmark.name}: parcel has a price during apply`,
        );
      }

      await tx.parcel.update({
        where: {
          id: parcel.id,
        },
        data: {
          type: $Enums.ParcelType.CITY_LANDMARK,
          status: "owned",
          ownerId: null,
          price: null,
          name: landmark.name,
          description: landmark.description,
        },
      });
    }
  });

  const landmarkCount = await prisma.parcel.count({
    where: {
      type: $Enums.ParcelType.CITY_LANDMARK,
    },
  });

  if (landmarkCount !== 45) {
    throw new Error(
      `Post-apply verification failed: expected 45 CITY_LANDMARK parcels, found ${landmarkCount}`,
    );
  }

  console.log("");
  console.log(
    "SUCCESS: exactly 45 CITY_LANDMARK parcels are now assigned.",
  );
}

main()
  .catch((error) => {
    console.error("");
    console.error("CITY_LANDMARK assignment failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
