import { Prisma, ParcelStatus, ParcelType } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import {
  PRIMARY_MARKETPLACE_SELLER_EMAIL,
  PRIMARY_MIN_PRICE,
  PRIMARY_MAX_PRICE,
} from "./marketplaceOrderService.js";

export class PrimaryInventoryError extends Error {
  public readonly code: string;

  constructor(code: string, message: string = code) {
    super(message);
    this.name = "PrimaryInventoryError";
    this.code = code;
  }
}

export interface ActivatePrimaryInventoryInput {
  parcelId: string;
  price: string;
}

export async function activatePrimaryInventory(
  input: ActivatePrimaryInventoryInput
) {
  const parcelId = input.parcelId.trim();
  const price = new Prisma.Decimal(input.price);

  if (!parcelId) {
    throw new PrimaryInventoryError("PARCEL_ID_REQUIRED");
  }

  if (!price.isFinite() || price.lte(0)) {
    throw new PrimaryInventoryError("INVALID_PRIMARY_PARCEL_PRICE");
  }

  if (price.lt(PRIMARY_MIN_PRICE) || price.gt(PRIMARY_MAX_PRICE)) {
    throw new PrimaryInventoryError(
      "PRIMARY_PRICE_OUT_OF_RANGE",
      "Primary parcel prices must be between $20.00 and $50.00 USD."
    );
  }

  return prisma.$transaction(
    async (tx) => {
      const seller = await tx.user.findUnique({
        where: { email: PRIMARY_MARKETPLACE_SELLER_EMAIL },
        select: { id: true },
      });

      if (!seller) {
        throw new PrimaryInventoryError(
          "PRIMARY_MARKETPLACE_SELLER_NOT_CONFIGURED",
          "The configured primary marketplace seller account was not found."
        );
      }

      const parcel = await tx.parcel.findUnique({
        where: { id: parcelId },
        select: {
          id: true,
          estateId: true,
          type: true,
          status: true,
          ownerId: true,
          price: true,
        },
      });

      if (!parcel) {
        throw new PrimaryInventoryError("PARCEL_NOT_FOUND");
      }

      if (parcel.type !== ParcelType.STANDARD) {
        throw new PrimaryInventoryError(
          "PRIMARY_INVENTORY_TYPE_NOT_ALLOWED",
          "Only standard parcels can be activated as primary inventory."
        );
      }

      if (parcel.ownerId !== null) {
        throw new PrimaryInventoryError(
          "PRIMARY_PARCEL_ALREADY_OWNED",
          "Owned parcels must use the existing seller listing workflow."
        );
      }

      if (parcel.status === ParcelStatus.for_sale) {
        if (parcel.price?.equals(price)) {
          return { parcel, alreadyActive: true };
        }

        throw new PrimaryInventoryError(
          "PRIMARY_PARCEL_ALREADY_ACTIVE",
          "This primary parcel is already active at a different price."
        );
      }

      if (parcel.status !== ParcelStatus.available) {
        throw new PrimaryInventoryError(
          "PRIMARY_PARCEL_NOT_AVAILABLE",
          "Only available, unowned parcels can be activated."
        );
      }

      const now = new Date();
      const [activeReservation, activeListing, existingOrder, existingEntitlement, project] =
        await Promise.all([
          tx.parcelReservation.findFirst({
            where: { parcelId, expiresAt: { gt: now } },
            select: { id: true },
          }),
          tx.parcelListing.findFirst({
            where: { parcelId, active: true },
            select: { id: true },
          }),
          tx.marketplaceOrder.findFirst({
            where: { productId: parcelId },
            select: { id: true },
          }),
          tx.marketplaceEntitlement.findFirst({
            where: { productId: parcelId },
            select: { id: true },
          }),
          tx.project.findFirst({
            where: { parcelId },
            select: { id: true },
          }),
        ]);

      if (activeReservation) {
        throw new PrimaryInventoryError(
          "PRIMARY_PARCEL_HAS_ACTIVE_RESERVATION",
          "A parcel with an active reservation cannot be activated."
        );
      }

      if (activeListing) {
        throw new PrimaryInventoryError(
          "PRIMARY_PARCEL_LISTING_CONFLICT",
          "Primary inventory cannot have a resale listing."
        );
      }

      if (existingOrder || existingEntitlement || project) {
        throw new PrimaryInventoryError(
          "PRIMARY_PARCEL_HAS_HISTORY",
          "This parcel has existing marketplace or project history and cannot be activated as new primary inventory."
        );
      }

      const updated = await tx.parcel.updateMany({
        where: {
          id: parcelId,
          type: ParcelType.STANDARD,
          status: ParcelStatus.available,
          ownerId: null,
        },
        data: {
          status: ParcelStatus.for_sale,
          price,
        },
      });

      if (updated.count !== 1) {
        throw new PrimaryInventoryError(
          "PRIMARY_PARCEL_STATE_CHANGED",
          "The parcel changed while it was being activated. Refresh and try again."
        );
      }

      const activatedParcel = await tx.parcel.findUniqueOrThrow({
        where: { id: parcelId },
        select: {
          id: true,
          estateId: true,
          x: true,
          y: true,
          type: true,
          status: true,
          ownerId: true,
          price: true,
          name: true,
        },
      });

      return { parcel: activatedParcel, alreadyActive: false };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}
