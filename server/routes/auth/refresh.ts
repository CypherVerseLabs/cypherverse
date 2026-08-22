import {
  Router,
  Request,
  Response,
} from "express";

import {
  getUserById,
  getUserByAddress,
  getUserByEmail,
} from "../../stores/userStore.js";

import {
  verifyAuthToken,
  createAccessToken,
  REFRESH_COOKIE_NAME,
} from "../../utils/auth.js";

const router = Router();

router.post(
  "/",
  async (
    req: Request,
    res: Response
  ) => {
    const refreshToken =
      req.cookies?.[
        REFRESH_COOKIE_NAME
      ];

    if (
      !refreshToken ||
      typeof refreshToken !== "string"
    ) {
      return res.status(401).json({
        error:
          "Refresh token missing",
      });
    }

    try {
      const payload =
        verifyAuthToken(
          refreshToken
        );

      if (
        payload.type !==
        "refresh"
      ) {
        return res.status(401).json({
          error:
            "Invalid refresh token",
        });
      }

      /*
       * -----------------------------------------------------
       * USER LOOKUP
       * -----------------------------------------------------
       *
       * The user ID is the canonical identity.
       */

      let user =
        await getUserById(
          payload.sub
        );

      /*
       * Legacy token fallback.
       */

      if (
        !user &&
        payload.address
      ) {
        user =
          await getUserByAddress(
            payload.address
          );
      }

      if (
        !user &&
        payload.email
      ) {
        user =
          await getUserByEmail(
            payload.email
          );
      }

      /*
       * User must still exist.
       */

      if (!user) {
        return res.status(401).json({
          error:
            "User account no longer exists",
        });
      }

      /*
       * Canonical identity check.
       */

      if (
        payload.sub !==
        user.id
      ) {
        return res.status(401).json({
          error:
            "Refresh token does not belong to this user",
        });
      }

      /*
       * Create fresh access token.
       */

      const accessToken =
        createAccessToken({
          sub: user.id,

          ...(user.address
            ? {
                address:
                  user.address,
              }
            : {}),

          ...(user.email
            ? {
                email:
                  user.email,
              }
            : {}),

          ...(user.username
            ? {
                username:
                  user.username,
              }
            : {}),
        });

      return res.json({
        token: accessToken,
      });
    } catch (error) {
      console.error(
        "Refresh token error:",
        error
      );

      return res.status(401).json({
        error:
          "Invalid or expired refresh token",
      });
    }
  }
);

export default router;