import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  MarketplaceError,
  createParcelOrder,
} from "../marketplaceOrderService.js";
import { Prisma } from "../../generated/prisma/client.js";


const prismaMock = vi.hoisted(() => ({
  marketplaceIdempotencyKey: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },

  parcel: {
    findUnique: vi.fn(),
  },

  parcelListing: {
    findMany: vi.fn(),
  },

  marketplaceOrder: {
    create: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  },

  $transaction: vi.fn(),
}));

vi.mock("../../lib/prisma.js", () => ({
  prisma: prismaMock,
}));

const baseParcel = {
  id: "parcel-1",
  estateId: "estate-1",
  x: 10,
  y: 20,
  status: "for_sale",
  ownerId: "seller-1",
  price: null,
  name: "Test Parcel",
  description: "Test parcel",
  blockchainAddress: null,
  tokenId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  type: "STANDARD",
};

const baseListing = {
  id: "listing-1",
  parcelId: "parcel-1",
  sellerId: "seller-1",
  price: new Prisma.Decimal("100.00"),
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  currency: "USD",
};

const baseOrder = {
  id: "order-1",
  userId: "buyer-1",
  productId: "parcel-1",
  listingId: "listing-1",
  sellerId: "seller-1",
  quantity: 1,
  amount: "100.00",
  currency: "USD",
  status: "PENDING",
};

function setupSuccessfulTransaction() {
  prismaMock.$transaction.mockImplementation(
    async (callback: (tx: typeof prismaMock) => unknown) => {
      return callback(prismaMock);
    }
  );

  prismaMock.marketplaceIdempotencyKey.findUnique
    .mockResolvedValueOnce(null)
    .mockResolvedValue(null);

  prismaMock.parcel.findUnique.mockResolvedValue(
    baseParcel
  );

  prismaMock.parcelListing.findMany.mockResolvedValue([
    baseListing,
  ]);

  prismaMock.marketplaceOrder.create.mockResolvedValue(
    baseOrder
  );

  prismaMock.marketplaceIdempotencyKey.create.mockResolvedValue(
    {
      id: "idempotency-1",
      userId: "buyer-1",
      operation: "CREATE_PARCEL_ORDER",
      key: "test-key",
      orderId: "order-1",
    }
  );

  prismaMock.marketplaceOrder.findUniqueOrThrow.mockResolvedValue(
    baseOrder
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createParcelOrder", () => {
  it("creates a pending order using the database listing price", async () => {
    setupSuccessfulTransaction();

    const result = await createParcelOrder({
      userId: "buyer-1",
      parcelId: "parcel-1",
      idempotencyKey: "test-key",
    });

    expect(result).toEqual(baseOrder);

    expect(
      prismaMock.marketplaceOrder.create
    ).toHaveBeenCalledTimes(1);

    expect(
      prismaMock.marketplaceOrder.create
    ).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "buyer-1",
        productId: "parcel-1",
        listingId: "listing-1",
        sellerId: "seller-1",
        quantity: 1,
        amount: expect.anything(),
        currency: "USD",
        status: "PENDING",
      }),
    });
  });

  it("does not allow a user to buy their own parcel", async () => {
    setupSuccessfulTransaction();

    prismaMock.parcel.findUnique.mockResolvedValue({
      ...baseParcel,
      ownerId: "buyer-1",
    });

    await expect(
      createParcelOrder({
        userId: "buyer-1",
        parcelId: "parcel-1",
        idempotencyKey: "own-parcel-key",
      })
    ).rejects.toMatchObject({
      code: "CANNOT_BUY_OWN_PARCEL",
    });

    expect(
      prismaMock.marketplaceOrder.create
    ).not.toHaveBeenCalled();
  });

  it("rejects a parcel that does not exist", async () => {
    setupSuccessfulTransaction();

    prismaMock.parcel.findUnique.mockResolvedValue(
      null
    );

    await expect(
      createParcelOrder({
        userId: "buyer-1",
        parcelId: "missing-parcel",
        idempotencyKey: "missing-key",
      })
    ).rejects.toMatchObject({
      code: "PARCEL_NOT_FOUND",
    });

    expect(
      prismaMock.marketplaceOrder.create
    ).not.toHaveBeenCalled();
  });

  it("rejects city landmark parcels", async () => {
    setupSuccessfulTransaction();

    prismaMock.parcel.findUnique.mockResolvedValue({
      ...baseParcel,
      type: "CITY_LANDMARK",
    });

    await expect(
      createParcelOrder({
        userId: "buyer-1",
        parcelId: "landmark-1",
        idempotencyKey: "landmark-key",
      })
    ).rejects.toMatchObject({
      code: "CITY_LANDMARK_NOT_FOR_SALE",
    });

    expect(
      prismaMock.marketplaceOrder.create
    ).not.toHaveBeenCalled();
  });

  it("rejects parcels that are not for sale", async () => {
    setupSuccessfulTransaction();

    prismaMock.parcel.findUnique.mockResolvedValue({
      ...baseParcel,
      status: "owned",
    });

    await expect(
      createParcelOrder({
        userId: "buyer-1",
        parcelId: "parcel-1",
        idempotencyKey: "not-for-sale-key",
      })
    ).rejects.toMatchObject({
      code: "PARCEL_NOT_FOR_SALE",
    });

    expect(
      prismaMock.marketplaceOrder.create
    ).not.toHaveBeenCalled();
  });

  it("rejects when there is no active listing", async () => {
    setupSuccessfulTransaction();

    prismaMock.parcelListing.findMany.mockResolvedValue(
      []
    );

    await expect(
      createParcelOrder({
        userId: "buyer-1",
        parcelId: "parcel-1",
        idempotencyKey: "no-listing-key",
      })
    ).rejects.toMatchObject({
      code: "ACTIVE_LISTING_NOT_FOUND",
    });

    expect(
      prismaMock.marketplaceOrder.create
    ).not.toHaveBeenCalled();
  });

  it("rejects when multiple active listings exist", async () => {
    setupSuccessfulTransaction();

    prismaMock.parcelListing.findMany.mockResolvedValue([
      baseListing,
      {
        ...baseListing,
        id: "listing-2",
      },
    ]);

    await expect(
      createParcelOrder({
        userId: "buyer-1",
        parcelId: "parcel-1",
        idempotencyKey: "multiple-listings-key",
      })
    ).rejects.toMatchObject({
      code: "MULTIPLE_ACTIVE_LISTINGS",
    });

    expect(
      prismaMock.marketplaceOrder.create
    ).not.toHaveBeenCalled();
  });

  it("rejects when the requested listing is no longer active", async () => {
    setupSuccessfulTransaction();

    await expect(
      createParcelOrder({
        userId: "buyer-1",
        parcelId: "parcel-1",
        listingId: "different-listing",
        idempotencyKey: "changed-listing-key",
      })
    ).rejects.toMatchObject({
      code: "LISTING_CHANGED",
    });

    expect(
      prismaMock.marketplaceOrder.create
    ).not.toHaveBeenCalled();
  });

  it("rejects when the listing seller does not own the parcel", async () => {
    setupSuccessfulTransaction();

    prismaMock.parcelListing.findMany.mockResolvedValue([
      {
        ...baseListing,
        sellerId: "different-user",
      },
    ]);

    await expect(
      createParcelOrder({
        userId: "buyer-1",
        parcelId: "parcel-1",
        idempotencyKey: "seller-mismatch-key",
      })
    ).rejects.toMatchObject({
      code: "LISTING_OWNER_MISMATCH",
    });

    expect(
      prismaMock.marketplaceOrder.create
    ).not.toHaveBeenCalled();
  });

  it("rejects a listing with an invalid price", async () => {
  setupSuccessfulTransaction();

  prismaMock.parcelListing.findMany.mockResolvedValue([
    {
      ...baseListing,
      price: new Prisma.Decimal("0"),
    },
  ]);

  await expect(
    createParcelOrder({
      userId: "buyer-1",
      parcelId: "parcel-1",
      idempotencyKey: "invalid-price-key",
    })
  ).rejects.toMatchObject({
    code: "INVALID_LISTING_PRICE",
  });

  expect(
    prismaMock.marketplaceOrder.create
  ).not.toHaveBeenCalled();
});
  it("returns the existing order for an idempotent request", async () => {
    const existingOrder = {
      ...baseOrder,
      id: "existing-order",
    };

    prismaMock.marketplaceIdempotencyKey.findUnique.mockResolvedValue(
      {
        id: "idempotency-1",
        userId: "buyer-1",
        operation: "CREATE_PARCEL_ORDER",
        key: "same-key",
        orderId: "existing-order",
        order: existingOrder,
      }
    );

    const result = await createParcelOrder({
      userId: "buyer-1",
      parcelId: "parcel-1",
      idempotencyKey: "same-key",
    });

    expect(result).toEqual(existingOrder);

    expect(
      prismaMock.$transaction
    ).not.toHaveBeenCalled();

    expect(
      prismaMock.marketplaceOrder.create
    ).not.toHaveBeenCalled();
  });

  it("rejects a missing idempotency key", async () => {
    await expect(
      createParcelOrder({
        userId: "buyer-1",
        parcelId: "parcel-1",
        idempotencyKey: "",
      })
    ).rejects.toMatchObject({
      code: "IDEMPOTENCY_KEY_REQUIRED",
    });
  });

  it("rejects a whitespace-only idempotency key", async () => {
    await expect(
      createParcelOrder({
        userId: "buyer-1",
        parcelId: "parcel-1",
        idempotencyKey: "   ",
      })
    ).rejects.toMatchObject({
      code: "IDEMPOTENCY_KEY_REQUIRED",
    });
  });

  it("rejects an idempotency key longer than 255 characters", async () => {
    await expect(
      createParcelOrder({
        userId: "buyer-1",
        parcelId: "parcel-1",
        idempotencyKey: "a".repeat(256),
      })
    ).rejects.toMatchObject({
      code: "IDEMPOTENCY_KEY_TOO_LONG",
    });
  });
});
