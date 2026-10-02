import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const ESTATE_1_EXPECTED_X = 0;
const ESTATE_1_EXPECTED_Y = 0;

const REPLACEMENT_PARCEL_ID =
  "f06c3ef4-711c-43ef-b3d4-6670a2d56ca1";

const REPLACEMENT_X = 1184;
const REPLACEMENT_Y = 1200;

const GENESIS_X = 1200;
const GENESIS_Y = 1200;

const dryRun = !process.argv.includes("--execute");

async function main() {
  console.log("");
  console.log("=================================================");
  console.log(" CypherVerse Estate 1 Reassignment");
  console.log("=================================================");
  console.log("");

  if (dryRun) {
    console.log("MODE: DRY RUN");
    console.log("NO DATABASE WRITES WILL BE PERFORMED.");
  } else {
    console.log("MODE: EXECUTE");
    console.log("DATABASE WRITES ARE ENABLED.");
  }

  console.log("");

  /*
   * -------------------------------------------------------
   * Locate Estate 1
   * -------------------------------------------------------
   *
   * We intentionally identify Estate 1 by its existing
   * parcel identity rather than changing or recreating it.
   */

  const estate1 = await prisma.parcel.findFirst({
    where: {
      estateId: "1",
    },
  });

  if (!estate1) {
    throw new Error("Estate 1 parcel was not found.");
  }

  if (
    estate1.x !== ESTATE_1_EXPECTED_X ||
    estate1.y !== ESTATE_1_EXPECTED_Y
  ) {
    throw new Error(
      `Estate 1 coordinate mismatch. Expected (0,0), found (${estate1.x},${estate1.y}).`,
    );
  }

  if (!estate1.ownerId) {
    throw new Error(
      "Estate 1 has no ownerId. Refusing to perform reassignment.",
    );
  }

  console.log("Estate 1:");
  console.log(`  Parcel ID: ${estate1.id}`);
  console.log(`  Coordinates: (${estate1.x}, ${estate1.y})`);
  console.log(`  Owner ID: ${estate1.ownerId}`);
  console.log("");

  /*
   * -------------------------------------------------------
   * Locate replacement parcel
   * -------------------------------------------------------
   */

  const replacement = await prisma.parcel.findUnique({
    where: {
      id: REPLACEMENT_PARCEL_ID,
    },
  });

  if (!replacement) {
    throw new Error(
      `Replacement parcel ${REPLACEMENT_PARCEL_ID} was not found.`,
    );
  }

  if (
    replacement.x !== REPLACEMENT_X ||
    replacement.y !== REPLACEMENT_Y
  ) {
    throw new Error(
      `Replacement coordinate mismatch. Expected (${REPLACEMENT_X},${REPLACEMENT_Y}), found (${replacement.x},${replacement.y}).`,
    );
  }

  if (replacement.ownerId) {
    throw new Error(
      `Replacement parcel already has ownerId=${replacement.ownerId}. Refusing to overwrite ownership.`,
    );
  }

  if (replacement.type !== "STANDARD") {
    throw new Error(
      `Replacement parcel is not STANDARD. Found type=${replacement.type}.`,
    );
  }

  console.log("Replacement parcel:");
  console.log(`  Parcel ID: ${replacement.id}`);
  console.log(`  Coordinates: (${replacement.x}, ${replacement.y})`);
  console.log(`  Name: ${replacement.name ?? "N/A"}`);
  console.log(`  Type: ${replacement.type}`);
  console.log(`  Owner ID: ${replacement.ownerId ?? "NULL"}`);
  console.log("");

  /*
   * -------------------------------------------------------
   * Verify Genesis remains separate
   * -------------------------------------------------------
   */

  const genesisParcels = await prisma.parcel.findMany({
    where: {
      x: GENESIS_X,
      y: GENESIS_Y,
    },
    select: {
      id: true,
      estateId: true,
      x: true,
      y: true,
      ownerId: true,
      type: true,
    },
  });

  console.log("Genesis coordinate:");
  console.log(`  Production coordinate: (${GENESIS_X}, ${GENESIS_Y})`);
  console.log(`  Existing rows: ${genesisParcels.length}`);
  console.log("");

  /*
   * -------------------------------------------------------
   * Verify replacement has no dependent records
   * -------------------------------------------------------
   *
   * These relation names should match the existing Prisma
   * schema. If one does not exist in your generated client,
   * stop and inspect the schema rather than weakening this
   * safety check.
   */

  const [
    listings,
    reservations,
    ownershipHistory,
  ] = await Promise.all([
    prisma.parcelListing.findMany({

      where: {
        parcelId: replacement.id,
      },
      select: {
        id: true,
      },
    }),

    prisma.parcelReservation.findMany({
      where: {
        parcelId: replacement.id,
      },
      select: {
        id: true,
      },
    }),

    prisma.parcelOwnershipHistory.findMany({
      where: {
        parcelId: replacement.id,
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (listings.length > 0) {
    throw new Error(
      `Replacement parcel has ${listings.length} marketplace listing(s).`,
    );
  }

  if (reservations.length > 0) {
    throw new Error(
      `Replacement parcel has ${reservations.length} reservation(s).`,
    );
  }

  if (ownershipHistory.length > 0) {
    throw new Error(
      `Replacement parcel has ${ownershipHistory.length} ownership-history record(s).`,
    );
  }

  console.log("Replacement dependency checks:");
  console.log("  Marketplace listings: 0");
  console.log("  Reservations: 0");
  console.log("  Ownership history: 0");
  console.log("");

  /*
   * -------------------------------------------------------
   * Dry-run boundary
   * -------------------------------------------------------
   */

  console.log("PROPOSED CHANGE:");
  console.log(
    `  Owner ${estate1.ownerId} will become owner of parcel ${replacement.id}.`,
  );
  console.log(
    `  Estate 1 historical parcel ${estate1.id} will NOT be deleted.`,
  );
  console.log(
    `  Genesis (${GENESIS_X}, ${GENESIS_Y}) will NOT be modified.`,
  );
  console.log("");

  if (dryRun) {
    console.log("=================================================");
    console.log(" DRY RUN COMPLETE");
    console.log(" NO DATABASE CHANGES WERE MADE.");
    console.log("=================================================");
    return;
  }

  /*
   * -------------------------------------------------------
   * Execute atomic reassignment
   * -------------------------------------------------------
   */

  const result = await prisma.$transaction(async (tx) => {
    /*
     * Re-read both records inside the transaction.
     *
     * This protects against someone changing the state
     * between our initial validation and the write.
     */

    const currentEstate1 = await tx.parcel.findFirst({
      where: {
        estateId: "1",

      },
    });

    if (!currentEstate1) {
      throw new Error("Estate 1 disappeared before migration.");
    }

    if (
      currentEstate1.x !== ESTATE_1_EXPECTED_X ||
      currentEstate1.y !== ESTATE_1_EXPECTED_Y
    ) {
      throw new Error(
        `Estate 1 changed before migration: (${currentEstate1.x},${currentEstate1.y}).`,
      );
    }

    if (currentEstate1.ownerId !== estate1.ownerId) {
      throw new Error(
        "Estate 1 owner changed after validation. Migration aborted.",
      );
    }

    const currentReplacement = await tx.parcel.findUnique({
      where: {
        id: REPLACEMENT_PARCEL_ID,
      },
    });

    if (!currentReplacement) {
      throw new Error("Replacement parcel disappeared before migration.");
    }

    if (
      currentReplacement.x !== REPLACEMENT_X ||
      currentReplacement.y !== REPLACEMENT_Y
    ) {
      throw new Error(
        "Replacement parcel coordinates changed. Migration aborted.",
      );
    }

    if (currentReplacement.ownerId) {
      throw new Error(
        "Replacement parcel was claimed before migration. Migration aborted.",
      );
    }

    if (currentReplacement.type !== "STANDARD") {
      throw new Error(
        "Replacement parcel is no longer STANDARD. Migration aborted.",
      );
    }

    /*
     * Assign active ownership to Estate 11325.
     *
     * Estate 1 itself is deliberately left untouched.
     */

    const updatedParcel = await tx.parcel.update({
      where: {
        id: currentReplacement.id,
      },
      data: {
        ownerId: currentEstate1.ownerId,
      },
    });

    /*
     * Record the administrative transfer.
     *
     * Use the source enum/value already defined by the
     * repository's ownership-history schema.
     */

    const history = await tx.parcelOwnershipHistory.create({
      data: {
        parcelId: currentReplacement.id,
        previousOwnerId: null,
        newOwnerId: currentEstate1.ownerId,
        source: "ESTATE_1_MIGRATION",
      },
    });

    return {
      updatedParcel,
      history,
    };
  });

  console.log("");
  console.log("=================================================");
  console.log(" MIGRATION COMPLETE");
  console.log("=================================================");
  console.log("");
  console.log(`Replacement parcel: ${result.updatedParcel.id}`);
  console.log(`New owner: ${result.updatedParcel.ownerId}`);
  console.log(`History record: ${result.history.id}`);
  console.log("");
  console.log("Estate 1 was preserved.");
  console.log("Genesis was not modified.");
}

main()
  .catch((error) => {
    console.error("");
    console.error("ESTATE 1 MIGRATION FAILED");
    console.error("");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });