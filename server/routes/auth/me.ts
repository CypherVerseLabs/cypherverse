import {
  Router,
  Request,
  Response,
} from "express";

import {
  verifyAuthToken,
} from "../../utils/auth.js";

import {
  getUserById,
  getUserByAddress,
  getUserByEmail,
} from "../../stores/userStore.js";

const router = Router();

router.get(
  "/",
  async (
    req: Request,
    res: Response
  ) => {
    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        error:
          "Missing or invalid Authorization header",
      });
    }

    const token =
      authHeader
        .substring(7)
        .trim();

    if (!token) {
      return res.status(401).json({
        error:
          "Access token missing",
      });
    }

    try {
      const decoded =
        verifyAuthToken(token);

      /*
       * /auth/me only accepts access tokens.
       */

      if (
        decoded.type !==
        "access"
      ) {
        return res.status(401).json({
          error:
            "Invalid access token",
        });
      }

      /*
       * Canonical lookup.
       */

      let user =
        await getUserById(
          decoded.sub
        );

      /*
       * Legacy fallback.
       */

      if (
        !user &&
        decoded.address
      ) {
        user =
          await getUserByAddress(
            decoded.address
          );
      }

      if (
        !user &&
        decoded.email
      ) {
        user =
          await getUserByEmail(
            decoded.email
          );
      }

      if (!user) {
        return res.status(404).json({
          error:
            "User not found",
        });
      }

      /*
       * JWT must identify this exact account.
       */

      if (
        user.id !==
        decoded.sub
      ) {
        return res.status(401).json({
          error:
            "Token does not match user account",
        });
      }

      /*
       * Never expose passwordHash.
       */

      return res.json({
        user: {
          id: user.id,
          address: user.address,
          email: user.email,
          username: user.username,
          createdAt:
            user.createdAt,
          updatedAt:
            user.updatedAt,
        },
      });
    } catch (error) {
      console.error(
        "Token verification error:",
        error
      );

      return res.status(401).json({
        error:
          "Invalid or expired token",
      });
    }
  }
);

export default router;