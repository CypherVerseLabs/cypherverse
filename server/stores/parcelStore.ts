import {
  Prisma,
  ParcelStatus as PrismaParcelStatus,
  ParcelType,
} from "../generated/prisma/client.js";

import { prisma } from "../lib/prisma.js";

/**
 * =========================================================
 * PARCEL STORE
 * =========================================================
 *
 * Database access for CypherVerse parcels.
 *
 * Important:
 * - Parcel ownership is controlled server-side.
 * - Clients should never be trusted to provide ownerId.
 * - Marketplace state is represented by ParcelStatus.
 * - Marketplace purchases are handled by the payment/order flow.
 * - This store does NOT expose a direct buyParcel() operation.
 */

/**
 * =========================================================
 * TYPES
 * =========================================================
 */

export type ParcelStatus = PrismaParcelStatus;

export type ParcelPrice =
  | Prisma.Decimal
  | number
  | string;

/**
 * =========================================================
 * GET PARCEL BY ID
 * =========================================================
 */

export async function getParcelById(
  parcelId: string
) {
  return prisma.parcel.findUnique({
    where: {
      id: parcelId,
    },

    include: {
      owner: {
        select: {
          id: true,
          address: true,
          username: true,
        },
      },

      listings: {
        where: {
          active: true,
        },

        orderBy: {
          createdAt: "desc",
        },

        include: {
          seller: {
            select: {
              id: true,
              address: true,
              username: true,
            },
          },
        },
      },

      project: {
        select: {
          id: true,
          name: true,
          description: true,
          template: true,
          slug: true,
          publishedAt: true,
        },
      },
    },
  });
}

/**
 * =========================================================
 * GET PARCEL BY ESTATE ID
 * =========================================================
 *
 * estateId represents the static/world identity of a parcel.
 */

