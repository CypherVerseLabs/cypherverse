import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import {
  createCyphLedgerTransaction,
  CyphLedgerError,
} from "./cyphLedgerService.js";

export class CyphFundingError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "CyphFundingError";
  }
}

function normalizePresetCode(value: unknown): string {
  if (typeof value !== "string") {
    throw new CyphFundingError(
      "INVALID_PRESET_CODE",
      "Preset code is required."
    );
  }

  const code = value.trim().toUpperCase();

  if (!/^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(code)) {
    throw new CyphFundingError(
      "INVALID_PRESET_CODE",
      "Preset code must be 2-40 letters, numbers, underscores, or hyphens."
    );
  }

  return code;
}

function parseAmount(value: unknown, field: string) {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new CyphFundingError(
      "INVALID_FUNDING_AMOUNT",
      `${field} must be a decimal amount.`
    );
  }

  const raw = String(value).trim();

  if (!/^\d{1,18}(\.\d{1,18})?$/.test(raw)) {
    throw new CyphFundingError(
      "INVALID_FUNDING_AMOUNT",
      `${field} must be a non-negative amount with at most 18 decimal places.`
    );
  }

  return new Prisma.Decimal(raw);
}

async function assertAdmin(tx: Prisma.TransactionClient, actorUserId: string) {
  const actor = await tx.user.findUnique({
    where: { id: actorUserId },
    select: { id: true, role: true },
  });

  if (!actor || actor.role !== "ADMIN") {
    throw new CyphFundingError(
      "ADMIN_ACCESS_REQUIRED",
      "A database-authorized administrator is required."
    );
  }
}

export async function listCyphFundingPresets() {
  return prisma.cyphFundingPreset.findMany({
    orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
  });
}

