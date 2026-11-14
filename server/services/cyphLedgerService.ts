import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

type CyphLedgerHistoryEntry =
  Prisma.CyphLedgerTransactionGetPayload<{
    include: {
      postings: {
        include: {
          account: {
            select: {
              id: true;
              accountType: true;
              systemCode: true;
              userId: true;
            };
          };
        };
      };
      fundingGrant: true;
    };
  }>;

export type CyphPostingInput = {
  accountId: string;
  amount: string | Prisma.Decimal;
};

export type CreateCyphLedgerTransactionInput = {
  type: string;
  idempotencyKey: string;
  actorUserId?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  reason?: string | null;
  postings: CyphPostingInput[];
};

export class CyphLedgerError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "CyphLedgerError";
  }
}

type NormalizedPosting = {
  accountId: string;
  amount: Prisma.Decimal;
};

/**
 * Normalize posting order so the same logical request has the same
 * fingerprint regardless of the order in which postings were supplied.
 *
 * Duplicate account IDs are rejected rather than silently combined. This
 * keeps the journal request unambiguous and makes duplicate comparison exact.
 */
function normalizePostings(
  postings: CyphPostingInput[]
): NormalizedPosting[] {
  if (!Array.isArray(postings) || postings.length < 2) {
    throw new CyphLedgerError(
      "CYPH_LEDGER_REQUIRES_TWO_POSTINGS",
      "A ledger transaction requires at least two postings."
    );
  }

  const normalized = postings.map((posting) => {
    if (
      !posting ||
      typeof posting.accountId !== "string" ||
      !posting.accountId.trim()
    ) {
      throw new CyphLedgerError(
        "CYPH_LEDGER_ACCOUNT_REQUIRED",
        "Every ledger posting requires an account ID."
      );
    }

    let amount: Prisma.Decimal;

    try {
      amount = new Prisma.Decimal(posting.amount);
    } catch {
      throw new CyphLedgerError(
        "CYPH_INVALID_POSTING_AMOUNT",
        "Every ledger posting must have a valid decimal amount."
      );
    }

    if (!amount.isFinite() || amount.isZero()) {
      throw new CyphLedgerError(
        "CYPH_ZERO_OR_INVALID_POSTING_NOT_ALLOWED",
        "Ledger postings must be finite, non-zero decimal amounts."
      );
    }

    if (amount.decimalPlaces() > 18 || amount.precision() > 36) {
      throw new CyphLedgerError(
        "CYPH_POSTING_PRECISION_EXCEEDED",
        "Ledger posting amounts support up to 36 digits and 18 decimal places."
      );
    }

    return {
      accountId: posting.accountId.trim(),
      amount,
    };
  });

  const accountIds = new Set<string>();

  for (const posting of normalized) {
    if (accountIds.has(posting.accountId)) {
      throw new CyphLedgerError(
        "CYPH_DUPLICATE_POSTING_ACCOUNT",
        "A ledger transaction may contain only one posting per account."
      );
    }

    accountIds.add(posting.accountId);
  }

  return normalized.sort((a, b) =>
    a.accountId.localeCompare(b.accountId)
  );
}

function normalizeOptionalText(
  value: string | null | undefined,
  field: string
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new CyphLedgerError(
      "CYPH_INVALID_TRANSACTION_METADATA",
      `${field} must be a string when supplied.`
    );
  }

  return value;
}

function assertSameRequest(
  existing: {
    type: string;
    actorUserId: string | null;
    referenceType: string | null;
    referenceId: string | null;
    reason: string | null;
    postings: Array<{
      accountId: string;
      amount: Prisma.Decimal;
    }>;
  },
  requested: {
    type: string;
    actorUserId: string | null;
    referenceType: string | null;
    referenceId: string | null;
    reason: string | null;
    postings: NormalizedPosting[];
  }
): void {
  const existingPostings = [...existing.postings].sort((a, b) =>
    a.accountId.localeCompare(b.accountId)
  );

  const postingsMatch =
    existingPostings.length === requested.postings.length &&
    existingPostings.every((posting, index) => {
      const requestedPosting = requested.postings[index];

      return (
        posting.accountId === requestedPosting.accountId &&
        new Prisma.Decimal(posting.amount).equals(requestedPosting.amount)
      );
    });

  const metadataMatches =
    existing.type === requested.type &&
    existing.actorUserId === requested.actorUserId &&
    existing.referenceType === requested.referenceType &&
    existing.referenceId === requested.referenceId &&
    existing.reason === requested.reason;

  if (!metadataMatches || !postingsMatch) {
    throw new CyphLedgerError(
      "CYPH_IDEMPOTENCY_KEY_CONFLICT",
      "This CYPH ledger idempotency key was already used for a different transaction."
    );
  }
}

