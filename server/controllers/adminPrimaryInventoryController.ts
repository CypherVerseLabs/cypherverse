import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import {
  activatePrimaryInventory,
  PrimaryInventoryError,
} from "../services/adminPrimaryInventoryService.js";

function sendPrimaryInventoryError(res: Response, error: unknown) {
  if (error instanceof PrimaryInventoryError) {
    const statusByCode: Record<string, number> = {
      PARCEL_ID_REQUIRED: 400,
      INVALID_PRIMARY_PARCEL_PRICE: 400,
      PRIMARY_PRICE_OUT_OF_RANGE: 400,
      PARCEL_NOT_FOUND: 404,
      PRIMARY_MARKETPLACE_SELLER_NOT_CONFIGURED: 409,
      PRIMARY_INVENTORY_TYPE_NOT_ALLOWED: 409,
      PRIMARY_PARCEL_ALREADY_OWNED: 409,
      PRIMARY_PARCEL_ALREADY_ACTIVE: 409,
      PRIMARY_PARCEL_NOT_AVAILABLE: 409,
      PRIMARY_PARCEL_HAS_ACTIVE_RESERVATION: 409,
      PRIMARY_PARCEL_LISTING_CONFLICT: 409,
      PRIMARY_PARCEL_HAS_HISTORY: 409,
      PRIMARY_PARCEL_STATE_CHANGED: 409,
    };

    return res.status(statusByCode[error.code] ?? 400).json({
      error: error.code,
      message: error.message,
    });
  }

  console.error("Admin primary inventory activation failed:", error);
  return res.status(500).json({
    error: "PRIMARY_INVENTORY_ACTIVATION_FAILED",
    message: "Unable to activate primary parcel inventory.",
  });
}

export async function activatePrimaryInventoryController(
  req: AuthenticatedRequest,
  res: Response
) {
  const parcelId = req.params.parcelId;
  const rawPrice = req.body?.price;

  if (typeof rawPrice !== "string" && typeof rawPrice !== "number") {
    return res.status(400).json({
      error: "INVALID_PRIMARY_PARCEL_PRICE",
      message: "A USD price is required.",
    });
  }

  const price = String(rawPrice).trim();

  if (!/^\d+(\.\d{1,2})?$/.test(price)) {
    return res.status(400).json({
      error: "INVALID_PRIMARY_PARCEL_PRICE",
      message: "Price must be a positive USD amount with at most two decimal places.",
    });
  }

  try {
    const result = await activatePrimaryInventory({
      parcelId,
      price,
    });

    return res.status(result.alreadyActive ? 200 : 201).json({
      success: true,
      alreadyActive: result.alreadyActive,
      parcel: {
        ...result.parcel,
        price: result.parcel.price?.toString() ?? null,
      },
    });
  } catch (error) {
    return sendPrimaryInventoryError(res, error);
  }
}
