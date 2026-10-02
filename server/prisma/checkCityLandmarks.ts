import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { $Enums } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  console.log("CITY_LANDMARK DATABASE VERIFICATION");
  console.log("===================================");
  console.log("");

  const landmarks = await prisma.parcel.findMany({
    where: {
      type: $Enums.ParcelType.CITY_LANDMARK,
    },
    orderBy: [
      { y: "desc" },
      { x: "asc" },
    ],
    select: {
      id: true,
      estateId: true,
      x: true,
      y: true,
      name: true,
      description: true,
      type: true,
      status: true,
      ownerId: true,
      price: true,
    },
  });

  console.log(`Total CITY_LANDMARK parcels: ${landmarks.length}`);
  console.log("");

  if (landmarks.length !== 45) {
    throw new Error(
      `Expected exactly 45 CITY_LANDMARK parcels, found ${landmarks.length}`,
    );
  }

  let failures = 0;

  for (const [index, landmark] of landmarks.entries()) {
    const problems: string[] = [];

    if (landmark.type !== $Enums.ParcelType.CITY_LANDMARK) {
      problems.push(`type=${landmark.type}`);
    }

    if (landmark.status !== "owned") {
      problems.push(`status=${landmark.status}`);
    }

    if (landmark.ownerId !== null) {
      problems.push(`ownerId=${landmark.ownerId}`);
    }

    if (landmark.price !== null) {
      problems.push(`price=${landmark.price}`);
    }

    if (!landmark.name) {
      problems.push("missing name");
    }

    if (!landmark.description) {
      problems.push("missing description");
    }

    const result = problems.length === 0 ? "OK" : "FAIL";

    if (problems.length > 0) {
      failures++;
    }

    console.log(
      `${String(index + 1).padStart(2, "0")}. ` +
        `${landmark.name ?? "(unnamed)"} | ` +
        `estateId=${landmark.estateId} | ` +
        `coords=(${landmark.x},${landmark.y}) | ` +
        `${result}` +
        (problems.length > 0
          ? ` | ${problems.join(", ")}`
          : ""),
    );
  }

  console.log("");
  console.log("===================================");

  if (failures > 0) {
    throw new Error(
      `Verification failed: ${failures} CITY_LANDMARK parcel(s) have invalid persisted state.`,
    );
  }

  console.log("VERIFICATION PASSED");
  console.log("");
  console.log("All 45 CITY_LANDMARK parcels:");
  console.log("- have type CITY_LANDMARK");
  console.log("- have status owned");
  console.log("- have no owner");
  console.log("- have no price");
  console.log("- have a name");
  console.log("- have a description");
}

main()
  .catch((error) => {
    console.error("");
    console.error("CITY_LANDMARK verification failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
