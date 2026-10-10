import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    marketplacePayment: {
      findUnique: vi.fn(),
    },
    marketplacePaymentEvent: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

import { Prisma } from "../../generated/prisma/client.js";

import {
  confirmTestMarketplacePayment,
  processMarketplacePaymentEvent,
} from "../marketplacePaymentService.js";

describe("marketplace payment service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MARKETPLACE_TEST_PAYMENTS_ENABLED = "true";
  });

  it("rejects confirmation by a user who does not own the payment", async () => {
    prismaMock.marketplacePayment.findUnique.mockResolvedValue({
      userId: "buyer-1",
      order: {
        userId: "buyer-1",
      },
    });

    await expect(
      confirmTestMarketplacePayment("payment-1", "buyer-2"),
    ).rejects.toMatchObject({
      code: "PAYMENT_NOT_OWNED",
    });

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects confirmation when the payment does not exist", async () => {
    prismaMock.marketplacePayment.findUnique.mockResolvedValue(null);

    await expect(
      confirmTestMarketplacePayment("missing-payment", "buyer-1"),
    ).rejects.toMatchObject({
      code: "PAYMENT_NOT_FOUND",
    });

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("ignores a duplicate payment event", async () => {
    const existingEvent = {
      id: "event-1",
      externalEventId: "provider-event-1",
      processed: true,
    };

    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof prismaMock) => unknown) =>
        callback(prismaMock),
    );

    prismaMock.marketplacePaymentEvent.findUnique.mockResolvedValue(
      existingEvent,
    );

    const result = await processMarketplacePaymentEvent({
      externalEventId: "provider-event-1",
      paymentId: "payment-1",
      status: "PAID" as never,
      environment: "LOCAL" as never,
      source: "PROVIDER",
    });

    expect(result).toMatchObject({
      duplicate: true,
      event: existingEvent,
    });

    expect(
      prismaMock.marketplacePayment.findUnique,
    ).not.toHaveBeenCalled();

    expect(
      prismaMock.marketplacePaymentEvent.create,
    ).not.toHaveBeenCalled();
  });

  it("rejects an empty external event ID", async () => {
    await expect(
      processMarketplacePaymentEvent({
        externalEventId: "   ",
        paymentId: "payment-1",
        status: "PAID" as never,
        environment: "LOCAL" as never,
        source: "PROVIDER",
      }),
    ).rejects.toMatchObject({
      code: "EXTERNAL_EVENT_ID_REQUIRED",
    });
  });

  it("rejects an empty payment ID", async () => {
    await expect(
      processMarketplacePaymentEvent({
        externalEventId: "provider-event-2",
        paymentId: " ",
        status: "PAID" as never,
        environment: "LOCAL" as never,
        source: "PROVIDER",
      }),
    ).rejects.toMatchObject({
      code: "PAYMENT_ID_REQUIRED",
    });
  });

  it("rejects a late PAID event when the payment is already FAILED", async () => {
    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof prismaMock) => unknown) =>
        callback(prismaMock),
    );

    prismaMock.marketplacePaymentEvent.findUnique.mockResolvedValue(null);

    prismaMock.marketplacePayment.findUnique.mockResolvedValue({
      id: "payment-1",
      orderId: "order-1",
      userId: "buyer-1",
      externalTransactionId: "test-tx-1",
      environment: "LOCAL",
      status: "FAILED",
      amount: new Prisma.Decimal("100.00"),
      currency: "USD",
      order: {
        id: "order-1",
        userId: "buyer-1",
        status: "FAILED",
        amount: new Prisma.Decimal("100.00"),
        currency: "USD",
      },
    });

    prismaMock.marketplacePaymentEvent.create.mockResolvedValue({
      id: "event-2",
      externalEventId: "late-paid-event",
    });

    await expect(
      processMarketplacePaymentEvent({
        externalEventId: "late-paid-event",
        paymentId: "payment-1",
        status: "PAID" as never,
        environment: "LOCAL" as never,
        source: "PROVIDER",
      }),
    ).rejects.toMatchObject({
      code: "PAYMENT_ALREADY_FAILED",
    });
  });

  it("rejects a late FAILED event when the payment is already PAID", async () => {
    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof prismaMock) => unknown) =>
        callback(prismaMock),
    );

    prismaMock.marketplacePaymentEvent.findUnique.mockResolvedValue(null);

    prismaMock.marketplacePayment.findUnique.mockResolvedValue({
      id: "payment-1",
      orderId: "order-1",
      userId: "buyer-1",
      externalTransactionId: "test-tx-2",
      environment: "LOCAL",
      status: "PAID",
      amount: new Prisma.Decimal("100.00"),
      currency: "USD",
      order: {
        id: "order-1",
        userId: "buyer-1",
        status: "PAID",
        amount: new Prisma.Decimal("100.00"),
        currency: "USD",
      },
    });

    prismaMock.marketplacePaymentEvent.create.mockResolvedValue({
      id: "event-3",
      externalEventId: "late-failed-event",
    });

    await expect(
      processMarketplacePaymentEvent({
        externalEventId: "late-failed-event",
        paymentId: "payment-1",
        status: "FAILED" as never,
        environment: "LOCAL" as never,
        source: "PROVIDER",
      }),
    ).rejects.toMatchObject({
      code: "PAYMENT_ALREADY_PAID",
    });
  });
});
