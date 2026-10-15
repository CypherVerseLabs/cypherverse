import {
  $Enums,
} from "../generated/prisma/client.js";

import {
  prisma,
} from "../lib/prisma.js";

const PARCEL_SIZE = 16;
const GRID_SIDE = 300;
const WORLD_SIZE =
  PARCEL_SIZE * GRID_SIDE;

const EXPECTED_COUNT =
  GRID_SIDE * GRID_SIDE;

async function main() {
  console.log("");
  console.log(
    "==========================================",
  );
  console.log(
    "CYPHERVERSE PRODUCTION PARCEL AUDIT",
  );
  console.log(
    "==========================================",
  );

  const total =
    await prisma.parcel.count();

  const duplicateCoordinates =
    await prisma.$queryRaw<
      Array<{
        x: number;
        y: number;
        count: bigint;
      }>
    >`
      SELECT
        x,
        y,
        COUNT(*) AS count
      FROM "Parcel"
      GROUP BY x, y
      HAVING COUNT(*) > 1
      ORDER BY y, x
    `;

  const missingCoordinates =
    await prisma.parcel.count({
      where: {
        OR: [
          {
            x: {
              lt: 0,
            },
          },
          {
            x: {
              gt:
                WORLD_SIZE -
                PARCEL_SIZE,
            },
          },
          {
            y: {
              lt: 0,
            },
          },
          {
            y: {
              gt:
                WORLD_SIZE -
                PARCEL_SIZE,
            },
          },
        ],
      },
    });

  const nonGridAligned =
    await prisma.$queryRaw<
      Array<{ count: bigint }>
    >`
      SELECT COUNT(*) AS count
      FROM "Parcel"
      WHERE
        x % ${PARCEL_SIZE} <> 0
        OR
        y % ${PARCEL_SIZE} <> 0
    `;

  const statusCounts =
    await prisma.parcel.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    });

  const owned =
    await prisma.parcel.count({
      where: {
        status:
          $Enums.ParcelStatus.owned,
      },
    });

  const forSale =
    await prisma.parcel.count({
      where: {
        status:
          $Enums.ParcelStatus.for_sale,
      },
    });

  const reserved =
    await prisma.parcel.count({
      where: {
        status:
          $Enums.ParcelStatus.reserved,
      },
    });

  const available =
    await prisma.parcel.count({
      where: {
        status:
          $Enums.ParcelStatus.available,
      },
    });

  const priced =
    await prisma.parcel.count({
      where: {
        price: {
          not: null,
        },
      },
    });

  const owners =
    await prisma.parcel.count({
      where: {
        ownerId: {
          not: null,
        },
      },
    });

  const listings =
    await prisma.parcelListing.count();

  const projectsAttached =
    await prisma.project.count({
      where: {
        parcelId: {
          not: null,
        },
      },
    });

  const genesis =
    await prisma.parcel.findFirst({
      where: {
        x: 2400,
        y: 2400,
      },
    });

  console.log("");
  console.log(
    `Expected parcels: ${EXPECTED_COUNT}`,
  );
  console.log(
    `Actual parcels:   ${total}`,
  );

  console.log("");
  console.log(
    `Duplicate coordinates: ${duplicateCoordinates.length}`,
  );

  console.log(
    `Outside world bounds: ${missingCoordinates}`,
  );

  console.log(
  `Non-grid-aligned parcels: ${Number(
    nonGridAligned[0]?.count ?? BigInt(0),
  )}`,
);

  console.log("");
  console.log(
    `Available: ${available}`,
  );

  console.log(
    `Reserved: ${reserved}`,
  );

  console.log(
    `Owned: ${owned}`,
  );

  console.log(
    `For sale: ${forSale}`,
  );

  console.log(
    `Priced: ${priced}`,
  );

  console.log(
    `Owner assignments: ${owners}`,
  );

  console.log(
    `Marketplace listings: ${listings}`,
  );

  console.log(
    `Projects attached: ${projectsAttached}`,
  );

  console.log("");

  if (genesis) {
    console.log(
      `Genesis coordinate parcel: estate ${genesis.estateId}`,
    );

    console.log(
      `Genesis status: ${genesis.status}`,
    );
  } else {
    console.log(
      "Genesis coordinate parcel: MISSING",
    );
  }

  console.log("");

  for (const item of statusCounts) {
    console.log(
      `Status ${item.status}: ${item._count._all}`,
    );
  }

  console.log("");

  const failures: string[] = [];

  if (
    total !==
    EXPECTED_COUNT
  ) {
    failures.push(
      `Expected ${EXPECTED_COUNT} parcels, found ${total}.`,
    );
  }

  if (
    duplicateCoordinates.length !== 0
  ) {
    failures.push(
      "Duplicate Parcel coordinates detected.",
    );
  }

  if (
    missingCoordinates !== 0
  ) {
    failures.push(
      "Parcel coordinates are outside the 4800 × 4800 world.",
    );
  }

  if (
  Number(
    nonGridAligned[0]?.count ?? BigInt(0),
  ) !== 0
) {
    failures.push(
      "Non-grid-aligned Parcel coordinates detected.",
    );
  }

  if (
    owned !== 0
  ) {
    failures.push(
      "Production inventory contains owned parcels.",
    );
  }

  if (
    forSale !== 0
  ) {
    failures.push(
      "Production inventory contains for-sale parcels.",
    );
  }

  if (
    priced !== 0
  ) {
    failures.push(
      "Production inventory contains priced parcels.",
    );
  }

  if (
    owners !== 0
  ) {
    failures.push(
      "Production inventory contains owner assignments.",
    );
  }

  if (
    listings !== 0
  ) {
    failures.push(
      "Production inventory contains marketplace listings.",
    );
  }

  if (
    projectsAttached !== 0
  ) {
    failures.push(
      "Production inventory already has Project attachments.",
    );
  }

  if (
    !genesis ||
    genesis.status !==
      $Enums.ParcelStatus.reserved
  ) {
    failures.push(
      "Genesis coordinate (2400,2400) is not reserved.",
    );
  }

  console.log(
    "==========================================",
  );

  if (
    failures.length > 0
  ) {
    console.error(
      "AUDIT FAILED",
    );

    for (
      const failure of failures
    ) {
      console.error(
        `- ${failure}`,
      );
    }

    process.exit(1);
  }

  console.log(
    "AUDIT PASSED",
  );

  console.log(
    "==========================================",
  );
}

main()
  .catch((error) => {
    console.error(
      "Production Parcel audit failed:",
      error,
    );

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });