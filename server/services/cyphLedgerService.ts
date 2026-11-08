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

/**
 * Creates an immutable, balanced journal transaction inside the caller's
 * database transaction. Amounts are signed: debits/credits must sum to zero.
 */
export async function createCyphLedgerTransaction(
  tx: Prisma.TransactionClient,
  input: CreateCyphLedgerTransactionInput
) {
  if (!input.idempotencyKey?.trim()) {
    throw new CyphLedgerError(
      "CYPH_IDEMPOTENCY_KEY_REQUIRED",
      "A CYPH ledger idempotency key is required."
    );
  }

  if (input.postings.length < 2) {
    throw new CyphLedgerError(
      "CYPH_LEDGER_REQUIRES_TWO_POSTINGS",
      "A ledger transaction requires at least two postings."
    );
  }

  const amounts = input.postings.map(
    (posting) => new Prisma.Decimal(posting.amount)
  );

  if (amounts.some((amount) => amount.isZero())) {
    throw new CyphLedgerError(
      "CYPH_ZERO_POSTING_NOT_ALLOWED",
      "Zero-value ledger postings are not allowed."
    );
  }

  const total = amounts.reduce(
    (sum, amount) => sum.plus(amount),
    new Prisma.Decimal(0)
  );

  if (!total.isZero()) {
    throw new CyphLedgerError(
      "CYPH_LEDGER_UNBALANCED",
      "CYPH ledger postings must sum to zero."
    );
  }

  const existing = await tx.cyphLedgerTransaction.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { postings: true },
  });

  if (existing) {
    return {
      transaction: existing,
      duplicate: true,
    };
  }

  const transaction = await tx.cyphLedgerTransaction.create({
    data: {
      type: input.type,
      idempotencyKey: input.idempotencyKey,
      actorUserId: input.actorUserId ?? null,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      reason: input.reason ?? null,
      postings: {
        create: input.postings.map((posting, index) => ({
          accountId: posting.accountId,
          amount: amounts[index],
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
