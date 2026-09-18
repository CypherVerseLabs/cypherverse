import {
  Prisma,
  MarketplaceOrderStatus,
  MarketplacePaymentStatus,
  MarketplacePaymentEnvironment,
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
 * TEST/SANDBOX PAYMENT PROVIDER.
 *
 * This provider intentionally lives server-side.
 *
 * The client can request payment creation, but cannot:
 *
 * - choose the amount
 * - choose the currency
 * - choose the order
 * - mark payment as paid
 * - grant entitlement
 *
 * The actual payment confirmation endpoint should eventually
 * be replaced by a real provider webhook/SDK integration.
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
  MarketplacePaymentEnvironment.TEST;

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
 *
 * Creates a pending payment using the authoritative order
 * amount.
 *
 * The caller provides only:
 *
 *     orderId
 *     userId
 *
 * The amount comes from MarketplaceOrder.
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

  return prisma.$transaction(
    async (tx) => {
      /**
       * ---------------------------------------------------
       * LOAD ORDER
       * ---------------------------------------------------
       */

      const order =
        await tx.marketplaceOrder.findFirst({
          where: {
            id: orderId,
            userId,
          },

          include: {
            payments: {
              where: {
                status:
                  MarketplacePaymentStatus.PENDING,
              },

              orderBy: {
                createdAt: "desc",
              },

              take: 1,
            },
          },
        });

      if (!order) {
        throw new MarketplaceError(
          "ORDER_NOT_FOUND",
          "Marketplace order not found."
        );
      }

      /**
       * ---------------------------------------------------
       * ORDER STATE
       * ---------------------------------------------------
       */

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

      /**
       * ---------------------------------------------------
       * EXISTING PENDING PAYMENT
       * ---------------------------------------------------
       *
       * Returning an existing pending payment makes retries
       * safe.
       */

      const existingPayment =
        order.payments[0];

      if (existingPayment) {
        return existingPayment;
      }

      /**
       * ---------------------------------------------------
       * AUTHORITATIVE PAYMENT
       * ---------------------------------------------------
       */

      const payment =
        await tx.marketplacePayment.create({
          data: {
            orderId:
              order.id,

            userId:
              order.userId,

            providerTransactionId:
              createTestTransactionId(),

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

      /**
       * ---------------------------------------------------
       * MOVE ORDER TO PAYMENT PROCESSING
       * ---------------------------------------------------
       */

      await tx.marketplaceOrder.update({
        where: {
          id: order.id,
        },

        data: {
          status:
            MarketplaceOrderStatus.PAYMENT_PROCESSING,
        },
      });

      /**
       * ---------------------------------------------------
       * RETURN PAYMENT
       * ---------------------------------------------------
       */

      return payment;
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,
    }
  );
}

/**
 * =========================================================
 * CONFIRM TEST PAYMENT
 * =========================================================
 *
 * This is a SANDBOX ONLY helper.
 *
 * Production real-money payments should NOT expose an
 * arbitrary client endpoint capable of confirming payment.
 *
 * In production, this operation should be triggered by a
 * verified payment-provider webhook or server-side provider
 * SDK callback.
 *
 * The grant operation itself remains transactionally
 * protected.
 * =========================================================
 */

export async function confirmTestMarketplacePayment(
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

  const providerEventId =
    createTestEventId();

  return processMarketplacePaymentEvent({
    providerEventId,

    paymentId,

    userId,

    status:
      MarketplacePaymentStatus.PAID,

    environment:
      MarketplacePaymentEnvironment.TEST,
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

  const providerEventId =
    createTestEventId();

  return processMarketplacePaymentEvent({
    providerEventId,

    paymentId,

    userId,

    status:
      MarketplacePaymentStatus.FAILED,

    environment:
      MarketplacePaymentEnvironment.TEST,
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

  const providerEventId =
    createTestEventId();

  return processMarketplacePaymentEvent({
    providerEventId,

    paymentId,

    userId,

    status:
      MarketplacePaymentStatus.CANCELLED,

    environment:
      MarketplacePaymentEnvironment.TEST,
  });
}

/**
 * =========================================================
 * PAYMENT EVENT INPUT
 * =========================================================
 */

interface PaymentEventInput {
  providerEventId: string;

  paymentId: string;

  userId: string;

  status: MarketplacePaymentStatus;

  environment: MarketplacePaymentEnvironment;
}

/**
 * =========================================================
 * PROCESS PAYMENT EVENT
 * =========================================================
 *
 * This is the important production boundary.
 *
 * Duplicate provider events are ignored using the unique
 * providerEventId database constraint.
 *
 * Successful payment causes entitlement granting.
 * =========================================================
 */

export async function processMarketplacePaymentEvent(
  input: PaymentEventInput
) {
  return prisma.$transaction(
    async (tx) => {
      /**
       * ---------------------------------------------------
       * DUPLICATE EVENT CHECK
       * ---------------------------------------------------
       */

      const existingEvent =
        await tx.marketplacePaymentEvent.findUnique({
          where: {
            providerEventId:
              input.providerEventId,
          },
        });

      if (existingEvent) {
        return {
          duplicate: true,
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
            id: input.paymentId,
          },

          include: {
            order: true,
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
       * SECURITY CHECK
       * ---------------------------------------------------
       */

      if (
        payment.userId !==
        input.userId
      ) {
        throw new MarketplaceError(
          "PAYMENT_NOT_OWNED",
          "Payment does not belong to this user."
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
       * AMOUNT CHECK
       * ---------------------------------------------------
       *
       * Payment amount and order amount must match exactly.
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
       * CREATE DURABLE PAYMENT EVENT
       * ---------------------------------------------------
       */

      const event =
        await tx.marketplacePaymentEvent.create({
          data: {
            providerEventId:
              input.providerEventId,

            providerTransactionId:
              payment.providerTransactionId,

            orderId:
              payment.orderId,

            userId:
              payment.userId,

            status:
              input.status,

            environment:
              input.environment,

            processed: false,
          },
        });

      /**
       * ---------------------------------------------------
       * ALREADY FINAL PAYMENT
       * ---------------------------------------------------
       *
       * Duplicate provider callbacks can happen with a
       * different event ID.
       *
       * Never move a final payment backwards.
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
            id: event.id,
          },

          data: {
            processed: true,
            processedAt:
              new Date(),
          },
        });

        return {
          duplicate: false,
          alreadyFinal: true,
          event,
          payment,
        };
      }

      if (
        payment.status ===
        MarketplacePaymentStatus.CANCELLED
      ) {
        throw new MarketplaceError(
          "PAYMENT_ALREADY_CANCELLED",
          "Payment is already cancelled."
        );
      }

      if (
        payment.status ===
        MarketplacePaymentStatus.FAILED
      ) {
        /**
         * A failed payment cannot be changed to paid by
         * this event path.
         */
        if (
          input.status ===
          MarketplacePaymentStatus.PAID
        ) {
          throw new MarketplaceError(
            "PAYMENT_ALREADY_FAILED",
            "Payment is already failed."
          );
        }
      }

      /**
       * ---------------------------------------------------
       * SUCCESSFUL PAYMENT
       * ---------------------------------------------------
       */

      if (
        input.status ===
        MarketplacePaymentStatus.PAID
      ) {
        /**
         * Update payment first.
         */

        const updatedPayment =
          await tx.marketplacePayment.update({
            where: {
              id: payment.id,
            },

            data: {
              status:
                MarketplacePaymentStatus.PAID,

              paidAt:
                new Date(),

              failedAt: null,
              cancelledAt: null,
            },
          });

        /**
         * Order becomes PAID before entitlement grant.
         */

        await tx.marketplaceOrder.update({
          where: {
            id: payment.orderId,
          },

          data: {
            status:
              MarketplaceOrderStatus.PAID,
          },
        });

        /**
         * -------------------------------------------------
         * GRANT ENTITLEMENT
         * -------------------------------------------------
         *
         * This function owns the final parcel transfer.
         */

        const grant =
          await grantMarketplaceEntitlement(
            tx,
            payment.orderId
          );

        /**
         * Mark order granted after entitlement/ownership
         * transaction succeeds.
         */

        await tx.marketplaceOrder.update({
          where: {
            id: payment.orderId,
          },

          data: {
            status:
              MarketplaceOrderStatus.GRANTED,
          },
        });

        /**
         * Mark payment event processed.
         */

        await tx.marketplacePaymentEvent.update({
          where: {
            id: event.id,
          },

          data: {
            processed: true,

            processedAt:
              new Date(),
          },
        });

        return {
          duplicate: false,
          event,
          payment:
            updatedPayment,
          grant,
        };
      }

      /**
       * ---------------------------------------------------
       * FAILED PAYMENT
       * ---------------------------------------------------
       */

      if (
        input.status ===
        MarketplacePaymentStatus.FAILED
      ) {
        const updatedPayment =
          await tx.marketplacePayment.update({
            where: {
              id: payment.id,
            },

            data: {
              status:
                MarketplacePaymentStatus.FAILED,

              failedAt:
                new Date(),
            },
          });

        await tx.marketplaceOrder.update({
          where: {
            id: payment.orderId,
          },

          data: {
            status:
              MarketplaceOrderStatus.FAILED,
          },
        });

        await tx.marketplacePaymentEvent.update({
          where: {
            id: event.id,
          },

          data: {
            processed: true,

            processedAt:
              new Date(),
          },
        });

        return {
          duplicate: false,
          event,
          payment:
            updatedPayment,
        };
      }

      /**
       * ---------------------------------------------------
       * CANCELLED PAYMENT
       * ---------------------------------------------------
       */

      if (
        input.status ===
        MarketplacePaymentStatus.CANCELLED
      ) {
        const updatedPayment =
          await tx.marketplacePayment.update({
            where: {
              id: payment.id,
            },

            data: {
              status:
                MarketplacePaymentStatus.CANCELLED,

              cancelledAt:
                new Date(),
            },
          });

        await tx.marketplaceOrder.update({
          where: {
            id: payment.orderId,
          },

          data: {
            status:
              MarketplaceOrderStatus.CANCELLED,
          },
        });

        await tx.marketplacePaymentEvent.update({
          where: {
            id: event.id,
          },

          data: {
            processed: true,

            processedAt:
              new Date(),
          },
        });

        return {
          duplicate: false,
          event,
          payment:
            updatedPayment,
        };
      }

      throw new MarketplaceError(
        "UNSUPPORTED_PAYMENT_STATUS",
        "Unsupported payment status."
      );
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,
    }
  );
}

/**
 * =========================================================
 * GRANT MARKETPLACE ENTITLEMENT
 * =========================================================
 *
 * This is the authoritative ownership-transfer function.
 *
 * Everything happens in the same transaction:
 *
 * 1. Verify order.
 * 2. Verify parcel.
 * 3. Verify listing.
 * 4. Prevent duplicate entitlement.
 * 5. Create entitlement.
 * 6. Transfer parcel.
 * 7. Close listing.
 * 8. Clear parcel marketplace price.
 *
 * If ANY operation fails, the transaction rolls back.
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
        id: orderId,
      },

      include: {
        product: true,

        listing: true,

        entitlements: {
          where: {
            status: "GRANTED",
          },

          take: 1,
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
   * EXACTLY-ONCE ENTITLEMENT
   * -------------------------------------------------------
   *
   * The database unique constraint on:
   *
   *     userId + productId
   *
   * is the final protection.
   */

  const existingEntitlement =
    order.entitlements[0];

  if (existingEntitlement) {
    /**
     * The entitlement already exists.
     *
     * Verify parcel ownership is also correct.
     */

    if (
      order.product.ownerId !==
      order.userId
    ) {
      await tx.parcel.update({
        where: {
          id: order.productId,
        },

        data: {
          ownerId:
            order.userId,

          status:
            "owned",

          price: null,
        },
      });
    }

    /**
     * Close any still-active listing.
     */

    if (order.listingId) {
      await tx.parcelListing.updateMany({
        where: {
          id: order.listingId,
          active: true,
        },

        data: {
          active: false,
        },
      });
    }

    return {
      entitlement:
        existingEntitlement,

      alreadyGranted: true,
    };
  }

  /**
   * -------------------------------------------------------
   * VERIFY PARCEL STATE
   * -------------------------------------------------------
   */

  const parcel =
    await tx.parcel.findUnique({
      where: {
        id: order.productId,
      },
    });

  if (!parcel) {
    throw new MarketplaceError(
      "PARCEL_NOT_FOUND",
      "Purchased parcel no longer exists."
    );
  }

  /**
   * -------------------------------------------------------
   * BUYER CANNOT ALREADY OWN IT
   * -------------------------------------------------------
   */

  if (
    parcel.ownerId ===
    order.userId
  ) {
    /**
     * If ownership already transferred but entitlement
     * wasn't created, create the entitlement now.
     *
     * This is safe because the unique constraint protects
     * against duplicate grants.
     */
  }

  /**
   * -------------------------------------------------------
   * VERIFY LISTING
   * -------------------------------------------------------
   */

  if (order.listingId) {
    const listing =
      await tx.parcelListing.findUnique({
        where: {
          id: order.listingId,
        },
      });

    if (!listing) {
      throw new MarketplaceError(
        "LISTING_NOT_FOUND",
        "The purchased listing no longer exists."
      );
    }

    /**
     * A listing can be inactive here if another recovery
     * attempt already closed it.
     *
     * Do not blindly reject an already-paid order solely
     * because the listing is now inactive.
     */

    if (
      listing.sellerId ===
      order.userId
    ) {
      throw new MarketplaceError(
        "CANNOT_BUY_OWN_PARCEL",
        "Buyer cannot own the seller listing."
      );
    }

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
  }

  /**
   * -------------------------------------------------------
   * CREATE ENTITLEMENT
   * -------------------------------------------------------
   *
   * The database unique constraint:
   *
   *     @@unique([userId, productId])
   *
   * protects this operation.
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
     * A concurrent transaction may have created the
     * entitlement first.
     *
     * Re-query it.
     */

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
  }

  /**
   * -------------------------------------------------------
   * TRANSFER OWNERSHIP
   * -------------------------------------------------------
   */

  await tx.parcel.update({
    where: {
      id: order.productId,
    },

    data: {
      ownerId:
        order.userId,

      status:
        "owned",

      price: null,
    },
  });

  /**
   * -------------------------------------------------------
   * CLOSE PURCHASED LISTING
   * -------------------------------------------------------
   */

  if (order.listingId) {
    await tx.parcelListing.updateMany({
      where: {
        id: order.listingId,
        active: true,
      },

      data: {
        active: false,
      },
    });
  }

  /**
   * -------------------------------------------------------
   * CLOSE ANY OTHER ACTIVE LISTINGS
   * -------------------------------------------------------
   *
   * A parcel should never remain purchasable through an
   * older active listing after ownership transfers.
   */

  await tx.parcelListing.updateMany({
    where: {
      parcelId:
        order.productId,

      active: true,
    },

    data: {
      active: false,
    },
  });

  /**
   * -------------------------------------------------------
   * RETURN AUTHORITATIVE RESULT
   * -------------------------------------------------------
   */

  return {
    entitlement,

    alreadyGranted: false,
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
  return prisma.marketplacePayment.findFirst({
    where: {
      id: paymentId,
      userId,
    },

    include: {
      order: {
        include: {
          product: {
            select: {
              id: true,
              estateId: true,
              x: true,
              y: true,
              name: true,
              status: true,
            },
          },
        },
      },

      events: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}
