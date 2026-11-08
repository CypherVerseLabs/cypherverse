import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import {
  getCyphAccountForUser,
  getCyphLedgerHistory,
} from "../services/cyphLedgerService.js";

export async function getCyphAccountController(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "AUTHENTICATION_REQUIRED" });
  }

  try {
    const account = await getCyphAccountForUser(userId);
    return res.json({
      account: account
        ? {
            ...account,
            balance: account.balance.toString(),
          }
        : null,
    });
  } catch (error) {
    console.error("Get CYPH account failed:", error);
    return res.status(500).json({ error: "CYPH_ACCOUNT_LOAD_FAILED" });
  }
}

export async function getCyphLedgerController(
  req: AuthenticatedRequest,
  res: Response
) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "AUTHENTICATION_REQUIRED" });
  }

  const requestedLimit = Number(req.query.limit ?? 25);
  const limit = Number.isInteger(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 25;

  try {
    const transactions = await getCyphLedgerHistory(userId, limit);
    return res.json({
      transactions: transactions.map((transaction) => ({
        ...transaction,
        postings: transaction.postings.map((posting) => ({
          ...posting,
          amount: posting.amount.toString(),
        })),
        fundingGrant: transaction.fundingGrant
          ? {
              ...transaction.fundingGrant,
              baseAmount: transaction.fundingGrant.baseAmount.toString(),
              bonusAmount: transaction.fundingGrant.bonusAmount.toString(),
            }
          : null,
      })),
    });
  } catch (error) {
    console.error("Get CYPH ledger failed:", error);
    return res.status(500).json({ error: "CYPH_LEDGER_LOAD_FAILED" });
  }
}
