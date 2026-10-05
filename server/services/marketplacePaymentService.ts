import {
  Prisma,
  ParcelStatus,
  MarketplaceOrderStatus,
  MarketplacePaymentStatus,
  MarketplacePaymentEnvironment,
  MarketplacePaymentMethod,
} from "../generated/prisma/client.js";

import { prisma } from "../lib/prisma.js";

import {
  MarketplaceError,
} from "./marketplaceOrderService.js";

/**
 * =========================================================
 * MARKETPLACE PAYMENT SERVICE
 * =========================================================
 *
 * AUTHORITATIVE PAYMENT GATE
 *
 * Successful payment is the only path that can grant
 * marketplace entitlement and transfer parcel ownership.
 *
 * The browser is never trusted for:
 *
 * - amount
 * - currency
 * - payment status
 * - buyer identity
 * - seller identity
 * - entitlement state
 * - parcel ownership
 *
 * All ownership transfer occurs inside a SERIALIZABLE
 * transaction and uses an atomic conditional parcel update.
 * =========================================================
 */

/**
 * =========================================================
 * CONSTANTS
 * =========================================================
 */

export const MARKETPLACE_PAYMENT_OPERATION = {
  CREATE_PAYMENT:
    "CREATE_MARKETPLACE_PAYMENT",
} as const;

export const MARKETPLACE_PAYMENT_ENVIRONMENT =
  MarketplacePaymentEnvironment.LOCAL;

/**
 * =========================================================
 * PRODUCTION SAFETY
 * =========================================================
 */

function isProductionEnvironment(): boolean {
  return (
    process.env.NODE_ENV ===
    "production"
  );
}

function assertSandboxPaymentAllowed(): void {
  if (isProductionEnvironment()) {
    throw new MarketplaceError(
      "PAYMENT_GATEWAY_NOT_CONFIGURED",
      "The marketplace payment gateway is not configured for production."
    );
  }
}

/**
 * =========================================================
 * TEST TRANSACTION ID
 * =========================================================
 */

function createTestTransactionId(): string {
  const random =
    Math.random()
      .toString(36)
      .slice(2, 14);

  const timestamp =
    Date.now().toString(36);

  return `test_tx_${timestamp}_${random}`;
}

/**
 * =========================================================
 * TEST PROVIDER EVENT ID
 * =========================================================
 */

function createTestEventId(): string {
  const random =
    Math.random()
      .toString(36)
      .slice(2, 14);

  const timestamp =
    Date.now().toString(36);

  return `test_event_${timestamp}_${random}`;
}

/**
 * =========================================================
 * CREATE PAYMENT
 * =========================================================
 */

export async function createMarketplacePayment(
  orderId: string,
  userId: string
) {
  if (!orderId.trim()) {
    throw new MarketplaceError(
      "ORDER_ID_REQUIRED"
    );
  }

  if (!userId.trim()) {
    throw new MarketplaceError(
      "USER_ID_REQUIRED"
    );
  }

  assertSandboxPaymentAllowed();

  return runMarketplaceTransaction(
  async (tx) => {

      const order =
        await tx.marketplaceOrder.findFirst({
          where: {
            id:
              orderId,

            userId,
          },

          include: {
            payments: {
              where: {
                status:
                  MarketplacePaymentStatus.PENDING,
              },

              orderBy: {
                createdAt:
                  "desc",
              },

              take:
                1,
            },
          },
        });

      if (!order) {
        throw new MarketplaceError(
          "ORDER_NOT_FOUND",
          "Marketplace order not found."
        );
      }

      if (
        order.status ===
        MarketplaceOrderStatus.CANCELLED
      ) {
        throw new MarketplaceError(
          "ORDER_CANCELLED",
          "The order has been cancelled."
        );
      }

      if (
        order.status ===
        MarketplaceOrderStatus.FAILED
      ) {
        throw new MarketplaceError(
          "ORDER_FAILED",
          "The order has failed."
        );
      }

      if (
        order.status ===
        MarketplaceOrderStatus.GRANTED
      ) {
        throw new MarketplaceError(
          "ORDER_ALREADY_GRANTED",
          "The order has already been granted."
        );
      }

      const existingPayment =
        order.payments[0];

      if (existingPayment) {
        return existingPayment;
      }

      const payment =
        await tx.marketplacePayment.create({
          data: {
            orderId:
              order.id,

            userId:
              order.userId,

            externalTransactionId:
              createTestTransactionId(),

            method:
              MarketplacePaymentMethod.USD_PROVIDER,

            amount:
              new Prisma.Decimal(
                order.amount
              ),

            currency:
              order.currency,

            status:
              MarketplacePaymentStatus.PENDING,

            environment:
              MARKETPLACE_PAYMENT_ENVIRONMENT,
          },
        });

      await tx.marketplaceOrder.update({
        where: {
          id:
            order.id,
        },

        data: {
          status:
            MarketplaceOrderStatus.PAYMENT_PROCESSING,
        },
      });

      return payment;
    },

    
  );
}

