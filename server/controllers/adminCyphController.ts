import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import {
  createCyphFundingPreset,
  grantCyphFromPreset,
  listCyphFundingPresets,
  updateCyphFundingPreset,
  CyphFundingError,
} from "../services/cyphFundingService.js";

function sendFundingError(res: Response, error: unknown) {
  if (error instanceof CyphFundingError) {
    const statusByCode: Record<string, number> = {
      ADMIN_ACCESS_REQUIRED: 403,
      TARGET_USER_NOT_FOUND: 404,
      FUNDING_PRESET_NOT_FOUND: 404,
      FUNDING_PRESET_UNAVAILABLE: 409,
      IDEMPOTENCY_KEY_CONFLICT: 409,
      CYPH_SYSTEM_ACCOUNT_MISSING: 500,
    };
    return res.status(statusByCode[error.code] ?? 400).json({
      error: error.code,
      message: error.message,
    });
  }

  console.error("Admin CYPH operation failed:", error);
  return res.status(500).json({
    error: "CYPH_ADMIN_OPERATION_FAILED",
  });
}

export async function listCyphFundingPresetsController(
  _req: AuthenticatedRequest,
  res: Response
) {
  try {
    return res.json({ presets: await listCyphFundingPresets() });
  } catch (error) {
    return sendFundingError(res, error);
  }
}

export async function createCyphFundingPresetController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const preset = await createCyphFundingPreset(req.user!.id, req.body ?? {});
    return res.status(201).json({ preset });
  } catch (error) {
    return sendFundingError(res, error);
  }
}

export async function updateCyphFundingPresetController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const preset = await updateCyphFundingPreset(
      req.user!.id,
      req.params.presetId,
      req.body ?? {}
    );
    return res.json({ preset });
  } catch (error) {
    return sendFundingError(res, error);
  }
}

export async function grantCyphFundingController(
  req: AuthenticatedRequest,
  res: Response
) {
  const idempotencyKey =
    typeof req.headers["idempotency-key"] === "string"
      ? req.headers["idempotency-key"]
      : "";

  try {
    const result = await grantCyphFromPreset({
      actorUserId: req.user!.id,
      targetUserId: req.body?.targetUserId,
      presetCode: req.body?.presetCode,
      reason: req.body?.reason,
      idempotencyKey,
    });

    return res.status(result.duplicate ? 200 : 201).json(result);
  } catch (error) {
    return sendFundingError(res, error);
  }
}