export async function createCyphFundingPreset(
  actorUserId: string,
  input: {
    code: unknown;
    label: unknown;
    baseAmount: unknown;
    bonusAmount: unknown;
    sortOrder?: unknown;
  }
) {
  const code = normalizePresetCode(input.code);
  const label = typeof input.label === "string" ? input.label.trim() : "";
  const baseAmount = parseAmount(input.baseAmount, "baseAmount");
  const bonusAmount = parseAmount(input.bonusAmount, "bonusAmount");
  const sortOrder = input.sortOrder === undefined ? 0 : Number(input.sortOrder);

  if (!label || label.length > 80) {
    throw new CyphFundingError(
      "INVALID_PRESET_LABEL",
      "Preset label is required and must be at most 80 characters."
    );
  }
  if (
    baseAmount.isNegative() ||
    bonusAmount.isNegative() ||
    baseAmount.plus(bonusAmount).isZero()
  ) {
    throw new CyphFundingError(
      "INVALID_PRESET_AMOUNTS",
      "Base and bonus must be non-negative and their total must be greater than zero."
    );
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 100000) {
    throw new CyphFundingError(
      "INVALID_PRESET_SORT_ORDER",
      "sortOrder must be a non-negative integer."
    );
  }

  return prisma.$transaction(
    async (tx) => {
      await assertAdmin(tx, actorUserId);

      return tx.cyphFundingPreset.create({
        data: {
          code,
          label,
          baseAmount,
          bonusAmount,
          sortOrder,
          createdByUserId: actorUserId,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

export async function updateCyphFundingPreset(
  actorUserId: string,
  presetId: string,
  input: {
    label?: unknown;
    baseAmount?: unknown;
    bonusAmount?: unknown;
    enabled?: unknown;
    sortOrder?: unknown;
  }
) {
  return prisma.$transaction(
    async (tx) => {
      await assertAdmin(tx, actorUserId);

      const current = await tx.cyphFundingPreset.findUnique({
        where: { id: presetId },
      });

      if (!current) {
        throw new CyphFundingError(
          "FUNDING_PRESET_NOT_FOUND",
          "Funding preset was not found."
        );
      }

      const label =
        input.label === undefined
          ? current.label
          : typeof input.label === "string"
          ? input.label.trim()
          : "";

      const baseAmount =
        input.baseAmount === undefined
          ? current.baseAmount
          : parseAmount(input.baseAmount, "baseAmount");

      const bonusAmount =
        input.bonusAmount === undefined
          ? current.bonusAmount
          : parseAmount(input.bonusAmount, "bonusAmount");

      const enabled =
        input.enabled === undefined ? current.enabled : input.enabled;

      const sortOrder =
        input.sortOrder === undefined
          ? current.sortOrder
          : Number(input.sortOrder);

      if (!label || label.length > 80) {
        throw new CyphFundingError(
          "INVALID_PRESET_LABEL",
          "Preset label is required and must be at most 80 characters."
        );
      }
      if (typeof enabled !== "boolean") {
        throw new CyphFundingError(
          "INVALID_PRESET_ENABLED",
          "enabled must be a boolean."
        );
      }
      if (
        baseAmount.isNegative() ||
        bonusAmount.isNegative() ||
        baseAmount.plus(bonusAmount).isZero()
      ) {
        throw new CyphFundingError(
          "INVALID_PRESET_AMOUNTS",
          "Base and bonus must be non-negative and their total must be greater than zero."
        );
      }
      if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 100000) {
        throw new CyphFundingError(
          "INVALID_PRESET_SORT_ORDER",
          "sortOrder must be a non-negative integer."
        );
      }

      return tx.cyphFundingPreset.update({
        where: { id: presetId },
        data: {
          label,
          baseAmount,
          bonusAmount,
          enabled,
          sortOrder,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

/**
 * Funding can only use an enabled, database-configured preset.
 * The caller cannot supply or override the actual base/bonus amounts.
 */
export async function grantCyphFromPreset(input: {
  actorUserId: string;
  targetUserId: string;
  presetCode: string;
  reason: string;
  idempotencyKey: string;
}) {
  if (!input || typeof input !== "object") {
    throw new CyphFundingError(
      "INVALID_FUNDING_REQUEST",
      "A valid funding request is required."
    );
  }

  const actorUserId =
    typeof input.actorUserId === "string" ? input.actorUserId.trim() : "";

  const targetUserId =
    typeof input.targetUserId === "string" ? input.targetUserId.trim() : "";

  const presetCode = normalizePresetCode(input.presetCode);

  const reason = typeof input.reason === "string" ? input.reason.trim() : "";

  const idempotencyKey =
    typeof input.idempotencyKey === "string" ? input.idempotencyKey.trim() : "";

  if (!actorUserId || !targetUserId) {
    throw new CyphFundingError(
      "USER_ID_REQUIRED",
      "Actor and target user IDs are required."
    );
  }
  if (reason.length < 5 || reason.length > 500) {
    throw new CyphFundingError(
      "FUNDING_REASON_REQUIRED",
      "A reason between 5 and 500 characters is required."
    );
  }
  if (!idempotencyKey || idempotencyKey.length > 120) {
    throw new CyphFundingError(
      "INVALID_IDEMPOTENCY_KEY",
      "Idempotency-Key is required and must be at most 120 characters."
    );
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        await assertAdmin(tx, actorUserId);

        const preset = await tx.cyphFundingPreset.findUnique({
          where: { code: presetCode },
        });

        const existing = await tx.cyphLedgerTransaction.findUnique({
          where: { idempotencyKey },
          include: { fundingGrant: true, postings: true },
        });

        if (existing) {
          const grant = existing.fundingGrant;

          const matchesOriginalRequest =
            existing.type === "ADMIN_FUNDING" &&
            existing.actorUserId === actorUserId &&
            !!grant &&
            grant.targetUserId === targetUserId &&
            !!preset &&
            grant.presetId === preset.id &&
            grant.reason === reason;

          if (!matchesOriginalRequest) {
            throw new CyphFundingError(
              "IDEMPOTENCY_KEY_CONFLICT",
              "This idempotency key has already been used for a different funding request."
            );
          }

          return {
            duplicate: true,
            transaction: existing,
            fundingGrant: grant,
          };
        }

        const target = await tx.user.findUnique({
          where: { id: targetUserId },
          select: { id: true },
        });

        if (!target) {
          throw new CyphFundingError(
            "TARGET_USER_NOT_FOUND",
            "Funding target user was not found."
          );
        }

        if (!preset || !preset.enabled) {
          throw new CyphFundingError(
            "FUNDING_PRESET_UNAVAILABLE",
            "Funding preset does not exist or is disabled."
          );
        }

        const account = await tx.cyphAccount.upsert({
          where: { userId: targetUserId },
          create: {
            userId: targetUserId,
            accountType: "USER",
            balance: new Prisma.Decimal(0),
          },
          update: {},
        });

        const issuanceAccount = await tx.cyphAccount.findUnique({
          where: { systemCode: "CYPH_ISSUANCE" },
          select: { id: true },
        });

        if (!issuanceAccount) {
          throw new CyphFundingError(
            "CYPH_SYSTEM_ACCOUNT_MISSING",
            "The CYPH issuance system account is missing. Apply the Phase 1 migration first."
          );
        }

        const total = preset.baseAmount.plus(preset.bonusAmount);

        const ledger = await createCyphLedgerTransaction(tx, {
          type: "ADMIN_FUNDING",
          idempotencyKey,
          actorUserId,
          referenceType: "USER",
          referenceId: targetUserId,
          reason,
          postings: [
            {
              accountId: issuanceAccount.id,
              amount: total.negated(),
            },
            {
              accountId: account.id,
              amount: total,
            },
          ],
        });

        if (ledger.duplicate) {
          throw new CyphFundingError(
            "IDEMPOTENCY_KEY_CONFLICT",
            "This idempotency key has already been used."
          );
        }

        await tx.cyphAccount.update({
          where: { id: account.id },
          data: { balance: { increment: total } },
        });

        await tx.cyphLedgerEntry.create({
          data: {
            userId: targetUserId,
            accountId: account.id,
            amount: total,
            type: "ADMIN_FUNDING",
            referenceType: "CYPH_LEDGER_TRANSACTION",
            referenceId: ledger.transaction.id,
            idempotencyKey: `admin-funding:${idempotencyKey}`,
          },
        });

        const fundingGrant = await tx.cyphFundingGrant.create({
          data: {
            transactionId: ledger.transaction.id,
            targetUserId,
            presetId: preset.id,
            baseAmount: preset.baseAmount,
            bonusAmount: preset.bonusAmount,
            reason,
          },
        });

        const updatedAccount = await tx.cyphAccount.findUniqueOrThrow({
          where: { id: account.id },
          select: { id: true, userId: true, balance: true },
        });

        return {
          duplicate: false,
          transaction: ledger.transaction,
          fundingGrant,
          account: updatedAccount,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    if (error instanceof CyphLedgerError) {
      throw new CyphFundingError(error.code, error.message);
    }
    throw error;
  }
}