/**
 * =========================================================
 * TEST PAYMENT GUARD
 * =========================================================
 */

function assertTestPaymentAllowed(): void {
  if (
    process.env.MARKETPLACE_TEST_PAYMENTS_ENABLED !==
    "true"
  ) {
    throw new MarketplaceError(
      "TEST_PAYMENT_DISABLED",
      "Test payment operations are disabled."
    );
  }
}


const MARKETPLACE_TRANSACTION_MAX_ATTEMPTS = 3;

function isRetryableMarketplaceTransactionError(
  error: unknown
): boolean {
  if (
    error instanceof
      Prisma.PrismaClientKnownRequestError
  ) {
    return error.code === "P2034";
  }

  return false;
}

async function runMarketplaceTransaction<T>(
  operation: (
    tx: Prisma.TransactionClient
  ) => Promise<T>
): Promise<T> {
  let lastError: unknown;

  for (
    let attempt = 1;
    attempt <= MARKETPLACE_TRANSACTION_MAX_ATTEMPTS;
    attempt += 1
  ) {
    try {
      return await prisma.$transaction(
        operation,
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,
        }
      );
    } catch (error) {
      lastError = error;

      if (
        !isRetryableMarketplaceTransactionError(
          error
        ) ||
        attempt ===
          MARKETPLACE_TRANSACTION_MAX_ATTEMPTS
      ) {
        throw error;
      }
    }
  }

  throw lastError;
}


async function assertTestPaymentOwnership(
  paymentId: string,
  userId: string
): Promise<void> {
  const payment =
    await prisma.marketplacePayment.findUnique({
      where: {
        id: paymentId,
      },
      select: {
        userId: true,
        order: {
          select: {
            userId: true,
          },
        },
      },
    });

  if (!payment) {
    throw new MarketplaceError(
      "PAYMENT_NOT_FOUND",
      "Payment not found."
    );
  }

  if (
    payment.userId !== userId ||
    payment.order.userId !== userId
  ) {
    throw new MarketplaceError(
      "PAYMENT_NOT_OWNED",
      "You are not authorized to operate on this payment."
    );
  }
}


/**
 * =========================================================
 * CONFIRM TEST PAYMENT
 * =========================================================
 */

export async function confirmTestMarketplacePayment(
  paymentId: string,
  userId: string
) {
  assertTestPaymentAllowed();

  if (!paymentId.trim()) {
    throw new MarketplaceError(
      "PAYMENT_ID_REQUIRED"
    );
  }

  if (!userId.trim()) {
    throw new MarketplaceError(
      "USER_ID_REQUIRED"
    );
  }

  await assertTestPaymentOwnership(
    paymentId,
    userId
  );

  return processMarketplacePaymentEvent({
    externalEventId:
      createTestEventId(),

    paymentId,

    status:
      MarketplacePaymentStatus.PAID,

    environment:
      MarketplacePaymentEnvironment.LOCAL,

    source:
      "TEST",
  });
}

/**
 * =========================================================
 * FAIL TEST PAYMENT
 * =========================================================
 */

export async function failTestMarketplacePayment(
  paymentId: string,
  userId: string
) {
  assertTestPaymentAllowed();

  if (!paymentId.trim()) {
    throw new MarketplaceError(
      "PAYMENT_ID_REQUIRED"
    );
  }

  if (!userId.trim()) {
    throw new MarketplaceError(
      "USER_ID_REQUIRED"
    );
  }

  await assertTestPaymentOwnership(
    paymentId,
    userId
  );

  return processMarketplacePaymentEvent({
    externalEventId:
      createTestEventId(),

    paymentId,

    status:
      MarketplacePaymentStatus.FAILED,

    environment:
      MarketplacePaymentEnvironment.LOCAL,

    source:
      "TEST",
  });
}

