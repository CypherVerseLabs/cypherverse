import {
  $Enums,
} from "../generated/prisma/client.js";

import { prisma } from "../lib/prisma.js";

import fs from "node:fs";
import path from "node:path";


// =========================================================
// CONFIG
// =========================================================

const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000";

const TEST_SELLER_EMAIL =
  "marketplace@cypherverse.test";

const TEST_LISTINGS = [
  {
    estateId: "1",
    price: "100.00",
    name: "Genesis Marketplace Parcel",
  },

  {
    estateId: "2",
    price: "150.00",
    name: "North District Parcel",
  },

  {
    estateId: "3",
    price: "200.00",
    name: "East District Parcel",
  },
];


// =========================================================
// TYPES
// =========================================================

interface SourceParcel {
  type?: number;
  x: number;
  y: number;
  top?: number;
  owner?: string;
  estate_id: string;
  name?: string;
}

interface ParcelFile {
  ok: boolean;
  data: {
    maxSize?: string;
    [coordinate: string]: SourceParcel | string | undefined;
  };
}


// =========================================================
// LOAD PARCEL JSON
// =========================================================

function loadParcelFile(): ParcelFile {

  const filePath =
  path.resolve(
    process.cwd(),
    "data",
    "v1parcel_data.json"
  );


  console.log(
    `Loading parcel data from: ${filePath}`
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Parcel data file not found: ${filePath}`
    );
  }

  const raw =
    fs.readFileSync(
      filePath,
      "utf8"
    );

  return JSON.parse(raw) as ParcelFile;
}


// =========================================================
// MAIN
// =========================================================

async function main() {

  console.log(
    "=========================================="
  );

  console.log(
    "CypherVerse Marketplace Seed"
  );

  console.log(
    "=========================================="
  );


  // -------------------------------------------------------
  // Load JSON
  // -------------------------------------------------------

  const parcelFile =
    loadParcelFile();


  if (
    !parcelFile.ok ||
    !parcelFile.data
  ) {
    throw new Error(
      "Invalid parcel data file."
    );
  }


  // -------------------------------------------------------
  // Extract actual parcel records
  // -------------------------------------------------------

  const sourceParcels =
    Object.values(
      parcelFile.data
    ).filter(
      (
        value
      ): value is SourceParcel =>
        typeof value === "object" &&
        value !== null &&
        typeof value.x === "number" &&
        typeof value.y === "number" &&
        typeof value.estate_id === "string"
    );


  console.log(
    `Found ${sourceParcels.length} parcels in JSON.`
  );


  // -------------------------------------------------------
  // Import parcels
  // -------------------------------------------------------

  let imported = 0;


  for (
    const sourceParcel of sourceParcels
  ) {

    const sourceOwner =
      sourceParcel.owner?.toLowerCase();


    /**
     * The zero blockchain address means the parcel
     * currently has no owner.
     *
     * Existing database ownership is NOT overwritten.
     */

    const isUnowned =
      !sourceOwner ||
      sourceOwner === ZERO_ADDRESS;


    await prisma.parcel.upsert({

      where: {
        estateId:
          sourceParcel.estate_id,
      },


      update: {

        x:
          sourceParcel.x,

        y:
          sourceParcel.y,

        name:
          sourceParcel.name?.trim() ||
          `Parcel ${sourceParcel.estate_id}`,

      },


      create: {

        estateId:
          sourceParcel.estate_id,

        x:
          sourceParcel.x,

        y:
          sourceParcel.y,

        name:
          sourceParcel.name?.trim() ||
          `Parcel ${sourceParcel.estate_id}`,

        description:
          "CypherVerse parcel",

        price:
          null,

        status:
          isUnowned
            ? $Enums.ParcelStatus.available
            : $Enums.ParcelStatus.owned,

        ownerId:
          null,

      },

    });


    imported++;

    if (
      imported % 1000 === 0
    ) {
      console.log(
        `Imported ${imported}/${sourceParcels.length} parcels...`
      );
    }
  }


  console.log(
    `Imported ${imported} parcels.`
  );


  // =======================================================
  // TEST SELLER
  // =======================================================

  /**
   * This user represents the marketplace inventory seller
   * for the local TEST payment flow.
   *
   * No real payment provider is involved.
   */

  const testSeller =
    await prisma.user.upsert({

      where: {
        email:
          TEST_SELLER_EMAIL,
      },


      update: {},


      create: {

        email:
          TEST_SELLER_EMAIL,

        username:
          "CypherVerse Test Seller",

      },

    });


  console.log(
    `Test seller ready: ${testSeller.id}`
  );


  // =======================================================
// CREATE TEST MARKETPLACE INVENTORY
// =======================================================

let listingsCreated = 0;

for (const testListing of TEST_LISTINGS) {

  const parcel =
    await prisma.parcel.findUnique({
      where: {
        estateId: testListing.estateId,
      },
    });

  if (!parcel) {

    console.warn(
      `Skipping listing: estate ${testListing.estateId} was not found.`
    );

    continue;
  }


  // -----------------------------------------------------
  // IMPORTANT
  // -----------------------------------------------------
  //
  // These are marketplace inventory parcels.
  //
  // They are NOT being taken from a normal user.
  //
  // The dedicated test seller owns them until somebody
  // purchases them.
  //
  // -----------------------------------------------------

  if (
    parcel.ownerId !== null &&
    parcel.ownerId !== testSeller.id
  ) {

    console.warn(
      `Skipping estate ${testListing.estateId}: ` +
      `parcel is already owned by another user.`
    );

    continue;
  }


  // -----------------------------------------------------
  // Give marketplace inventory to the test seller.
  // -----------------------------------------------------

  await prisma.parcel.update({

    where: {
      id: parcel.id,
    },

    data: {

      ownerId:
        testSeller.id,

      status:
        $Enums.ParcelStatus.for_sale,

      price:
        testListing.price,

    },

  });


  // -----------------------------------------------------
  // Create or reactivate listing.
  // -----------------------------------------------------

  const existingListing =
    await prisma.parcelListing.findFirst({

      where: {
        parcelId:
          parcel.id,

        sellerId:
          testSeller.id,
      },

    });


  if (existingListing) {

    await prisma.parcelListing.update({

      where: {
        id:
          existingListing.id,
      },

      data: {

        price:
          testListing.price,

        active:
          true,

      },

    });

  } else {

    await prisma.parcelListing.create({

      data: {

        parcelId:
          parcel.id,

        sellerId:
          testSeller.id,

        price:
          testListing.price,

        active:
          true,

      },

    });

  }


  listingsCreated++;


  console.log(
    `FOR SALE: estate ${parcel.estateId} ` +
    `(${parcel.x}, ${parcel.y}) ` +
    `→ ${testListing.price} USD ` +
    `(seller: ${testSeller.email})`
  );

}



  // =======================================================
  // SUMMARY
  // =======================================================

  console.log("");
  console.log(
    "=========================================="
  );

  console.log(
    "SEED COMPLETE"
  );

  console.log(
    "=========================================="
  );

  console.log(
    `Parcels imported: ${imported}`
  );

  console.log(
    `Test listings active: ${listingsCreated}`
  );

  console.log(
    `Test seller: ${TEST_SELLER_EMAIL}`
  );

  console.log(
    "=========================================="
  );
}


// =========================================================
// RUN
// =========================================================

main()

  .catch(
    (error) => {

      console.error(
        "Seed failed:",
        error
      );

      process.exit(1);

    }
  )

  .finally(
    async () => {

      await prisma.$disconnect();

    }
  );
