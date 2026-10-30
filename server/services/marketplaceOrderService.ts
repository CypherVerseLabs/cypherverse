import { Prisma, ParcelStatus, ParcelType, MarketplaceOrderStatus } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

export const MARKETPLACE_OPERATION = { CREATE_PARCEL_ORDER: "CREATE_PARCEL_ORDER" } as const;
export const MARKETPLACE_CURRENCY = "USD";
export const PRIMARY_MARKETPLACE_SELLER_EMAIL = "marketplace@cypherverse.test";
export const PRIMARY_MIN_PRICE = new Prisma.Decimal("20.00");
export const PRIMARY_MAX_PRICE = new Prisma.Decimal("50.00");

export class MarketplaceError extends Error {
  public readonly code: string;
  constructor(code: string, message: string = code) { super(message); this.name = "MarketplaceError"; this.code = code; }
}

export interface CreateParcelOrderInput { userId: string; parcelId: string; listingId?: string | null; idempotencyKey: string; }

function validateIdempotencyKey(key: string): string {
  const normalized = key.trim();
  if (!normalized) throw new MarketplaceError("IDEMPOTENCY_KEY_REQUIRED", "An idempotency key is required.");
  if (normalized.length > 255) throw new MarketplaceError("IDEMPOTENCY_KEY_TOO_LONG", "The idempotency key is too long.");
  return normalized;
}

async function getExistingIdempotentOrder(userId: string, operation: string, key: string) {
  const record = await prisma.marketplaceIdempotencyKey.findUnique({
    where: { userId_operation_key: { userId, operation, key } },
    include: { order: { include: { product: true, listing: true, payments: { orderBy: { createdAt: "desc" } }, entitlements: true } } },
  });
  return record?.order ?? null;
}

async function getPrimarySeller(tx: Prisma.TransactionClient) {
  const seller = await tx.user.findUnique({ where: { email: PRIMARY_MARKETPLACE_SELLER_EMAIL }, select: { id: true } });
  if (!seller) throw new MarketplaceError("PRIMARY_MARKETPLACE_SELLER_NOT_CONFIGURED", "The primary marketplace seller identity is not configured.");
  return seller.id;
}

function validatePrimaryPrice(price: Prisma.Decimal | null) {
  if (!price || price.lt(PRIMARY_MIN_PRICE) || price.gt(PRIMARY_MAX_PRICE)) {
    throw new MarketplaceError("INVALID_PRIMARY_PARCEL_PRICE", "Primary parcel inventory must have a price between $20.00 and $50.00.");
  }
}

export async function createParcelOrder(input: CreateParcelOrderInput) {
  const userId = input.userId.trim();
  const parcelId = input.parcelId.trim();
  const idempotencyKey = validateIdempotencyKey(input.idempotencyKey);
  if (!userId) throw new MarketplaceError("USER_ID_REQUIRED");
  if (!parcelId) throw new MarketplaceError("PARCEL_ID_REQUIRED");

  const existing = await getExistingIdempotentOrder(userId, MARKETPLACE_OPERATION.CREATE_PARCEL_ORDER, idempotencyKey);
  if (existing) return existing;

  return prisma.$transaction(async (tx) => {
    const existingKey = await tx.marketplaceIdempotencyKey.findUnique({
      where: { userId_operation_key: { userId, operation: MARKETPLACE_OPERATION.CREATE_PARCEL_ORDER, key: idempotencyKey } },
      include: { order: { include: { product: true, listing: true, payments: true, entitlements: true } } },
    });
    if (existingKey?.order) return existingKey.order;

    const parcel = await tx.parcel.findUnique({ where: { id: parcelId } });
    if (!parcel) throw new MarketplaceError("PARCEL_NOT_FOUND", "Parcel not found.");
    if (parcel.type === ParcelType.CITY_LANDMARK) throw new MarketplaceError("CITY_LANDMARK_NOT_FOR_SALE", "City landmarks cannot be listed or purchased.");
    if (parcel.status !== ParcelStatus.for_sale) throw new MarketplaceError("PARCEL_NOT_FOR_SALE", "Parcel is not currently for sale.");
    if (parcel.ownerId === userId) throw new MarketplaceError("CANNOT_BUY_OWN_PARCEL", "You cannot purchase your own parcel.");

    let sellerId: string;
    let listingId: string | null = null;
    let amount: Prisma.Decimal;

    if (parcel.ownerId === null) {
      if (input.listingId) throw new MarketplaceError("PRIMARY_PARCEL_HAS_NO_LISTING", "Primary CypherVerse inventory is purchased without a parcel listing.");
      const activeListings = await tx.parcelListing.count({ where: { parcelId, active: true } });
      if (activeListings > 0) throw new MarketplaceError("PRIMARY_PARCEL_LISTING_CONFLICT", "Primary parcel inventory cannot have an active resale listing.");
      validatePrimaryPrice(parcel.price);
      sellerId = await getPrimarySeller(tx);
      amount = new Prisma.Decimal(parcel.price!);
    } else {
      const activeListings = await tx.parcelListing.findMany({ where: { parcelId, active: true }, orderBy: { createdAt: "desc" }, take: 2 });
      if (activeListings.length === 0) throw new MarketplaceError("ACTIVE_LISTING_NOT_FOUND", "No active listing exists for this parcel.");
      if (activeListings.length > 1) throw new MarketplaceError("MULTIPLE_ACTIVE_LISTINGS", "Parcel has multiple active listings.");
      const listing = activeListings[0];
      if (input.listingId && listing.id !== input.listingId) throw new MarketplaceError("LISTING_CHANGED", "The requested listing is no longer active.");
      if (parcel.ownerId !== listing.sellerId) throw new MarketplaceError("LISTING_OWNER_MISMATCH", "Listing seller does not own the parcel.");
      if (!listing.price || listing.price.lte(0)) throw new MarketplaceError("INVALID_LISTING_PRICE", "The parcel listing has an invalid price.");
      sellerId = listing.sellerId;
      listingId = listing.id;
      amount = new Prisma.Decimal(listing.price);
    }

    const order = await tx.marketplaceOrder.create({
      data: { userId, productId: parcel.id, listingId, sellerId, quantity: 1, amount, currency: MARKETPLACE_CURRENCY, status: MarketplaceOrderStatus.PENDING },
    });

    try {
      await tx.marketplaceIdempotencyKey.create({
        data: { userId, operation: MARKETPLACE_OPERATION.CREATE_PARCEL_ORDER, key: idempotencyKey, orderId: order.id, responseStatus: 201, responseJson: { orderId: order.id } },
      });
    } catch (error) {
      const concurrent = await tx.marketplaceIdempotencyKey.findUnique({
        where: { userId_operation_key: { userId, operation: MARKETPLACE_OPERATION.CREATE_PARCEL_ORDER, key: idempotencyKey } },
        include: { order: { include: { product: true, listing: true, payments: true, entitlements: true } } },
      });
      if (concurrent?.order) return concurrent.order;
      throw error;
    }

    return tx.marketplaceOrder.findUniqueOrThrow({ where: { id: order.id }, include: { product: true, listing: true, payments: { orderBy: { createdAt: "desc" } }, entitlements: true } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function cancelMarketplaceOrder(orderId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.marketplaceOrder.findFirst({ where: { id: orderId, userId } });
    if (!order) return null;
    if ([MarketplaceOrderStatus.PAID, MarketplaceOrderStatus.GRANTED].includes(order.status)) throw new MarketplaceError("ORDER_ALREADY_PAID", "A paid order cannot be cancelled.");
    if ([MarketplaceOrderStatus.CANCELLED, MarketplaceOrderStatus.FAILED].includes(order.status)) return order;
    return tx.marketplaceOrder.update({ where: { id: order.id }, data: { status: MarketplaceOrderStatus.CANCELLED } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function getMarketplaceOrderById(orderId: string, userId: string) {
  return prisma.marketplaceOrder.findFirst({ where: { id: orderId, userId }, include: { product: { include: { owner: { select: { id: true, address: true, username: true } } } }, listing: { include: { seller: { select: { id: true, address: true, username: true } } } }, payments: { orderBy: { createdAt: "desc" } }, entitlements: { orderBy: { createdAt: "desc" } }, paymentEvents: { orderBy: { createdAt: "desc" } } } });
}

export async function getMarketplaceOrdersForUser(userId: string) {
  return prisma.marketplaceOrder.findMany({
    where: { userId }, orderBy: { createdAt: "desc" },
    include: {
      product: { select: { id: true, estateId: true, x: true, y: true, name: true, description: true, status: true, price: true } },
      listing: { select: { id: true, price: true, active: true, createdAt: true } },
      payments: { select: { id: true, providerTransactionId: true, amount: true, currency: true, status: true, environment: true, createdAt: true, paidAt: true, failedAt: true, cancelledAt: true }, orderBy: { createdAt: "desc" } },
      entitlements: { select: { id: true, productId: true, quantity: true, status: true, grantedAt: true } },
    },
  });
}