/**
 * =========================================================
 * CANCEL TEST PAYMENT
 * =========================================================
 */

export async function cancelTestMarketplacePayment(
  paymentId: string,
  userId: string
) {
  assertTestPaymentAllowed();

  if (!paymentId.trim()) {
    throw new MarketplaceError(
      "PAYMENT_ID_REQUIRED"
    );
  }

  if (!userId.trim()) {
    throw new MarketplaceError(
      "USER_ID_REQUIRED"
    );
  }

  await assertTestPaymentOwnership(
    paymentId,
    userId
  );

  return processMarketplacePaymentEvent({
    externalEventId:
      createTestEventId(),

    paymentId,

    status:
      MarketplacePaymentStatus.CANCELLED,

    environment:
      MarketplacePaymentEnvironment.LOCAL,

    source:
      "TEST",
  });
}

/**
 * =========================================================
 * PAYMENT EVENT INPUT
 * =========================================================
 */

interface PaymentEventInput {
  externalEventId: string;

  paymentId: string;

  status: MarketplacePaymentStatus;

  environment: MarketplacePaymentEnvironment;

  source?: "TEST" | "PROVIDER";
}

/**
 * =========================================================
 * PROCESS PAYMENT EVENT
 * =========================================================
 */

export async function processMarketplacePaymentEvent(
  input: PaymentEventInput
) {
  if (!input.externalEventId.trim()) {
    throw new MarketplaceError(
      "EXTERNAL_EVENT_ID_REQUIRED",
      "Payment provider event ID is required."
    );
  }

  if (!input.paymentId.trim()) {
    throw new MarketplaceError(
      "PAYMENT_ID_REQUIRED"
    );
  }

  if (
    input.source === "TEST"
  ) {
    assertTestPaymentAllowed();
  }

  return runMarketplaceTransaction(
  async (tx) => {

      /**
       * ---------------------------------------------------
       * DUPLICATE EVENT CHECK
       * ---------------------------------------------------
       */

      const existingEvent =
        await tx.marketplacePaymentEvent.findUnique({
          where: {
            externalEventId:
              input.externalEventId,
          },
        });

      if (existingEvent) {
        return {
          duplicate:
            true,

          event:
            existingEvent,
        };
      }

      /**
       * ---------------------------------------------------
       * LOAD PAYMENT
       * ---------------------------------------------------
       */

      const payment =
        await tx.marketplacePayment.findUnique({
          where: {
            id:
              input.paymentId,
          },

          include: {
            order: {
              include: {
                listing:
                  true,
              },
            },
          },
        });

      if (!payment) {
        throw new MarketplaceError(
          "PAYMENT_NOT_FOUND",
          "Payment not found."
        );
      }

      /**
       * ---------------------------------------------------
       * ENVIRONMENT CHECK
       * ---------------------------------------------------
       */

      if (
        payment.environment !==
        input.environment
      ) {
        throw new MarketplaceError(
          "PAYMENT_ENVIRONMENT_MISMATCH",
          "Payment environment mismatch."
        );
      }

      /**
       * ---------------------------------------------------
       * PAYMENT / ORDER AMOUNT CHECK
       * ---------------------------------------------------
       */

      if (
        !payment.amount.equals(
          payment.order.amount
        )
      ) {
        throw new MarketplaceError(
          "PAYMENT_AMOUNT_MISMATCH",
          "Payment amount does not match the order."
        );
      }

      /**
       * ---------------------------------------------------
       * PAYMENT / ORDER CURRENCY CHECK
       * ---------------------------------------------------
       */

      if (
        payment.currency !==
        payment.order.currency
      ) {
        throw new MarketplaceError(
          "PAYMENT_CURRENCY_MISMATCH",
          "Payment currency does not match the order."
        );
      }

      /**
       * ---------------------------------------------------
       * ORDER OWNERSHIP CONSISTENCY
       * ---------------------------------------------------
       */

      if (
        payment.userId !==
        payment.order.userId
      ) {
        throw new MarketplaceError(
          "PAYMENT_ORDER_USER_MISMATCH",
          "Payment owner does not match the order buyer."
        );
      }

      /**
       * ---------------------------------------------------
       * CREATE DURABLE PAYMENT EVENT
       * ---------------------------------------------------
       */

      let event;

      try {
        event =
          await tx.marketplacePaymentEvent.create({
            data: {
              externalEventId:
                input.externalEventId,

              externalTransactionId:
                payment.externalTransactionId,

              orderId:
                payment.orderId,

              userId:
                payment.userId,

              status:
                input.status,

              environment:
                input.environment,

              processed:
                false,
            },
          });
      } catch (error) {
        if (
          error instanceof
            Prisma.PrismaClientKnownRequestError &&
          error.code ===
            "P2002"
        ) {
          const concurrentEvent =
            await tx.marketplacePaymentEvent.findUnique({
              where: {
                externalEventId:
                  input.externalEventId,
              },
            });

          if (concurrentEvent) {
            return {
              duplicate:
                true,

              event:
                concurrentEvent,
            };
          }
        }

        throw error;
      }

      /**
       * ===================================================
       * ALREADY PAID
       * ===================================================
       */

      if (
        payment.status ===
        MarketplacePaymentStatus.PAID
      ) {
        if (
          input.status !==
          MarketplacePaymentStatus.PAID
        ) {
          throw new MarketplaceError(
            "PAYMENT_ALREADY_PAID",
            "Payment is already paid."
          );
        }

        await tx.marketplacePaymentEvent.update({
          where: {
            id:
              event.id,
          },

          data: {
            processed:
              true,

            processedAt:
              new Date(),
          },
        });

        return {
          duplicate:
            false,

          alreadyFinal:
            true,

          event,

          payment,
        };
      }

      /**
       * ===================================================
       * ALREADY CANCELLED
       * ===================================================
       */

      if (
        payment.status ===
        MarketplacePaymentStatus.CANCELLED
      ) {
        throw new MarketplaceError(
          "PAYMENT_ALREADY_CANCELLED",
          "Payment is already cancelled."
        );
      }

      /**
       * ===================================================
       * ALREADY FAILED
       * ===================================================
       */

      if (
        payment.status ===
        MarketplacePaymentStatus.FAILED
      ) {
        throw new MarketplaceError(
          "PAYMENT_ALREADY_FAILED",
          "Payment is already failed."
        );
      }

      /**
       * ===================================================
       * SUCCESSFUL PAYMENT
       * ===================================================
       */

      if (
        input.status ===
        MarketplacePaymentStatus.PAID
      ) {
        if (
          payment.order.status ===
            MarketplaceOrderStatus.CANCELLED ||
          payment.order.status ===
            MarketplaceOrderStatus.FAILED
        ) {
          throw new MarketplaceError(
            "ORDER_NOT_PAYABLE",
            "The marketplace order is no longer payable."
          );
        }

        const updatedPayment =
          await tx.marketplacePayment.update({
            where: {
              id:
                payment.id,
            },

            data: {
              status:
                MarketplacePaymentStatus.PAID,

              confirmedAt:
                new Date(),

              failedAt:
                null,

              cancelledAt:
                null,
            },
          });

        await tx.marketplaceOrder.update({
          where: {
            id:
              payment.orderId,
          },

          data: {
            status:
              MarketplaceOrderStatus.PAID,
          },
        });

        /**
         * -------------------------------------------------
         * AUTHORITATIVE ENTITLEMENT / OWNERSHIP
         * -------------------------------------------------
         */

        const grant =
          await grantMarketplaceEntitlement(
            tx,
            payment.orderId
          );

        /**
         * -------------------------------------------------
         * ORDER = GRANTED
         * -------------------------------------------------
         */

        await tx.marketplaceOrder.update({
          where: {
            id:
              payment.orderId,
          },

          data: {
            status:
              MarketplaceOrderStatus.GRANTED,
          },
        });

        /**
         * -------------------------------------------------
         * EVENT = PROCESSED
         * -------------------------------------------------
         */

        await tx.marketplacePaymentEvent.update({
          where: {
            id:
              event.id,
          },

          data: {
            processed:
              true,

            processedAt:
              new Date(),
          },
        });

        return {
          duplicate:
            false,

          event,

          payment:
            updatedPayment,

          grant,
        };
      }

      /**
       * ===================================================
       * FAILED PAYMENT
       * ===================================================
       */

      if (
        input.status ===
        MarketplacePaymentStatus.FAILED
      ) {
        const updatedPayment =
          await tx.marketplacePayment.update({
            where: {
              id:
                payment.id,
            },

            data: {
              status:
                MarketplacePaymentStatus.FAILED,

              failedAt:
                new Date(),
            },
          });

        if (
          payment.order.status !==
            MarketplaceOrderStatus.GRANTED
        ) {
          await tx.marketplaceOrder.update({
            where: {
              id:
                payment.orderId,
            },

            data: {
              status:
                MarketplaceOrderStatus.FAILED,
            },
          });
        }

        await tx.marketplacePaymentEvent.update({
          where: {
            id:
              event.id,
          },

          data: {
            processed:
              true,

            processedAt:
              new Date(),
          },
        });

        return {
          duplicate:
            false,

          event,

          payment:
            updatedPayment,
        };
      }

      /**
       * ===================================================
       * CANCELLED PAYMENT
       * ===================================================
       */

      if (
        input.status ===
        MarketplacePaymentStatus.CANCELLED
      ) {
        const updatedPayment =
          await tx.marketplacePayment.update({
            where: {
              id:
                payment.id,
            },

            data: {
              status:
                MarketplacePaymentStatus.CANCELLED,

              cancelledAt:
                new Date(),
            },
          });

        if (
          payment.order.status !==
            MarketplaceOrderStatus.GRANTED
        ) {
          await tx.marketplaceOrder.update({
            where: {
              id:
                payment.orderId,
            },

            data: {
              status:
                MarketplaceOrderStatus.CANCELLED,
            },
          });
        }

        await tx.marketplacePaymentEvent.update({
          where: {
            id:
              event.id,
          },

          data: {
            processed:
              true,

            processedAt:
              new Date(),
          },
        });

        return {
          duplicate:
            false,

          event,

          payment:
            updatedPayment,
        };
      }

      throw new MarketplaceError(
  "UNSUPPORTED_PAYMENT_STATUS",
  "Unsupported payment status."
);
    }
  );
}


/**
 * =========================================================
 * GRANT MARKETPLACE ENTITLEMENT
 * =========================================================
 *
 * This is the authoritative ownership-transfer boundary.
 *
 * IMPORTANT CONCURRENCY RULE:
 *
 * The parcel is claimed using an atomic conditional UPDATE:
 *
 *     ownerId = seller
 *     status  = for_sale
 *
 * Only one concurrent buyer can satisfy that condition.
 *
 * If another buyer has already purchased the parcel,
 * updateMany() returns count = 0 and the entire transaction
 * rolls back.
 * =========================================================
 */

async function grantMarketplaceEntitlement(
  tx: Prisma.TransactionClient,
  orderId: string
) {
  /**
   * -------------------------------------------------------
   * LOAD ORDER
   * -------------------------------------------------------
   */

  const order =
    await tx.marketplaceOrder.findUnique({
      where: {
        id:
          orderId,
      },

      include: {
        product:
          true,

        listing:
          true,

        entitlements: {
          where: {
            status:
              "GRANTED",
          },

          take:
            1,
        },
      },
    });

  if (!order) {
    throw new MarketplaceError(
      "ORDER_NOT_FOUND",
      "Order not found."
    );
  }

  /**
   * -------------------------------------------------------
   * LOAD CURRENT PARCEL
   * -------------------------------------------------------
   */

  const parcel =
    await tx.parcel.findUnique({
      where: {
        id:
          order.productId,
      },
    });

  if (!parcel) {
    throw new MarketplaceError(
      "PARCEL_NOT_FOUND",
      "Purchased parcel no longer exists."
    );
  }

  /**
   * =======================================================
   * EXISTING ENTITLEMENT / RECOVERY
   * =======================================================
   */

  const existingEntitlement =
    order.entitlements[0];

  if (existingEntitlement) {
    /**
     * Existing entitlement is only recoverable when the
     * buyer already owns the parcel or when ownership can
     * safely be restored from the original listing seller.
     */

    if (
      parcel.ownerId !==
      order.userId
    ) {
      if (!order.listing) {
        throw new MarketplaceError(
          "LISTING_NOT_FOUND",
          "Cannot recover marketplace ownership without the original listing."
        );
      }

      if (
        parcel.ownerId !==
        order.listing.sellerId
      ) {
        throw new MarketplaceError(
          "PARCEL_OWNER_MISMATCH",
          "The parcel is no longer owned by the original listing seller."
        );
      }

      const claimedParcel =
        await tx.parcel.updateMany({
          where: {
            id:
              order.productId,

            ownerId:
              order.listing.sellerId,

            status:
              ParcelStatus.for_sale,
          },

          data: {
            ownerId:
              order.userId,

            status:
              ParcelStatus.owned,

            price:
              null,
          },
        });

      if (
        claimedParcel.count !== 1
      ) {
        throw new MarketplaceError(
          "PARCEL_ALREADY_SOLD",
          "The parcel is no longer available for purchase."
        );
      }

      await tx.parcelOwnershipHistory.create({
        data: {
          parcelId:
            order.productId,

          previousOwnerId:
            order.listing.sellerId,

          newOwnerId:
            order.userId,

          source:
            "MARKETPLACE_PAYMENT_RECOVERY",

          marketplaceOrderId:
            order.id,
        },
      });
    } else if (
      parcel.price !== null ||
      parcel.status !==
        ParcelStatus.owned
    ) {
      await tx.parcel.update({
        where: {
          id:
            order.productId,
        },

        data: {
          status:
            ParcelStatus.owned,

          price:
            null,
        },
      });
    }

    /**
     * Once ownership is granted, no listing may remain
     * active.
     */

    await tx.parcelListing.updateMany({
      where: {
        parcelId:
          order.productId,

        active:
          true,
      },

      data: {
        active:
          false,
      },
    });

    return {
      entitlement:
        existingEntitlement,

      alreadyGranted:
        true,
    };
  }

  /**
   * =======================================================
   * VERIFY LISTING
   * =======================================================
   */

  let listing =
    null;

  if (order.listingId) {
    listing =
      await tx.parcelListing.findUnique({
        where: {
          id:
            order.listingId,
        },
      });

    if (!listing) {
      throw new MarketplaceError(
        "LISTING_NOT_FOUND",
        "The purchased listing no longer exists."
      );
    }

    /**
     * -----------------------------------------------------
     * BUYER CANNOT BUY OWN LISTING
     * -----------------------------------------------------
     */

    if (
      listing.sellerId ===
      order.userId
    ) {
      throw new MarketplaceError(
        "CANNOT_BUY_OWN_PARCEL",
        "Buyer cannot purchase their own listing."
      );
    }

    /**
     * -----------------------------------------------------
     * LISTING / ORDER PRICE CHECK
     * -----------------------------------------------------
     */

    if (
      !listing.price.equals(
        order.amount
      )
    ) {
      throw new MarketplaceError(
        "ORDER_PRICE_MISMATCH",
        "Listing price no longer matches order amount."
      );
    }

    /**
     * -----------------------------------------------------
     * LISTING / PRODUCT CHECK
     * -----------------------------------------------------
     */

    if (
      listing.parcelId !==
      order.productId
    ) {
      throw new MarketplaceError(
        "LISTING_PRODUCT_MISMATCH",
        "The listing does not match the purchased parcel."
      );
    }

    /**
     * -----------------------------------------------------
     * LISTING MUST STILL BE ACTIVE
     * -----------------------------------------------------
     */

    if (
      !listing.active &&
      parcel.ownerId !==
        order.userId
    ) {
      throw new MarketplaceError(
        "LISTING_NOT_ACTIVE",
        "The marketplace listing is no longer active."
      );
    }

    /**
     * -----------------------------------------------------
     * SELLER OWNERSHIP CHECK
     * -----------------------------------------------------
     */

    if (
      parcel.ownerId !==
        listing.sellerId &&
      parcel.ownerId !==
        order.userId
    ) {
      throw new MarketplaceError(
        "PARCEL_OWNER_MISMATCH",
        "The parcel is no longer owned by the listing seller."
      );
    }
  }

  /**
   * =======================================================
   * SELLER CONSISTENCY
   * =======================================================
   */

  if (
    listing &&
    listing.sellerId !==
      order.sellerId
  ) {
    throw new MarketplaceError(
      "LISTING_OWNER_MISMATCH",
      "The marketplace order seller does not match the listing seller."
    );
  }

  /**
   * =======================================================
   * BUYER ALREADY OWNS PARCEL
   * =======================================================
   */

  const buyerAlreadyOwnsParcel =
    parcel.ownerId ===
    order.userId;

  /**
   * =======================================================
   * ATOMIC PARCEL OWNERSHIP CLAIM
   * =======================================================
   *
   * THIS IS THE IMPORTANT CONCURRENCY FIX.
   *
   * The database will only perform the ownership transfer
   * if the parcel is still owned by the original seller and
   * is still marked for sale.
   *
   * Two buyers cannot both successfully change this row.
   */

  if (!buyerAlreadyOwnsParcel) {
    if (!listing) {
      throw new MarketplaceError(
        "LISTING_NOT_FOUND",
        "Cannot purchase parcel without a listing."
      );
    }

    const claimedParcel =
      await tx.parcel.updateMany({
        where: {
          id:
            order.productId,

          ownerId:
            listing.sellerId,

          status:
            ParcelStatus.for_sale,
        },

        data: {
          ownerId:
            order.userId,

          status:
            ParcelStatus.owned,

          price:
            null,
        },
      });

    if (
      claimedParcel.count !== 1
    ) {
      throw new MarketplaceError(
        "PARCEL_ALREADY_SOLD",
        "The parcel is no longer available for purchase."
      );
    }

    /**
     * -----------------------------------------------------
     * IMMUTABLE OWNERSHIP HISTORY
     * -----------------------------------------------------
     *
     * Only write this after the atomic ownership claim
     * succeeds.
     */

    await tx.parcelOwnershipHistory.create({
      data: {
        parcelId:
          order.productId,

        previousOwnerId:
          listing.sellerId,

        newOwnerId:
          order.userId,

        source:
          "MARKETPLACE_PAYMENT",

        marketplaceOrderId:
          order.id,
      },
    });
  } else {
    /**
     * Buyer already owns the parcel.
     *
     * This is a recovery/idempotency path.
     */

    await tx.parcel.update({
      where: {
        id:
          order.productId,
      },

      data: {
        status:
          ParcelStatus.owned,

        price:
          null,
      },
    });
  }

  /**
   * =======================================================
   * CREATE ENTITLEMENT
   * =======================================================
   *
   * Ownership has already been atomically claimed before
   * reaching this point.
   */

  let entitlement;

  try {
    entitlement =
      await tx.marketplaceEntitlement.create({
        data: {
          userId:
            order.userId,

          productId:
            order.productId,

          orderId:
            order.id,

          quantity:
            order.quantity,

          status:
            "GRANTED",

          grantedAt:
            new Date(),
        },
      });
  } catch (error) {
    /**
     * Recover ONLY from the entitlement uniqueness
     * constraint.
     */

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code ===
        "P2002"
    ) {
      const concurrent =
        await tx.marketplaceEntitlement.findUnique({
          where: {
            userId_productId: {
              userId:
                order.userId,

              productId:
                order.productId,
            },
          },
        });

      if (!concurrent) {
        throw error;
      }

      entitlement =
        concurrent;
    } else {
      throw error;
    }
  }

  /**
   * =======================================================
   * CLOSE PURCHASED LISTING
   * =======================================================
   */

  if (order.listingId) {
    await tx.parcelListing.updateMany({
      where: {
        id:
          order.listingId,

        active:
          true,
      },

      data: {
        active:
          false,
      },
    });
  }

  /**
   * =======================================================
   * CLOSE ALL OTHER ACTIVE LISTINGS
   * =======================================================
   */

  await tx.parcelListing.updateMany({
    where: {
      parcelId:
        order.productId,

      active:
        true,
    },

    data: {
      active:
        false,
    },
  });

  /**
   * =======================================================
   * RETURN AUTHORITATIVE RESULT
   * =======================================================
   */

  return {
    entitlement,

    alreadyGranted:
      false,
  };
}

/**
 * =========================================================
 * GET PAYMENT BY ID
 * =========================================================
 */

export async function getMarketplacePaymentById(
  paymentId: string,
  userId: string
) {
  if (!paymentId.trim()) {
    throw new MarketplaceError(
      "PAYMENT_ID_REQUIRED"
    );
  }

  if (!userId.trim()) {
    throw new MarketplaceError(
      "USER_ID_REQUIRED"
    );
  }

  return prisma.marketplacePayment.findFirst({
    where: {
      id:
        paymentId,

      userId,
    },

    include: {
      order: {
        include: {
          product: {
            select: {
              id:
                true,

              estateId:
                true,

              x:
                true,

              y:
                true,

              name:
                true,

              status:
                true,
            },
          },
        },
      },

      events: {
        orderBy: {
          createdAt:
            "desc",
        },
      },
    },
  });
}
