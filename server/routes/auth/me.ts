// server/routes/auth/me.ts

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
} from "../../stores/userStore.js";

const router = Router();

/*
 * =========================================================
 * GET CURRENT USER
 * =========================================================
 *
 * GET /auth/me
 *
 * Authorization:
 *
 * Bearer <access-token>
 *
 * The JWT `sub` is the canonical User.id.
 */

router.get(
  "/",
  async (
    req: Request,
    res: Response
  ) => {
    const authHeader =
      req.headers.authorization;

    /*
     * -------------------------------------------------------
     * AUTHORIZATION HEADER
     * -------------------------------------------------------
     */

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
      /*
       * -----------------------------------------------------
       * VERIFY JWT
       * -----------------------------------------------------
       */

      const decoded =
        verifyAuthToken(token);

      /*
       * /auth/me accepts access tokens only.
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
       * -----------------------------------------------------
       * CANONICAL USER LOOKUP
       * -----------------------------------------------------
       *
       * The database User.id is the source of truth.
       */

      const user =
        await getUserById(
          decoded.sub
        );

      if (!user) {
        return res.status(404).json({
          error:
            "User not found",
        });
      }

      /*
       * -----------------------------------------------------
       * RESPONSE
       * -----------------------------------------------------
       *
       * Never expose passwordHash.
       */

      return res.status(200).json({
        user: {
          id: user.id,

          address:
            user.address,

          email:
            user.email,

          username:
            user.username,

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