/**
 * Creates an immutable, balanced journal transaction inside the caller's
 * database transaction.
 *
 * Idempotency behavior:
 * - An existing key with identical metadata and identical normalized
 *   postings returns the original transaction with duplicate=true.
 * - Reusing a key for any different transaction returns a conflict.
 * - A concurrent insert that wins the unique-key race can surface Prisma
 *   P2002. The caller must retry the entire outer transaction; on retry this
 *   function will compare the committed transaction and return duplicate or
 *   throw CYPH_IDEMPOTENCY_KEY_CONFLICT.
 *
 * Do not catch P2002 inside the current transaction and continue using that
 * transaction: PostgreSQL marks it failed after a unique constraint error.
 */
export async function createCyphLedgerTransaction(
  tx: Prisma.TransactionClient,
  input: CreateCyphLedgerTransactionInput
) {
  if (!input || typeof input !== "object") {
    throw new CyphLedgerError(
      "CYPH_INVALID_TRANSACTION",
      "A valid CYPH ledger transaction is required."
    );
  }

  if (typeof input.type !== "string" || !input.type.trim()) {
    throw new CyphLedgerError(
      "CYPH_TRANSACTION_TYPE_REQUIRED",
      "A CYPH ledger transaction type is required."
    );
  }

  const idempotencyKey =
    typeof input.idempotencyKey === "string"
      ? input.idempotencyKey.trim()
      : "";

  if (!idempotencyKey || idempotencyKey.length > 200) {
    throw new CyphLedgerError(
      "CYPH_IDEMPOTENCY_KEY_REQUIRED",
      "A CYPH ledger idempotency key of at most 200 characters is required."
    );
  }

  const actorUserId = normalizeOptionalText(
    input.actorUserId,
    "actorUserId"
  );
  const referenceType = normalizeOptionalText(
    input.referenceType,
    "referenceType"
  );
  const referenceId = normalizeOptionalText(
    input.referenceId,
    "referenceId"
  );
  const reason = normalizeOptionalText(input.reason, "reason");
  const postings = normalizePostings(input.postings);

  const total = postings.reduce(
    (sum, posting) => sum.plus(posting.amount),
    new Prisma.Decimal(0)
  );

  if (!total.isZero()) {
    throw new CyphLedgerError(
      "CYPH_LEDGER_UNBALANCED",
      "CYPH ledger postings must sum to zero."
    );
  }

  const requested = {
    type: input.type.trim(),
    actorUserId,
    referenceType,
    referenceId,
    reason,
    postings,
  };

  const existing = await tx.cyphLedgerTransaction.findUnique({
    where: { idempotencyKey },
    include: { postings: true },
  });

  if (existing) {
    assertSameRequest(existing, requested);

    return {
      transaction: existing,
      duplicate: true,
    };
  }

  const transaction = await tx.cyphLedgerTransaction.create({
    data: {
      type: requested.type,
      idempotencyKey,
      actorUserId: requested.actorUserId,
      referenceType: requested.referenceType,
      referenceId: requested.referenceId,
      reason: requested.reason,
      postings: {
        create: requested.postings.map((posting) => ({
          accountId: posting.accountId,
          amount: posting.amount,
        })),
      },
    },
    include: {
      postings: {
        include: {
          account: {
            select: {
              id: true,
              accountType: true,
              systemCode: true,
              userId: true,
            },
          },
        },
      },
    },
  });

  return {
    transaction,
    duplicate: false,
  };
}

export async function getCyphAccountForUser(userId: string) {
  return prisma.cyphAccount.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      balance: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function getCyphLedgerHistory(
  userId: string,
  limit = 25
): Promise<CyphLedgerHistoryEntry[]> {
  const account = await prisma.cyphAccount.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!account) {
    return [];
  }

  return prisma.cyphLedgerTransaction.findMany({
    where: {
      postings: {
        some: {
          accountId: account.id,
        },
      },
    },
    include: {
      postings: {
        include: {
          account: {
            select: {
              id: true,
              accountType: true,
              systemCode: true,
              userId: true,
            },
          },
        },
      },
      fundingGrant: true,
    },
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
    take: Math.min(Math.max(limit, 1), 100),
  });
}
