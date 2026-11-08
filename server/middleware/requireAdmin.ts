import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./authMiddleware.js";
import { prisma } from "../lib/prisma.js";

/**
 * Admin authorization is deliberately database-backed.
 * JWT claims and client-provided role values are never trusted.
 */
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const userId = req.user?.id?.trim();

  if (!userId) {
    return res.status(401).json({
      error: "AUTHENTICATION_REQUIRED",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return res.status(401).json({
        error: "AUTHENTICATED_USER_NOT_FOUND",
      });
    }

    if (user.role !== "ADMIN") {
      return res.status(403).json({
        error: "ADMIN_ACCESS_REQUIRED",
      });
    }

    return next();
  } catch (error) {
    console.error("Admin authorization failed:", error);
    return res.status(500).json({
      error: "ADMIN_AUTHORIZATION_FAILED",
    });
  }
}
