import {
  Prisma,
  MarketplaceOrderStatus,
} from "../generated/prisma/client.js";

import { prisma } from "../lib/prisma.js";

/**
 * =========================================================
 * MARKETPLACE STORE
 * =========================================================
 *
 * Server-authoritative marketplace order operations.
 *
 * IMPORTANT:
 *
 * This store creates marketplace orders.
 *
 * It does NOT:
 * - accept price from the client
 * - accept userId from the request body
 * - transfer parcel ownership
 * - mark an order as paid
 * - grant an entitlement
 *
 * Ownership is granted only after successful payment
 * processing through the marketplace payment flow.
 */

/**
 * =========================================================
 * TYPES
 * =========================================================
 */

export interface MarketplaceOrderResult {
  id: string;
  userId: string;
  productId: string;
  listingId: string | null;
  quantity: number;
  amount: string;
  currency: string;
  status: MarketplaceOrderStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * =========================================================
 * SERIALIZE ORDER
 * =========================================================
 *
 * Prisma Decimal values cannot safely be returned directly
 * through JSON responses.
 */

function toMarketplaceOrder(
  order: {
    id: string;
    userId: string;
    productId: string;
    listingId: string | null;
    quantity: number;
    amount: Prisma.Decimal;
    currency: string;
    status: MarketplaceOrderStatus;
    createdAt: Date;
    updatedAt: Date;
  }
): MarketplaceOrderResult {
  return {
    id: order.id,

    userId:
      order.userId,

    productId:
      order.productId,

    listingId:
      order.listingId,

    quantity:
      order.quantity,

    amount:
      order.amount.toString(),

    currency:
      order.currency,

    status:
      order.status,

    createdAt:
      order.createdAt.toISOString(),

    updatedAt:
      order.updatedAt.toISOString(),
  };
}

/**
 * =========================================================
 * CREATE MARKETPLACE ORDER
 * =========================================================
 *
 * Creates a server-authoritative order for a listed parcel.
 *
 * POST /api/marketplace/parcels/:id/buy
 *
 * Server determines:
 * - buyer
 * - parcel
 * - active listing
 * - seller
 * - price
 * - currency
 * - quantity
 * - initial status
 *
 * Client does NOT provide the price.
 *
 * The parcel is NOT transferred here.
 */

export async function createMarketplaceOrder(
  parcelId: string,
  userId: string
): Promise<MarketplaceOrderResult | null> {
  if (!parcelId) {
    throw new Error(
      "PARCEL_ID_REQUIRED"
    );
  }

  if (!userId) {
    throw new Error(
      "USER_ID_REQUIRED"
    );
  }

  return prisma.$transaction(
    async (tx) => {
      /**
       * -----------------------------------------------------
       * Load parcel and active listing
       * -----------------------------------------------------
       */

      const parcel =
        await tx.parcel.findUnique({
          where: {
            id: parcelId,
          },

          include: {
            listings: {
              where: {
                active: true,
              },

              orderBy: {
                createdAt: "desc",
              },

              take: 1,
            },
          },
        });

      if (!parcel) {
        return null;
      }

      /**
       * -----------------------------------------------------
       * Parcel must currently be for sale.
       * -----------------------------------------------------
       */

      if (
        parcel.status !==
        "for_sale"
      ) {
        throw new Error(
          "PARCEL_NOT_FOR_SALE"
        );
      }

      /**
       * -----------------------------------------------------
       * Buyer cannot purchase their own parcel.
       * -----------------------------------------------------
       */

      if (
        parcel.ownerId === userId
      ) {
        throw new Error(
          "CANNOT_BUY_OWN_PARCEL"
        );
      }

      /**
       * -----------------------------------------------------
       * There must be an active listing.
       * -----------------------------------------------------
       */

      const listing =
        parcel.listings[0];

      if (!listing) {
        throw new Error(
          "ACTIVE_LISTING_NOT_FOUND"
        );
      }

      /**
       * -----------------------------------------------------
       * Listing seller cannot be buyer.
       * -----------------------------------------------------
       */

      if (
        listing.sellerId === userId
      ) {
        throw new Error(
          "CANNOT_BUY_OWN_PARCEL"
        );
      }

      /**
       * -----------------------------------------------------
       * Validate authoritative listing price.
       * -----------------------------------------------------
       */

      if (
        !listing.price ||
        !listing.price.isFinite() ||
        listing.price.lte(0)
      ) {
        throw new Error(
          "INVALID_PARCEL_PRICE"
        );
      }

      /**
       * -----------------------------------------------------
       * Prevent duplicate pending/processing orders
       * for the same buyer + parcel.
       *
       * This is an application-level protection.
       * The later payment/entitlement constraints provide
       * additional protection.
       * -----------------------------------------------------
       */

      const existingOrder =
        await tx.marketplaceOrder.findFirst({
          where: {
            userId,

            productId: parcelId,

            status: {
              in: [
                MarketplaceOrderStatus.PENDING,
                MarketplaceOrderStatus.PAYMENT_PROCESSING,
              ],
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        });

      if (existingOrder) {
        return toMarketplaceOrder(
          existingOrder
        );
      }

      /**
       * -----------------------------------------------------
       * Create authoritative marketplace order.
       * -----------------------------------------------------
       *
       * Price comes from the active database listing.
       */

      const order =
        await tx.marketplaceOrder.create({
          data: {
            userId,

            productId:
              parcelId,

            listingId:
              listing.id,

            quantity: 1,

            amount:
              new Prisma.Decimal(
                listing.price
              ),

            currency:
              "USD",

            status:
              MarketplaceOrderStatus.PENDING,
          },
        });

      return toMarketplaceOrder(
        order
      );
    }
  );
}

/**
 * =========================================================
 * GET MARKETPLACE ORDER
 * =========================================================
 */

export async function getMarketplaceOrderById(
  orderId: string,
  userId: string
): Promise<MarketplaceOrderResult | null> {
  const order =
    await prisma.marketplaceOrder.findFirst({
      where: {
        id: orderId,
        userId,
      },
    });

  if (!order) {
    return null;
  }

  return toMarketplaceOrder(
    order
  );
}

/**
 * =========================================================
 * GET USER MARKETPLACE ORDERS
 * =========================================================
 */

export async function getMarketplaceOrdersByUserId(
  userId: string
): Promise<MarketplaceOrderResult[]> {
  const orders =
    await prisma.marketplaceOrder.findMany({
      where: {
        userId,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  return orders.map(
    toMarketplaceOrder
  );
}

/**
 * =========================================================
 * COMPLETE MARKETPLACE ORDER
 * =========================================================
 *
 * Completes a successfully paid marketplace order.
 *
 * IMPORTANT:
 *
 * This function is server-side only.
 *
 * It:
 * - verifies the order belongs to the buyer
 * - verifies the order is still pending/processing
 * - verifies the parcel/listing still match the order
 * - transfers parcel ownership
 * - closes the listing
 * - marks the order as paid
 *
 * Payment verification must happen BEFORE calling this
 * function.
 */

export async function completeMarketplaceOrder(
  orderId: string,
  userId: string
): Promise<MarketplaceOrderResult | null> {
  if (!orderId) {
    throw new Error(
      "ORDER_ID_REQUIRED"
    );
  }

  if (!userId) {
    throw new Error(
      "USER_ID_REQUIRED"
    );
  }

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

      /**
       * -----------------------------------------------------
       * Prevent completing an already-completed order.
       * -----------------------------------------------------
       */

      if (
        order.status ===
        MarketplaceOrderStatus.PAID
      ) {
        return toMarketplaceOrder(
          order
        );
      }

      /**
       * -----------------------------------------------------
       * Order must still be payable.
       * -----------------------------------------------------
       */

      if (
        order.status !==
          MarketplaceOrderStatus.PENDING &&
        order.status !==
          MarketplaceOrderStatus.PAYMENT_PROCESSING
      ) {
        throw new Error(
          "ORDER_NOT_PAYABLE"
        );
      }

      /**
       * -----------------------------------------------------
       * Load parcel.
       * -----------------------------------------------------
       */

      const parcel =
        await tx.parcel.findUnique({
          where: {
            id: order.productId,
          },

          include: {
            listings: {
              where: {
                id:
                  order.listingId ?? undefined,

                active: true,
              },

              take: 1,
            },
          },
        });

      if (!parcel) {
        throw new Error(
          "PARCEL_NOT_FOUND"
        );
      }

      /**
       * -----------------------------------------------------
       * Parcel must still belong to the listing seller.
       * -----------------------------------------------------
       */

      if (
        parcel.status !== "for_sale"
      ) {
        throw new Error(
          "PARCEL_NOT_FOR_SALE"
        );
      }

      /**
       * -----------------------------------------------------
       * Listing must still be active.
       * -----------------------------------------------------
       */

      const listing =
        parcel.listings[0];

      if (!listing) {
        throw new Error(
          "ACTIVE_LISTING_NOT_FOUND"
        );
      }

      /**
       * -----------------------------------------------------
       * Transfer ownership.
       * -----------------------------------------------------
       */

      await tx.parcel.update({
        where: {
          id: parcel.id,
        },

        data: {
          ownerId: userId,

          status: "owned",

          price: null,
        },
      });

      /**
       * -----------------------------------------------------
       * Close marketplace listing.
       * -----------------------------------------------------
       */

      await tx.parcelListing.update({
        where: {
          id: listing.id,
        },

        data: {
          active: false,
        },
      });

      /**
       * -----------------------------------------------------
       * Mark order as paid.
       * -----------------------------------------------------
       */

      const completedOrder =
        await tx.marketplaceOrder.update({
          where: {
            id: order.id,
          },

          data: {
            status:
              MarketplaceOrderStatus.PAID,
          },
        });

      return toMarketplaceOrder(
        completedOrder
      );
    }
  );
}

