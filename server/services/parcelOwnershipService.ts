import { Prisma } from "../generated/prisma/client.js";

export const PARCEL_OWNERSHIP_SOURCE = {
  MARKETPLACE_PURCHASE: "MARKETPLACE_PURCHASE",
} as const;

type OwnershipTransferInput = {
  parcelId: string;
  previousOwnerId: string | null;
  newOwnerId: string | null;
  source: string;
  marketplaceOrderId?: string | null;
};

export async function recordParcelOwnershipTransfer(
  tx: Prisma.TransactionClient,
  input: OwnershipTransferInput
) {
  if (input.previousOwnerId === input.newOwnerId) {
    return null;
  }

  return tx.parcelOwnershipHistory.create({
    data: {
      parcelId: input.parcelId,
      previousOwnerId: input.previousOwnerId,
      newOwnerId: input.newOwnerId,
      source: input.source,
      marketplaceOrderId:
        input.marketplaceOrderId ?? null,
    },
  });
}