export async function getParcelByEstateId(
  estateId: string
) {
  return prisma.parcel.findUnique({
    where: {
      estateId,
    },

    include: {
      owner: {
        select: {
          id: true,
          address: true,
          username: true,
        },
      },

      listings: {
        where: {
          active: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      },

      project: {
        select: {
          id: true,
          name: true,
          description: true,
          template: true,
          slug: true,
          publishedAt: true,
        },
      },
    },
  });
}

/**
 * =========================================================
 * GET PARCELS
 * =========================================================
 *
 * Used by the parcel/world browser.
 *
 * Optional filters:
 * - status
 * - coordinates
 */

export async function getParcels(options?: {
  status?: ParcelStatus;
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
}) {
  const where: Prisma.ParcelWhereInput = {};

if (options?.status !== undefined) {
  where.status = options.status;
}

if (
  options?.minX !== undefined ||
  options?.maxX !== undefined
) {
  where.x = {};

  if (options.minX !== undefined) {
    where.x.gte = options.minX;
  }

  if (options.maxX !== undefined) {
    where.x.lte = options.maxX;
  }
}

if (
  options?.minY !== undefined ||
  options?.maxY !== undefined
) {
  where.y = {};

  if (options.minY !== undefined) {
    where.y.gte = options.minY;
  }

  if (options.maxY !== undefined) {
    where.y.lte = options.maxY;
  }
}


  return prisma.parcel.findMany({
    where,

    orderBy: [
      {
        y: "asc",
      },
      {
        x: "asc",
      },
    ],

    /**
     * =====================================================
     * WORLD PAYLOAD
     * =====================================================
     *
     * Keep this query lightweight.
     *
     * Do NOT include owner/listings/project here.
     */

    select: {
      id: true,
      estateId: true,
      x: true,
      y: true,
      status: true,
      ownerId: true,
      price: true,
      name: true,
    },
  });
}

/**
 * =========================================================
 * GET AVAILABLE PARCELS
 * =========================================================
 */

export async function getAvailableParcels() {
  return getParcels({
    status: PrismaParcelStatus.available,
  });
}

/**
 * =========================================================
 * GET PARCELS FOR SALE
 * =========================================================
 */

export async function getParcelsForSale() {
  return getParcels({
    status: PrismaParcelStatus.for_sale,
  });
}

/**
 * =========================================================
 * CREATE PARCEL
 * =========================================================
 *
 * Used to seed the purchasable world parcels.
 *
 * estateId must be unique.
 */

export async function createParcel(data: {
  estateId: string;
  x: number;
  y: number;
  status?: ParcelStatus;
  ownerId?: string | null;
  price?: ParcelPrice | null;
  name?: string | null;
  description?: string | null;
  blockchainAddress?: string | null;
  tokenId?: string | null;
}) {
  return prisma.parcel.create({
    data: {
      estateId: data.estateId,

      x: data.x,
      y: data.y,

      status:
        data.status ??
        PrismaParcelStatus.available,

      ownerId:
        data.ownerId ?? null,

      price:
        data.price !== undefined &&
        data.price !== null
          ? new Prisma.Decimal(data.price)
          : null,

      name:
        data.name ?? null,

      description:
        data.description ?? null,

      blockchainAddress:
        data.blockchainAddress ?? null,

      tokenId:
        data.tokenId ?? null,
    },
  });
}

/**
 * =========================================================
 * UPDATE PARCEL
 * =========================================================
 *
 * IMPORTANT:
 * ownerId is intentionally NOT accepted here.
 *
 * Ownership changes must happen through an explicit
 * server-side ownership flow so that authorization,
 * payment/order validation, and ownership history cannot
 * be bypassed.
 */

export async function updateParcel(
  parcelId: string,
  data: {
    status?: ParcelStatus;
    price?: ParcelPrice | null;
    name?: string | null;
    description?: string | null;
    blockchainAddress?: string | null;
    tokenId?: string | null;
  }
) {
  const existing =
    await prisma.parcel.findUnique({
      where: {
        id: parcelId,
      },
    });

  if (!existing) {
    return null;
  }

  return prisma.parcel.update({
    where: {
      id: parcelId,
    },

    data: {
      ...(data.status !== undefined
        ? {
            status: data.status,
          }
        : {}),

      ...(data.price !== undefined
        ? {
            price:
              data.price === null
                ? null
                : new Prisma.Decimal(
                    data.price
                  ),
          }
        : {}),

      ...(data.name !== undefined
        ? {
            name: data.name,
          }
        : {}),

      ...(data.description !== undefined
        ? {
            description: data.description,
          }
        : {}),

      ...(data.blockchainAddress !== undefined
        ? {
            blockchainAddress:
              data.blockchainAddress,
          }
        : {}),

      ...(data.tokenId !== undefined
        ? {
            tokenId: data.tokenId,
          }
        : {}),
    },
  });
}

/**
 * =========================================================
 * GET USER-OWNED PARCELS
 * =========================================================
 */

export async function getParcelsByOwnerId(
  ownerId: string
) {
  return prisma.parcel.findMany({
    where: {
      ownerId,
    },

    orderBy: [
      {
        y: "asc",
      },
      {
        x: "asc",
      },
    ],

    include: {
      listings: {
        where: {
          active: true,
        },
      },

      project: {
        select: {
          id: true,
          name: true,
          description: true,
          template: true,
          slug: true,
          publishedAt: true,
        },
      },
    },
  });
}

/**
 * =========================================================
 * CLAIM AVAILABLE PARCEL
 * =========================================================
 *
 * Transfers an available parcel to a user.
 *
 * This uses a transaction and verifies the parcel is still
 * available before assigning ownership.
 *
 * NOTE:
 * This is NOT a marketplace purchase.
 *
 * If the application requires ParcelOwnershipHistory for
 * claims as well, the history record should be created in
 * the same transaction here.
 */

export async function claimParcel(
  parcelId: string,
  userId: string
) {
  return prisma.$transaction(
    async (tx) => {
      const parcel =
        await tx.parcel.findUnique({
          where: {
            id: parcelId,
          },
        });

      if (!parcel) {
        return null;
      }

      if (
        parcel.status !==
        PrismaParcelStatus.available
      ) {
        throw new Error(
          "PARCEL_NOT_AVAILABLE"
        );
      }

      return tx.parcel.update({
        where: {
          id: parcelId,
        },

        data: {
          ownerId: userId,

          status:
            PrismaParcelStatus.owned,

          price: null,
        },
      });
    }
  );
}

/**
 * =========================================================
 * LIST PARCEL FOR SALE
 * =========================================================
 *
 * Creates a marketplace listing for an owned parcel.
 *
 * CITY_LANDMARK parcels can NEVER be listed for sale.
 */

export async function createParcelListing(
  parcelId: string,
  sellerId: string,
  price: ParcelPrice
) {
  const decimalPrice =
    new Prisma.Decimal(price);

  if (
    !decimalPrice.isFinite() ||
    decimalPrice.lte(0)
  ) {
    throw new Error(
      "INVALID_PARCEL_PRICE"
    );
  }

  return prisma.$transaction(
    async (tx) => {
      const parcel =
        await tx.parcel.findUnique({
          where: {
            id: parcelId,
          },
        });

      if (!parcel) {
        return null;
      }

      /**
       * CITY LANDMARKS ARE NEVER LISTABLE.
       */

      if (
        parcel.type ===
        ParcelType.CITY_LANDMARK
      ) {
        throw new Error(
          "CITY_LANDMARK_NOT_FOR_SALE"
        );
      }

      if (
        parcel.status !==
        PrismaParcelStatus.owned
      ) {
        throw new Error(
          "PARCEL_NOT_LISTABLE"
        );
      }

      if (
        parcel.ownerId !== sellerId
      ) {
        throw new Error(
          "PARCEL_NOT_OWNED"
        );
      }

      /**
       * Deactivate any previous active
       * listings for this parcel.
       */

      await tx.parcelListing.updateMany({
        where: {
          parcelId,
          active: true,
        },

        data: {
          active: false,
        },
      });

      /**
       * Create the new listing.
       */

      const listing =
        await tx.parcelListing.create({
          data: {
            parcelId,
            sellerId,
            price: decimalPrice,
            active: true,
          },
        });

      /**
       * The parcel itself must also reflect
       * that it is currently for sale.
       */

      await tx.parcel.update({
        where: {
          id: parcelId,
        },

        data: {
          status:
            PrismaParcelStatus.for_sale,

          price: decimalPrice,
        },
      });

      return listing;
    }
  );
}

/**
 * =========================================================
 * CANCEL PARCEL LISTING
 * =========================================================
 */

export async function cancelParcelListing(
  listingId: string,
  sellerId: string
) {
  return prisma.$transaction(
    async (tx) => {
      const listing =
        await tx.parcelListing.findUnique({
          where: {
            id: listingId,
          },
        });

      if (!listing) {
        return null;
      }

      if (
        listing.sellerId !== sellerId
      ) {
        throw new Error(
          "LISTING_NOT_OWNED"
        );
      }

      if (!listing.active) {
        return listing;
      }

      const updated =
        await tx.parcelListing.update({
          where: {
            id: listingId,
          },

          data: {
            active: false,
          },
        });

      await tx.parcel.update({
        where: {
          id: listing.parcelId,
        },

        data: {
          status:
            PrismaParcelStatus.owned,

          price: null,
        },
      });

      return updated;
    }
  );
}

/**
 * =========================================================
 * GET ACTIVE LISTINGS
 * =========================================================
 */

export async function getActiveParcelListings() {
  return prisma.parcelListing.findMany({
    where: {
      active: true,

      parcel: {
        status:
          PrismaParcelStatus.for_sale,

        type: {
          not: ParcelType.CITY_LANDMARK,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    include: {
      parcel: {
        include: {
          owner: {
            select: {
              id: true,
              address: true,
              username: true,
            },
          },
        },
      },

      seller: {
        select: {
          id: true,
          address: true,
          username: true,
        },
      },
    },
  });
}

/**
 * =========================================================
 * RESERVE PARCEL
 * =========================================================
 *
 * Reserves an available parcel for the authenticated user.
 *
 * Reservation duration:
 * 15 minutes.
 *
 * The reservation and parcel status change happen inside
 * one transaction.
 */

export async function reserveParcel(
  parcelId: string,
  userId: string
) {
  const expiresAt =
    new Date(
      Date.now() +
      15 * 60 * 1000
    );

  return prisma.$transaction(
    async (tx) => {
      const parcel =
        await tx.parcel.findUnique({
          where: {
            id: parcelId,
          },
        });

      if (!parcel) {
        return null;
      }

      /**
       * Clean up expired reservations
       * for this parcel before checking
       * its current state.
       */

      await tx.parcelReservation.deleteMany({
        where: {
          parcelId,

          expiresAt: {
            lte: new Date(),
          },
        },
      });

      const activeReservation =
        await tx.parcelReservation.findFirst({
          where: {
            parcelId,

            expiresAt: {
              gt: new Date(),
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        });

      if (
        parcel.status !==
        PrismaParcelStatus.available
      ) {
        throw new Error(
          "PARCEL_NOT_AVAILABLE"
        );
      }

      if (activeReservation) {
        throw new Error(
          "PARCEL_ALREADY_RESERVED"
        );
      }

      /**
       * Create reservation.
       */

      await tx.parcelReservation.create({
        data: {
          parcelId,
          userId,
          expiresAt,
        },
      });

      /**
       * Change parcel state.
       */

      await tx.parcel.update({
        where: {
          id: parcelId,
        },

        data: {
          status:
            PrismaParcelStatus.reserved,
        },
      });

      /**
       * Return authoritative state.
       */

      return tx.parcel.findUnique({
        where: {
          id: parcelId,
        },

        include: {
          owner: {
            select: {
              id: true,
              address: true,
              username: true,
            },
          },

          reservations: {
            where: {
              expiresAt: {
                gt: new Date(),
              },
            },

            orderBy: {
              createdAt: "desc",
            },

            take: 1,
          },

          listings: {
            where: {
              active: true,
            },
          },

          project: {
            select: {
              id: true,
              name: true,
              description: true,
              template: true,
              slug: true,
              publishedAt: true,
            },
          },
        },
      });
    }
  );
}

/**
 * =========================================================
 * RELEASE PARCEL RESERVATION
 * =========================================================
 *
 * Releases a reservation owned by the authenticated user.
 *
 * If the reservation has expired, it is also removed.
 */

export async function releaseParcelReservation(
  parcelId: string,
  userId: string
) {
  return prisma.$transaction(
    async (tx) => {
      const reservation =
        await tx.parcelReservation.findFirst({
          where: {
            parcelId,
            userId,
          },

          orderBy: {
            createdAt: "desc",
          },
        });

      if (!reservation) {
        return null;
      }

      await tx.parcelReservation.delete({
        where: {
          id: reservation.id,
        },
      });

      /**
       * Only make the parcel available again if
       * there isn't another active reservation.
       */

      const remaining =
        await tx.parcelReservation.findFirst({
          where: {
            parcelId,

            expiresAt: {
              gt: new Date(),
            },
          },
        });

      if (!remaining) {
        await tx.parcel.update({
          where: {
            id: parcelId,
          },

          data: {
            status:
              PrismaParcelStatus.available,
          },
        });
      }

      return tx.parcel.findUnique({
        where: {
          id: parcelId,
        },
      });
    }
  );
}

/**
 * =========================================================
 * END
 * =========================================================
 */
