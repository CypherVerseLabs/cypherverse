import "dotenv/config";

import { prisma } from "../lib/prisma.js";
import {
  PARCEL_SIZE,
  CURRENT_WORLD_SIZE,
} from "../../shared/world/CypherVerseWorldLayout.js";
import { generateParcelCoordinates } from "./generateParcelCoordinates.js";
import { getParcelInfrastructureReservation } from "./parcelInfrastructure.js";

const BATCH_SIZE = 1000;

// Required by the existing assignCityLandmarks.ts safeguards.
const LANDMARK_GENESIS = {
  x: 1200,
  y: 1200,
  estateId: "11326",
  id: "75e005dc-7245-4862-a004-51979ca3b988",
} as const;

const WORLD_GENESIS = { x: 2400, y: 2400 } as const;

const EXPECTED_COUNT =
  (CURRENT_WORLD_SIZE / PARCEL_SIZE) ** 2;

function key(x: number, y: number): string {
  return `${x},${y}`;
}

async function main() {
  console.log("CYPHERVERSE PARCEL GRID SEEDER");
  console.log(`Expected grid parcels: ${EXPECTED_COUNT}`);

  const coordinates = generateParcelCoordinates();

  if (coordinates.length !== EXPECTED_COUNT) {
    throw new Error(
      `Coordinate generator returned ${coordinates.length}; expected ${EXPECTED_COUNT}.`,
    );
  }

  // Load the landmark definitions once and index them by world coordinates.
  const landmarksModule = await import(
    "../data/cypherVerseLandmarks.js"
  );

  const landmarksByCoordinate = new Map(
    landmarksModule.CYPHERVERSE_LANDMARKS.map((landmark) => [
      key(
        (landmark.x + 75) * PARCEL_SIZE,
        (landmark.y + 75) * PARCEL_SIZE,
      ),
      landmark,
    ]),
  );

  // Construct the expected grid without writing to the database.
  const expected = coordinates.map(({ x, y }) => {
    const infrastructure =
      getParcelInfrastructureReservation(x, y);

    const landmark = landmarksByCoordinate.get(key(x, y));

    const isLandmark = landmark !== undefined;

    const isLandmarkGenesis =
      x === LANDMARK_GENESIS.x &&
      y === LANDMARK_GENESIS.y;

    return {
      x,
      y,

      estateId: isLandmarkGenesis
        ? LANDMARK_GENESIS.estateId
        : landmark
          ? landmark.estateId
          : `cv-grid-${x}-${y}`,

      id: isLandmarkGenesis
        ? LANDMARK_GENESIS.id
        : undefined,

      status: infrastructure.reserved && !isLandmark
        ? ("reserved" as const)
        : ("available" as const),

      type: landmark
        ? landmark.type
        : ("STANDARD" as const),

      name: landmark?.name ?? null,

      description: landmark?.description ?? null,
    };
  });

  // Verify World Genesis remains infrastructure-reserved.
  const worldGenesis = expected.find(
    (parcel) =>
      parcel.x === WORLD_GENESIS.x &&
      parcel.y === WORLD_GENESIS.y,
  );

  if (!worldGenesis || worldGenesis.status !== "reserved") {
    throw new Error(
      "World Genesis (2400,2400) must be reserved by infrastructure rules.",
    );
  }

  // Verify the protected Landmark Genesis identity and metadata.
  const landmarkGenesis = expected.find(
    (parcel) =>
      parcel.x === LANDMARK_GENESIS.x &&
      parcel.y === LANDMARK_GENESIS.y,
  );

  if (
    !landmarkGenesis ||
    landmarkGenesis.estateId !== LANDMARK_GENESIS.estateId ||
    landmarkGenesis.id !== LANDMARK_GENESIS.id ||
    landmarkGenesis.status !== "available" ||
    landmarkGenesis.type !== "CITY_LANDMARK" ||
    landmarkGenesis.name !== "Genesis"
  ) {
    throw new Error(
      "Landmark Genesis failed identity, type, name, or status validation.",
    );
  }

  console.log("World Genesis reservation verified.");
  console.log("Landmark Genesis identity verified.");

  // Preflight every existing record. Never overwrite existing state.
  const existing = await prisma.parcel.findMany({
    select: {
      id: true,
      estateId: true,
      x: true,
      y: true,
      status: true,
      type: true,
      ownerId: true,
      price: true,
      name: true,
      description: true,
    },
  });

  const expectedByCoordinate = new Map(
    expected.map((parcel) => [
      key(parcel.x, parcel.y),
      parcel,
    ]),
  );

  const seenCoordinates = new Set<string>();
  const seenEstates = new Set<string>();

  for (const parcel of existing) {
    const coordinateKey = key(parcel.x, parcel.y);

    const target = expectedByCoordinate.get(coordinateKey);

    if (seenCoordinates.has(coordinateKey)) {
      throw new Error(
        `Duplicate existing parcel coordinates: (${parcel.x},${parcel.y}). No writes performed.`,
      );
    }

    seenCoordinates.add(coordinateKey);

    if (seenEstates.has(parcel.estateId)) {
      throw new Error(
        `Duplicate existing estateId ${parcel.estateId}. No writes performed.`,
      );
    }

    seenEstates.add(parcel.estateId);

    if (!target || target.estateId !== parcel.estateId) {
      throw new Error(
        `Existing parcel conflicts with generated grid: estate=${parcel.estateId}, coordinate=(${parcel.x},${parcel.y}). No writes performed.`,
      );
    }

    if (
      parcel.status !== target.status ||
      parcel.type !== target.type ||
      parcel.ownerId !== null ||
      parcel.price !== null
    ) {
      throw new Error(
        `Existing parcel ${parcel.estateId} has conflicting status, type, ownership, or price. No writes performed.`,
      );
    }

    if (target.id && parcel.id !== target.id) {
      throw new Error(
        `Landmark Genesis has unexpected parcel ID ${parcel.id}; expected ${target.id}. No writes performed.`,
      );
    }

    if (
      parcel.name !== target.name ||
      parcel.description !== target.description
    ) {
      throw new Error(
        `Existing parcel ${parcel.estateId} has conflicting name or description. No writes performed.`,
      );
    }
  }

  // Protect the Genesis estate ID from use at another coordinate.
  const conflictingEstate = await prisma.parcel.findUnique({
    where: {
      estateId: LANDMARK_GENESIS.estateId,
    },
    select: {
      id: true,
      x: true,
      y: true,
    },
  });

  if (
    conflictingEstate &&
    (
      conflictingEstate.x !== LANDMARK_GENESIS.x ||
      conflictingEstate.y !== LANDMARK_GENESIS.y ||
      conflictingEstate.id !== LANDMARK_GENESIS.id
    )
  ) {
    throw new Error(
      `Protected Genesis estate ${LANDMARK_GENESIS.estateId} conflicts with its required coordinate or ID.`,
    );
  }

  // Identify missing parcels without modifying existing records.
  const missing = expected.filter(
    (parcel) =>
      !seenCoordinates.has(key(parcel.x, parcel.y)),
  );

  console.log(`Existing compatible parcels: ${existing.length}`);
  console.log(`Parcels to create: ${missing.length}`);

  if (missing.length === 0) {
    if (existing.length !== EXPECTED_COUNT) {
      throw new Error(
        `Grid inventory is incomplete or inconsistent: ${existing.length}; expected ${EXPECTED_COUNT}.`,
      );
    }

    console.log(
      "Grid already exists and passed preflight.",
    );

    return;
  }

  // Insert missing parcels in batches.
  // If a batch fails, inspect the partial inventory before rerunning.
  for (
    let offset = 0;
    offset < missing.length;
    offset += BATCH_SIZE
  ) {
    const batch = missing.slice(
      offset,
      offset + BATCH_SIZE,
    );

    await prisma.parcel.createMany({
      data: batch.map((parcel) => ({
        ...(parcel.id ? { id: parcel.id } : {}),

        estateId: parcel.estateId,
        x: parcel.x,
        y: parcel.y,

        status: parcel.status,
        type: parcel.type,

        ownerId: null,
        price: null,

        name: parcel.name,
        description: parcel.description,

        blockchainAddress: null,
        tokenId: null,
      })),
    });

    console.log(
      `Inserted ${Math.min(
        offset + batch.length,
        missing.length,
      )} / ${missing.length} missing parcels`,
    );
  }

  // Verify final grid count.
  const finalCount = await prisma.parcel.count();

  if (finalCount !== EXPECTED_COUNT) {
    throw new Error(
      `Final parcel count is ${finalCount}; expected ${EXPECTED_COUNT}. Run the audit before proceeding.`,
    );
  }

  // Verify both Genesis records after insertion.
  const finalGenesisRecords = await prisma.parcel.findMany({
    where: {
      OR: [
        {
          x: LANDMARK_GENESIS.x,
          y: LANDMARK_GENESIS.y,
        },
        {
          x: WORLD_GENESIS.x,
          y: WORLD_GENESIS.y,
        },
      ],
    },
    select: {
      id: true,
      estateId: true,
      x: true,
      y: true,
      status: true,
      type: true,
      name: true,
      description: true,
    },
  });

  const finalLandmarkGenesis = finalGenesisRecords.find(
    (parcel) =>
      parcel.x === LANDMARK_GENESIS.x &&
      parcel.y === LANDMARK_GENESIS.y,
  );

  const finalWorldGenesis = finalGenesisRecords.find(
    (parcel) =>
      parcel.x === WORLD_GENESIS.x &&
      parcel.y === WORLD_GENESIS.y,
  );

  if (
    !finalLandmarkGenesis ||
    finalLandmarkGenesis.id !== LANDMARK_GENESIS.id ||
    finalLandmarkGenesis.estateId !== LANDMARK_GENESIS.estateId ||
    finalLandmarkGenesis.status !== "available" ||
    finalLandmarkGenesis.type !== "CITY_LANDMARK" ||
    finalLandmarkGenesis.name !== "Genesis"
  ) {
    throw new Error(
      "Post-seed Landmark Genesis verification failed.",
    );
  }

  if (
    !finalWorldGenesis ||
    finalWorldGenesis.status !== "reserved"
  ) {
    throw new Error(
      "Post-seed World Genesis reservation verification failed.",
    );
  }

  console.log("");
  console.log(
    `SUCCESS: ${finalCount} parcels in the database.`,
  );
  console.log("Landmark Genesis:", finalLandmarkGenesis);
  console.log("World Genesis:", finalWorldGenesis);
}

main()
  .catch((error) => {
    console.error("Parcel grid seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });