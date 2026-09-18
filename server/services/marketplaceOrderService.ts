import {
  Prisma,
  MarketplaceOrderStatus,
  MarketplacePaymentStatus,
  MarketplacePaymentEnvironment,
} from "../generated/prisma/client.js";

import { prisma } from "../lib/prisma.js";

/**
 * =========================================================
 * MARKETPLACE ORDER SERVICE
 * =========================================================
 *
 * Server-authoritative marketplace order creation.
 *
 * IMPORTANT:
 *
 * The client MUST NOT control:
 *
 * - userId
 * - productId
 * - listingId
 * - amount
 * - currency
 * - status
 * - payment status
 *
 * The authenticated user's ID comes from req.user.id
 * and is passed into this service by the controller.
 *
 * The parcel/listing price is always read from PostgreSQL.
 * =========================================================
 */

export const MARKETPLACE_OPERATION = {
  CREATE_PARCEL_ORDER: "CREATE_PARCEL_ORDER",
} as const;

export const MARKETPLACE_CURRENCY = "USD";

/**
 * =========================================================
 * ERRORS
 * =========================================================
 */

export class MarketplaceError extends Error {
  public readonly code: string;

  constructor(
    code: string,
    message: string = code
  ) {
    super(message);

    this.name = "MarketplaceError";
    this.code = code;
  }
}

/**
 * =========================================================
 * TYPES
 * =========================================================
 */

export interface CreateParcelOrderInput {
  userId: string;

  parcelId: string;

  /**
   * Optional listing ID.
   *
   * If supplied, the listing must be the currently active
   * listing for the parcel.
   *
   * If omitted, the service will use the current active
   * listing automatically.
   */
  listingId?: string | null;

  /**
   * Client-generated idempotency key.
   *
   * This must be stable when retrying the same purchase.
   */
  idempotencyKey: string;
}

/**
 * =========================================================
 * VALIDATION
 * =========================================================
 */

function validateIdempotencyKey(
  key: string
): string {
  const normalized = key.trim();

  if (!normalized) {
    throw new MarketplaceError(
      "IDEMPOTENCY_KEY_REQUIRED",
      "An idempotency key is required."
    );
  }

  /**
   * Prevent accidentally enormous database values.
   */
  if (normalized.length > 255) {
    throw new MarketplaceError(
      "IDEMPOTENCY_KEY_TOO_LONG",
      "The idempotency key is too long."
    );
  }

  return normalized;
}

/**
 * =========================================================
 * GET EXISTING IDEMPOTENT RESPONSE
 * =========================================================
 */

async function getExistingIdempotentOrder(
  userId: string,
  operation: string,
  key: string
) {
  const record =
    await prisma.marketplaceIdempotencyKey.findUnique({
      where: {
        userId_operation_key: {
          userId,
          operation,
          key,
        },
      },

      include: {
        order: {
          include: {
            product: true,
            listing: true,
            payments: {
              orderBy: {
                createdAt: "desc",
              },
            },
            entitlements: true,
          },
        },
      },
    });

  return record?.order ?? null;
}

/**
 * =========================================================
 * CREATE PARCEL ORDER
 * =========================================================
 *
 * Creates one authoritative marketplace order.
 *
 * Important concurrency properties:
 *
 * - idempotency key is unique at the database level
 * - price comes from the database
 * - listing must currently be active
 * - parcel must currently be for sale
 * - buyer cannot buy their own parcel
 *
 * This function DOES NOT transfer ownership.
 *
 * Ownership is granted only after successful payment.
 * =========================================================
 */

export async function createParcelOrder(
  input: CreateParcelOrderInput
) {
  const userId = input.userId.trim();
  const parcelId = input.parcelId.trim();

  const idempotencyKey =
    validateIdempotencyKey(
      input.idempotencyKey
    );

  if (!userId) {
    throw new MarketplaceError(
      "USER_ID_REQUIRED"
    );
  }

  if (!parcelId) {
    throw new MarketplaceError(
      "PARCEL_ID_REQUIRED"
    );
  }

  /**
   * -------------------------------------------------------
   * FAST IDEMPOTENCY LOOKUP
   * -------------------------------------------------------
   *
   * This makes normal client retries cheap.
   */

  const existing =
    await getExistingIdempotentOrder(
      userId,
      MARKETPLACE_OPERATION.CREATE_PARCEL_ORDER,
      idempotencyKey
    );

  if (existing) {
    return existing;
  }

  /**
   * -------------------------------------------------------
   * TRANSACTION
   * -------------------------------------------------------
   */

  try {
    return await prisma.$transaction(
      async (tx) => {
        /**
         * ---------------------------------------------------
         * RECHECK IDEMPOTENCY INSIDE TRANSACTION
         * ---------------------------------------------------
         *
         * The initial lookup is not enough because two
         * concurrent requests can both pass it.
         *
         * The unique database constraint is authoritative.
         */

        const existingKey =
          await tx.marketplaceIdempotencyKey.findUnique({
            where: {
              userId_operation_key: {
                userId,
                operation:
                  MARKETPLACE_OPERATION
                    .CREATE_PARCEL_ORDER,
                key: idempotencyKey,
              },
            },

            include: {
              order: {
                include: {
                  product: true,
                  listing: true,
                  payments: true,
                  entitlements: true,
                },
              },
            },
          });

        if (existingKey?.order) {
          return existingKey.order;
        }

        /**
         * ---------------------------------------------------
         * LOAD PARCEL
         * ---------------------------------------------------
         */

        const parcel =
          await tx.parcel.findUnique({
            where: {
              id: parcelId,
            },
          });

        if (!parcel) {
          throw new MarketplaceError(
            "PARCEL_NOT_FOUND",
            "Parcel not found."
          );
        }

        /**
         * ---------------------------------------------------
         * VERIFY PARCEL STATE
         * ---------------------------------------------------
         */

        if (
          parcel.status !==
          "for_sale"
        ) {
          throw new MarketplaceError(
            "PARCEL_NOT_FOR_SALE",
            "Parcel is not currently for sale."
          );
        }

        /**
         * ---------------------------------------------------
         * BUYER CANNOT BUY OWN PARCEL
         * ---------------------------------------------------
         */

        if (
          parcel.ownerId === userId
        ) {
          throw new MarketplaceError(
            "CANNOT_BUY_OWN_PARCEL",
            "You cannot purchase your own parcel."
          );
        }

        /**
         * ---------------------------------------------------
         * LOAD ACTIVE LISTING
         * ---------------------------------------------------
         */

        const activeListings =
          await tx.parcelListing.findMany({
            where: {
              parcelId,
              active: true,
            },

            orderBy: {
              createdAt: "desc",
            },

            take: 2,
          });

        /**
         * There should only be one active listing.
         *
         * The application already deactivates previous
         * listings, but we fail safely if bad historical
         * state exists.
         */

        if (
          activeListings.length === 0
        ) {
          throw new MarketplaceError(
            "ACTIVE_LISTING_NOT_FOUND",
            "No active listing exists for this parcel."
          );
        }

        if (
          activeListings.length > 1
        ) {
          throw new MarketplaceError(
            "MULTIPLE_ACTIVE_LISTINGS",
            "Parcel has multiple active listings."
          );
        }

        const listing =
          activeListings[0];

        /**
         * ---------------------------------------------------
         * VERIFY REQUESTED LISTING
         * ---------------------------------------------------
         */

        if (
          input.listingId &&
          listing.id !==
            input.listingId
        ) {
          throw new MarketplaceError(
            "LISTING_CHANGED",
            "The requested listing is no longer active."
          );
        }

        /**
         * ---------------------------------------------------
         * VERIFY SELLER
         * ---------------------------------------------------
         */

        if (
          !parcel.ownerId ||
          parcel.ownerId !==
            listing.sellerId
        ) {
          throw new MarketplaceError(
            "LISTING_OWNER_MISMATCH",
            "Listing seller does not own the parcel."
          );
        }

        /**
         * ---------------------------------------------------
         * VERIFY LISTING PRICE
         * ---------------------------------------------------
         */

        if (
          !listing.price ||
          listing.price.lte(0)
        ) {
          throw new MarketplaceError(
            "INVALID_LISTING_PRICE",
            "The parcel listing has an invalid price."
          );
        }

        /**
         * ---------------------------------------------------
         * VERIFY PARCEL SNAPSHOT PRICE
         * ---------------------------------------------------
         *
         * Parcel.price is maintained by the marketplace
         * service as the current listing price.
         *
         * Listing.price remains the authoritative listing
         * price for this purchase.
         */

        const amount =
          new Prisma.Decimal(
            listing.price
          );

        /**
         * ---------------------------------------------------
         * CREATE ORDER
         * ---------------------------------------------------
         */

        let order;

        try {
          order =
            await tx.marketplaceOrder.create({
              data: {
                userId,

                productId:
                  parcel.id,

                listingId:
                  listing.id,

                quantity: 1,

                amount,

                currency:
                  MARKETPLACE_CURRENCY,

                status:
                  MarketplaceOrderStatus.PENDING,
              },
            });
        } catch (error) {
          /**
           * A concurrent request may have inserted the
           * idempotency key/order first.
           *
           * We re-query after a uniqueness race.
           */

          const concurrent =
            await tx.marketplaceIdempotencyKey.findUnique({
              where: {
                userId_operation_key: {
                  userId,
                  operation:
                    MARKETPLACE_OPERATION
                      .CREATE_PARCEL_ORDER,
                  key: idempotencyKey,
                },
              },

              include: {
                order: {
                  include: {
                    product: true,
                    listing: true,
                    payments: true,
                    entitlements: true,
                  },
                },
              },
            });

          if (concurrent?.order) {
            return concurrent.order;
          }

          throw error;
        }

        /**
         * ---------------------------------------------------
         * CREATE IDEMPOTENCY RECORD
         * ---------------------------------------------------
         */

        try {
          await tx.marketplaceIdempotencyKey.create({
            data: {
              userId,

              operation:
                MARKETPLACE_OPERATION
                  .CREATE_PARCEL_ORDER,

              key: idempotencyKey,

              orderId:
                order.id,

              responseStatus: 201,

              responseJson: {
                orderId: order.id,
              },
            },
          });
        } catch (error) {
          /**
           * A concurrent request may have won the unique
           * idempotency constraint.
           *
           * Returning the existing order is safe.
           */

          const concurrent =
            await tx.marketplaceIdempotencyKey.findUnique({
              where: {
                userId_operation_key: {
                  userId,
                  operation:
                    MARKETPLACE_OPERATION
                      .CREATE_PARCEL_ORDER,
                  key: idempotencyKey,
                },
              },

              include: {
                order: {
                  include: {
                    product: true,
                    listing: true,
                    payments: true,
                    entitlements: true,
                  },
                },
              },
            });

          if (concurrent?.order) {
            return concurrent.order;
          }

          throw error;
        }

        /**
         * ---------------------------------------------------
         * RETURN AUTHORITATIVE ORDER
         * ---------------------------------------------------
         */

        return tx.marketplaceOrder.findUniqueOrThrow({
          where: {
            id: order.id,
          },

          include: {
            product: true,

            listing: true,

            payments: {
              orderBy: {
                createdAt: "desc",
              },
            },

            entitlements: true,
          },
        });
      },
      {
        /**
         * Serializable is intentionally used for the
         * purchase/order creation boundary.
         *
         * The database remains authoritative under
         * concurrent purchase attempts.
         */
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  } catch (error) {
    /**
     * Prisma transaction serialization can retry/fail under
     * concurrent requests.
     *
     * The caller should retry using the SAME idempotency key.
     */

    if (
      error instanceof MarketplaceError
    ) {
      throw error;
    }

    throw error;
  }
}

/**
 * =========================================================
 * GET ORDER FOR USER
 * =========================================================
 */

export async function getMarketplaceOrderById(
  orderId: string,
  userId: string
) {
  return prisma.marketplaceOrder.findFirst({
    where: {
      id: orderId,
      userId,
    },

    include: {
      product: {
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

      listing: {
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

      payments: {
        orderBy: {
          createdAt: "desc",
        },
      },

      entitlements: {
        orderBy: {
          createdAt: "desc",
        },
      },

      paymentEvents: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

/**
 * =========================================================
 * GET USER ORDERS
 * =========================================================
 */

export async function getMarketplaceOrdersForUser(
  userId: string
) {
  return prisma.marketplaceOrder.findMany({
    where: {
      userId,
    },

    orderBy: {
      createdAt: "desc",
    },

    include: {
      product: {
        select: {
          id: true,
          estateId: true,
          x: true,
          y: true,
          name: true,
          description: true,
          status: true,
          price: true,
        },
      },

      listing: {
        select: {
          id: true,
          price: true,
          active: true,
          createdAt: true,
        },
      },

      payments: {
        select: {
          id: true,
          providerTransactionId: true,
          amount: true,
          currency: true,
          status: true,
          environment: true,
          createdAt: true,
          paidAt: true,
          failedAt: true,
          cancelledAt: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      },

      entitlements: {
        select: {
          id: true,
          productId: true,
          quantity: true,
          status: true,
          grantedAt: true,
        },
      },
    },
  });
}

/**
 =========================================================
 * CANCEL UNPAID ORDER
 * =========================================================
 *
 * Only unpaid orders can be cancelled.
 *
 * This function intentionally does NOT cancel a paid or
 * granted order.
 * =========================================================
 */

export async function cancelMarketplaceOrder(
  orderId: string,
  userId: string
) {
  return prisma.$transaction(
    async (tx) => {
      const order =
        await tx.marketplaceOrder.findFirst({
          where: {
            id: orderId,
            userId,
          },
        });

      if (!order) {
        return null;
      }

      if (
        order.status ===
        MarketplaceOrderStatus.GRANTED
      ) {
        throw new MarketplaceError(
          "ORDER_ALREADY_GRANTED",
          "A granted order cannot be cancelled."
        );
      }

      if (
        order.status ===
        MarketplaceOrderStatus.PAID
      ) {
        throw new MarketplaceError(
          "ORDER_ALREADY_PAID",
          "A paid order cannot be cancelled."
        );
      }

      if (
        order.status ===
        MarketplaceOrderStatus.CANCELLED
      ) {
        return order;
      }

      if (
        order.status ===
        MarketplaceOrderStatus.FAILED
      ) {
        return order;
      }

      return tx.marketplaceOrder.update({
        where: {
          id: order.id,
        },

        data: {
          status:
            MarketplaceOrderStatus.CANCELLED,
        },
      });
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,
    }
  );
}
