import { Prisma, ParcelStatus, ParcelType, MarketplaceOrderStatus, MarketplacePaymentStatus, MarketplacePaymentEnvironment } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { MarketplaceError } from "./marketplaceOrderService.js";
import { createCyphLedgerTransaction } from "./cyphLedgerService.js";

export const MARKETPLACE_PAYMENT_OPERATION = { CREATE_PAYMENT: "CREATE_MARKETPLACE_PAYMENT" } as const;
export const MARKETPLACE_PAYMENT_ENVIRONMENT = MarketplacePaymentEnvironment.TEST;
export const PRIMARY_MARKETPLACE_SELLER_EMAIL = "marketplace@cypherverse.test";

function createTestTransactionId(): string { return `test_tx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`; }
function createTestEventId(): string { return `test_event_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`; }

export async function createMarketplacePayment(orderId: string, userId: string) {
  if (!orderId.trim()) throw new MarketplaceError("ORDER_ID_REQUIRED");
  if (!userId.trim()) throw new MarketplaceError("USER_ID_REQUIRED");
  return prisma.$transaction(async (tx) => {
    const order = await tx.marketplaceOrder.findFirst({ where: { id: orderId, userId }, include: { payments: { where: { status: MarketplacePaymentStatus.PENDING }, orderBy: { createdAt: "desc" }, take: 1 } } });
    if (!order) throw new MarketplaceError("ORDER_NOT_FOUND", "Marketplace order not found.");
    if (order.status === MarketplaceOrderStatus.CANCELLED) throw new MarketplaceError("ORDER_CANCELLED", "The order has been cancelled.");
    if (order.status === MarketplaceOrderStatus.FAILED) throw new MarketplaceError("ORDER_FAILED", "The order has failed.");
    if (order.status === MarketplaceOrderStatus.GRANTED) throw new MarketplaceError("ORDER_ALREADY_GRANTED", "The order has already been granted.");
    if (order.payments[0]) return order.payments[0];
    const payment = await tx.marketplacePayment.create({ data: { orderId: order.id, userId: order.userId, providerTransactionId: createTestTransactionId(), amount: new Prisma.Decimal(order.amount), currency: order.currency, status: MarketplacePaymentStatus.PENDING, environment: MARKETPLACE_PAYMENT_ENVIRONMENT } });
    await tx.marketplaceOrder.update({ where: { id: order.id }, data: { status: MarketplaceOrderStatus.PAYMENT_PROCESSING } });
    return payment;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function getMarketplacePaymentById(paymentId: string, userId: string) {
  return prisma.marketplacePayment.findFirst({ where: { id: paymentId, userId }, include: { order: { include: { product: true, listing: true } }, events: { orderBy: { createdAt: "desc" } } } });
}

export async function confirmTestMarketplacePayment(paymentId: string, userId: string) {
  if (!paymentId.trim()) throw new MarketplaceError("PAYMENT_ID_REQUIRED");
  if (!userId.trim()) throw new MarketplaceError("USER_ID_REQUIRED");
  return processMarketplacePaymentEvent({ providerEventId: createTestEventId(), paymentId, userId, status: MarketplacePaymentStatus.PAID, environment: MarketplacePaymentEnvironment.TEST });
}
export async function failTestMarketplacePayment(paymentId: string, userId: string) {
  if (!paymentId.trim()) throw new MarketplaceError("PAYMENT_ID_REQUIRED");
  if (!userId.trim()) throw new MarketplaceError("USER_ID_REQUIRED");
  return processMarketplacePaymentEvent({ providerEventId: createTestEventId(), paymentId, userId, status: MarketplacePaymentStatus.FAILED, environment: MarketplacePaymentEnvironment.TEST });
}
export async function cancelTestMarketplacePayment(paymentId: string, userId: string) {
  if (!paymentId.trim()) throw new MarketplaceError("PAYMENT_ID_REQUIRED");
  if (!userId.trim()) throw new MarketplaceError("USER_ID_REQUIRED");
  return processMarketplacePaymentEvent({ providerEventId: createTestEventId(), paymentId, userId, status: MarketplacePaymentStatus.CANCELLED, environment: MarketplacePaymentEnvironment.TEST });
}

interface PaymentEventInput { providerEventId: string; paymentId: string; userId: string; status: MarketplacePaymentStatus; environment: MarketplacePaymentEnvironment; }

export async function processMarketplacePaymentEvent(input: PaymentEventInput) {
  return prisma.$transaction(async (tx) => {
    const existingEvent = await tx.marketplacePaymentEvent.findUnique({ where: { providerEventId: input.providerEventId } });
    if (existingEvent) return { duplicate: true, event: existingEvent };
    const payment = await tx.marketplacePayment.findUnique({ where: { id: input.paymentId }, include: { order: true } });
    if (!payment) throw new MarketplaceError("PAYMENT_NOT_FOUND", "Payment not found.");
    if (payment.userId !== input.userId) throw new MarketplaceError("PAYMENT_NOT_OWNED", "Payment does not belong to this user.");
    if (payment.environment !== input.environment) throw new MarketplaceError("PAYMENT_ENVIRONMENT_MISMATCH", "Payment environment mismatch.");
    if (!payment.amount.equals(payment.order.amount)) throw new MarketplaceError("PAYMENT_AMOUNT_MISMATCH", "Payment amount does not match the order.");
    const event = await tx.marketplacePaymentEvent.create({ data: { providerEventId: input.providerEventId, providerTransactionId: payment.providerTransactionId, orderId: payment.orderId, userId: payment.userId, status: input.status, environment: input.environment } });
    if (payment.status === MarketplacePaymentStatus.PAID) {
      if (input.status !== MarketplacePaymentStatus.PAID) throw new MarketplaceError("PAYMENT_ALREADY_PAID", "Payment is already paid.");
      await tx.marketplacePaymentEvent.update({ where: { id: event.id }, data: { processed: true, processedAt: new Date() } });
      return { duplicate: false, alreadyFinal: true, event, payment };
    }
    if (payment.status === MarketplacePaymentStatus.CANCELLED) throw new MarketplaceError("PAYMENT_ALREADY_CANCELLED", "Payment is already cancelled.");
    if (payment.status === MarketplacePaymentStatus.FAILED && input.status === MarketplacePaymentStatus.PAID) throw new MarketplaceError("PAYMENT_ALREADY_FAILED", "Payment is already failed.");
    if (input.status === MarketplacePaymentStatus.PAID) {
      const updatedPayment = await tx.marketplacePayment.update({ where: { id: payment.id }, data: { status: MarketplacePaymentStatus.PAID, paidAt: new Date(), failedAt: null, cancelledAt: null } });
      await tx.marketplaceOrder.update({ where: { id: payment.orderId }, data: { status: MarketplaceOrderStatus.PAID } });
      const grant = await grantMarketplaceEntitlement(tx, payment.orderId);
      await tx.marketplaceOrder.update({ where: { id: payment.orderId }, data: { status: MarketplaceOrderStatus.GRANTED } });
      await tx.marketplacePaymentEvent.update({ where: { id: event.id }, data: { processed: true, processedAt: new Date() } });
      return { duplicate: false, event, payment: updatedPayment, grant };
    }
    if (input.status === MarketplacePaymentStatus.FAILED) {
      const updatedPayment = await tx.marketplacePayment.update({ where: { id: payment.id }, data: { status: MarketplacePaymentStatus.FAILED, failedAt: new Date() } });
      await tx.marketplaceOrder.update({ where: { id: payment.orderId }, data: { status: MarketplaceOrderStatus.FAILED } });
      await tx.marketplacePaymentEvent.update({ where: { id: event.id }, data: { processed: true, processedAt: new Date() } });
      return { duplicate: false, event, payment: updatedPayment };
    }
    if (input.status === MarketplacePaymentStatus.CANCELLED) {
      const updatedPayment = await tx.marketplacePayment.update({ where: { id: payment.id }, data: { status: MarketplacePaymentStatus.CANCELLED, cancelledAt: new Date() } });
      await tx.marketplaceOrder.update({ where: { id: payment.orderId }, data: { status: MarketplaceOrderStatus.CANCELLED } });
      await tx.marketplacePaymentEvent.update({ where: { id: event.id }, data: { processed: true, processedAt: new Date() } });
      return { duplicate: false, event, payment: updatedPayment };
    }
    throw new MarketplaceError("UNSUPPORTED_PAYMENT_STATUS", "Unsupported payment status.");
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

async function grantMarketplaceEntitlement(tx: Prisma.TransactionClient, orderId: string) {
  const order = await tx.marketplaceOrder.findUnique({ where: { id: orderId }, include: { product: true, listing: true, entitlements: { where: { status: "GRANTED" }, take: 1 } } });
  if (!order) throw new MarketplaceError("ORDER_NOT_FOUND", "Order not found.");
  const primarySeller = await tx.user.findUnique({ where: { email: PRIMARY_MARKETPLACE_SELLER_EMAIL }, select: { id: true } });
  if (!primarySeller) throw new MarketplaceError("PRIMARY_MARKETPLACE_SELLER_NOT_CONFIGURED", "The primary marketplace seller identity is not configured.");

  const existingEntitlement = order.entitlements[0];
  if (existingEntitlement) {
    if (order.product.ownerId !== order.userId || order.product.status !== ParcelStatus.owned || order.product.price !== null) {
      await tx.parcel.update({ where: { id: order.productId }, data: { ownerId: order.userId, status: ParcelStatus.owned, price: null } });
    }
    return { entitlement: existingEntitlement, alreadyGranted: true };
  }

  const parcel = await tx.parcel.findUnique({ where: { id: order.productId } });
  if (!parcel) throw new MarketplaceError("PARCEL_NOT_FOUND", "Parcel not found.");
  if (parcel.type === ParcelType.CITY_LANDMARK) throw new MarketplaceError("CITY_LANDMARK_NOT_FOR_SALE", "City landmarks cannot be purchased.");
  if (parcel.ownerId === order.userId) throw new MarketplaceError("PARCEL_ALREADY_OWNED", "The buyer already owns this parcel.");

  const isPrimary = order.listingId === null;
  if (isPrimary) {
    if (order.sellerId !== primarySeller.id) throw new MarketplaceError("PRIMARY_SELLER_MISMATCH", "Primary order seller is invalid.");
    if (parcel.ownerId !== null || parcel.status !== ParcelStatus.for_sale || parcel.price === null || !parcel.price.equals(order.amount)) throw new MarketplaceError("PRIMARY_PARCEL_STATE_CHANGED", "Primary parcel inventory changed before payment completed.");
  } else {
    const listing = order.listing;
    if (!listing || !listing.active) throw new MarketplaceError("LISTING_NOT_ACTIVE", "The purchased listing is no longer active.");
    if (listing.sellerId !== order.sellerId) throw new MarketplaceError("ORDER_SELLER_MISMATCH", "Order seller does not match the listing seller.");
    if (parcel.ownerId !== listing.sellerId) throw new MarketplaceError("LISTING_OWNER_MISMATCH", "Listing seller does not own the parcel.");
    if (!listing.price.equals(order.amount)) throw new MarketplaceError("LISTING_PRICE_CHANGED", "The listing price changed before payment completed.");
    if (parcel.status !== ParcelStatus.for_sale) throw new MarketplaceError("PARCEL_NOT_FOR_SALE", "Parcel is not currently for sale.");
  }

  const entitlement = await tx.marketplaceEntitlement.create({ data: { userId: order.userId, productId: order.productId, orderId: order.id, quantity: 1, status: "GRANTED" } });
  const transfer = await tx.parcel.updateMany({
    where: isPrimary ? { id: parcel.id, ownerId: null, status: ParcelStatus.for_sale, price: order.amount } : { id: parcel.id, ownerId: order.sellerId, status: ParcelStatus.for_sale },
    data: { ownerId: order.userId, status: ParcelStatus.owned, price: null },
  });
  if (transfer.count !== 1) throw new MarketplaceError("PARCEL_TRANSFER_CONFLICT", "Parcel ownership changed during purchase.");

  const priorHistory = await tx.parcelOwnershipHistory.findFirst({ where: { marketplaceOrderId: order.id } });
  if (!priorHistory) {
    await tx.parcelOwnershipHistory.create({ data: { parcelId: parcel.id, previousOwnerId: isPrimary ? null : order.sellerId, newOwnerId: order.userId, source: isPrimary ? "MARKETPLACE_PRIMARY_INVENTORY" : "MARKETPLACE_PURCHASE", marketplaceOrderId: order.id } });
  }

  if (order.listingId) {
    await tx.parcelListing.updateMany({ where: { id: order.listingId, active: true }, data: { active: false } });
    await tx.parcelListing.updateMany({ where: { parcelId: parcel.id, active: true }, data: { active: false } });
  }

  return { entitlement, alreadyGranted: false };
}

/**
 * =========================================================
 * CYPH LEDGER PAYMENT
 * =========================================================
 *
 * 1 CYPH = 1 USD.
 *
 * The order amount is authoritative.
 * No amount or balance is accepted from the client.
 *
 * Debit, ledger entry, payment, event and entitlement
 * are committed in ONE database transaction.
 *
 * No account is automatically created or funded.
 */

const CYPH_USD_CONVERSION_RATE = new Prisma.Decimal("0.10000000");
const CYPH_PER_USD = new Prisma.Decimal(10);
const CYPH_PAYMENT_MAX_RETRIES = 3;

function getCyphAmountFromUsd(sourceAmount: Prisma.Decimal): Prisma.Decimal {
  // 1 CYPH has a reference value of USD 0.10; this is a payment conversion,
  // not a redemption promise. Multiplication avoids floating-point rounding.
  return sourceAmount.mul(CYPH_PER_USD);
}

function assertCyphOrderCanBeQuoted(order: {
  currency: string;
  amount: Prisma.Decimal;
  status: MarketplaceOrderStatus;
  payments: unknown[];
}) {
  if (order.currency !== "USD") {
    throw new MarketplaceError(
      "ORDER_CURRENCY_UNSUPPORTED",
      "CYPH payments require a USD-denominated marketplace order."
    );
  }

  if (order.amount.lte(0)) {
    throw new MarketplaceError(
      "INVALID_ORDER_AMOUNT",
      "The marketplace order amount must be greater than zero."
    );
  }

  if (order.status === MarketplaceOrderStatus.CANCELLED) {
    throw new MarketplaceError("ORDER_CANCELLED", "The order has been cancelled.");
  }
  if (order.status === MarketplaceOrderStatus.FAILED) {
    throw new MarketplaceError("ORDER_FAILED", "The order has failed.");
  }
  if (
    order.status === MarketplaceOrderStatus.PAID ||
    order.status === MarketplaceOrderStatus.GRANTED
  ) {
    throw new MarketplaceError("ORDER_ALREADY_PAID", "This order has already been paid.");
  }
  if (order.status !== MarketplaceOrderStatus.PENDING) {
    throw new MarketplaceError(
      "ORDER_PAYMENT_ALREADY_STARTED",
      "This order is not available for a new CYPH payment."
    );
  }
  if (order.payments.length > 0) {
    throw new MarketplaceError(
      "ORDER_PAYMENT_ALREADY_STARTED",
      "A payment has already been started for this order."
    );
  }
}

/**
 * Returns a server-calculated CYPH quote for an owned USD marketplace order.
 * The quote does not reserve funds or create a payment.
 */
export async function getMarketplaceOrderCyphQuote(orderId: string, userId: string) {
  if (!orderId.trim()) throw new MarketplaceError("ORDER_ID_REQUIRED");
  if (!userId.trim()) throw new MarketplaceError("USER_ID_REQUIRED");

  const order = await prisma.marketplaceOrder.findFirst({
    where: { id: orderId, userId },
    include: { payments: true },
  });

  if (!order) {
    throw new MarketplaceError("ORDER_NOT_FOUND", "Marketplace order not found.");
  }

  assertCyphOrderCanBeQuoted(order);

  const sourceAmount = new Prisma.Decimal(order.amount);
  const amount = getCyphAmountFromUsd(sourceAmount);

  return {
    orderId: order.id,
    sourceAmount: sourceAmount.toFixed(2),
    sourceCurrency: "USD",
    conversionRate: CYPH_USD_CONVERSION_RATE.toFixed(8),
    amount: amount.toFixed(8),
    currency: "CYPH",
  };
}

function isRetryableCyphPaymentError(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("code" in error)) return false;
  const code = (error as { code?: unknown }).code;
  // Retry the entire transaction only. Prisma aborts a transaction after
  // serialization/unique races; never continue inside the failed transaction.
  return code === "P2034" || code === "P2002";
}

/**
 * Pays an authoritative USD order using CYPH.
 *
 * The server calculates USD multiplied by 10. The client supplies only the
 * order ID. Debit, ledger entries, payment snapshot, event, and entitlement
 * settlement commit in one transaction.
 */
export async function payMarketplaceOrderWithCyph(
  orderId: string,
  userId: string
) {
  if (!orderId.trim()) throw new MarketplaceError("ORDER_ID_REQUIRED");
  if (!userId.trim()) throw new MarketplaceError("USER_ID_REQUIRED");

  for (let attempt = 1; attempt <= CYPH_PAYMENT_MAX_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const order = await tx.marketplaceOrder.findFirst({
            where: { id: orderId, userId },
            include: { payments: true },
          });

          if (!order) {
            throw new MarketplaceError("ORDER_NOT_FOUND", "Marketplace order not found.");
          }

          if (order.currency !== "USD") {
            throw new MarketplaceError(
              "ORDER_CURRENCY_UNSUPPORTED",
              "CYPH payments require a USD-denominated marketplace order."
            );
          }

          const sourceAmount = new Prisma.Decimal(order.amount);
          if (sourceAmount.lte(0)) {
            throw new MarketplaceError(
              "INVALID_ORDER_AMOUNT",
              "The marketplace order amount must be greater than zero."
            );
          }

          const amount = getCyphAmountFromUsd(sourceAmount);
          const ledgerIdempotencyKey = "marketplace-order:" + order.id + ":cyph-debit";
          const providerTransactionId = "cyph_order_" + order.id;
          const providerEventId = "cyph_event_" + order.id;

          // A committed CYPH payment is an idempotent success. Check this
          // before generic order-state and cross-rail guards.
          const existingCyphPayment = await tx.marketplacePayment.findFirst({
            where: { orderId: order.id, userId, currency: "CYPH" },
          });

          if (
            existingCyphPayment?.status === MarketplacePaymentStatus.PAID &&
            order.status === MarketplaceOrderStatus.GRANTED
          ) {
            const account = await tx.cyphAccount.findUnique({ where: { userId } });
            return {
              alreadyPaid: true,
              order,
              payment: existingCyphPayment,
              balance: account?.balance.toString() ?? null,
            };
          }

          assertCyphOrderCanBeQuoted(order);

          if (existingCyphPayment) {
            throw new MarketplaceError(
              "CYPH_LEDGER_STATE_CONFLICT",
              "A CYPH payment record exists but the order is not in a completed state."
            );
          }

          const account = await tx.cyphAccount.findUnique({ where: { userId } });
          if (!account) {
            throw new MarketplaceError(
              "CYPH_ACCOUNT_NOT_FOUND",
              "No funded CYPH account exists for this user."
            );
          }

          const existingLedgerEntry = await tx.cyphLedgerEntry.findUnique({
            where: { idempotencyKey: ledgerIdempotencyKey },
          });
          if (existingLedgerEntry) {
            throw new MarketplaceError(
              "CYPH_LEDGER_STATE_CONFLICT",
              "A CYPH debit already exists for this order, but its payment state is inconsistent."
            );
          }

          const debit = await tx.cyphAccount.updateMany({
            where: {
              id: account.id,
              userId,
              balance: { gte: amount },
            },
            data: { balance: { decrement: amount } },
          });

          if (debit.count !== 1) {
            throw new MarketplaceError(
              "CYPH_INSUFFICIENT_BALANCE",
              "Your CYPH balance is insufficient for this purchase."
            );
          }

          await tx.cyphLedgerEntry.create({
            data: {
              userId,
              accountId: account.id,
              amount: amount.negated(),
              type: "MARKETPLACE_PAYMENT",
              referenceType: "MARKETPLACE_ORDER",
              referenceId: order.id,
              idempotencyKey: ledgerIdempotencyKey,
            },
          });

          const marketplaceRevenueAccount = await tx.cyphAccount.findUnique({
            where: { systemCode: "CYPH_MARKETPLACE_REVENUE" },
            select: { id: true },
          });
          if (!marketplaceRevenueAccount) {
            throw new MarketplaceError(
              "CYPH_SYSTEM_ACCOUNT_MISSING",
              "The CYPH marketplace revenue account is missing."
            );
          }

          const journal = await createCyphLedgerTransaction(tx, {
            type: "MARKETPLACE_PAYMENT",
            idempotencyKey: "marketplace-order:" + order.id + ":cyph-journal",
            actorUserId: userId,
            referenceType: "MARKETPLACE_ORDER",
            referenceId: order.id,
            reason: "Marketplace order paid with CYPH.",
            postings: [
              { accountId: account.id, amount: amount.negated() },
              { accountId: marketplaceRevenueAccount.id, amount },
            ],
          });

          if (journal.duplicate) {
            throw new MarketplaceError(
              "CYPH_LEDGER_STATE_CONFLICT",
              "A CYPH journal already exists without a matching completed marketplace payment."
            );
          }

          const now = new Date();
          const payment = await tx.marketplacePayment.create({
            data: {
              orderId: order.id,
              userId,
              providerTransactionId,
              amount,
              currency: "CYPH",
              sourceAmount,
              sourceCurrency: "USD",
              conversionRate: CYPH_USD_CONVERSION_RATE,
              status: MarketplacePaymentStatus.PAID,
              environment: MarketplacePaymentEnvironment.TEST,
              paidAt: now,
            },
          });

          await tx.marketplacePaymentEvent.create({
            data: {
              providerEventId,
              providerTransactionId,
              orderId: order.id,
              userId,
              status: MarketplacePaymentStatus.PAID,
              environment: MarketplacePaymentEnvironment.TEST,
              processed: true,
              processedAt: now,
            },
          });

          await tx.marketplaceOrder.update({
            where: { id: order.id },
            data: { status: MarketplaceOrderStatus.PAID },
          });

          const grant = await grantMarketplaceEntitlement(tx, order.id);
          const updatedOrder = await tx.marketplaceOrder.update({
            where: { id: order.id },
            data: { status: MarketplaceOrderStatus.GRANTED },
            include: {
              product: true,
              listing: true,
              payments: { orderBy: { createdAt: "desc" } },
              entitlements: true,
            },
          });

          const updatedAccount = await tx.cyphAccount.findUniqueOrThrow({
            where: { id: account.id },
          });

          return {
            alreadyPaid: false,
            order: updatedOrder,
            payment,
            balance: updatedAccount.balance.toString(),
            grant,
          };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (error) {
      if (!isRetryableCyphPaymentError(error)) {
        throw error;
      }
      if (attempt === CYPH_PAYMENT_MAX_RETRIES) {
        throw new MarketplaceError(
          "CYPH_PAYMENT_RETRY_EXHAUSTED",
          "The CYPH payment could not be completed after concurrent updates. Please retry."
        );
      }
    }
  }

  throw new MarketplaceError(
    "CYPH_PAYMENT_RETRY_EXHAUSTED",
    "The CYPH payment could not be completed after concurrent updates. Please retry."
  );
}
