// server/routes/auth/verify.ts

import {
  Router,
  Request,
  Response,
} from "express";

import { verifyMessage } from "ethers";

import nonces from "../../stores/nonceStore.js";

import {
  getUserByAddress,
  createWalletUser,
} from "../../stores/userStore.js";

import {
  createAccessToken,
  createRefreshToken,
  getRefreshCookieOptions,
  REFRESH_COOKIE_NAME,
} from "../../utils/auth.js";

const router = Router();

/*
 * ---------------------------------------------------------
 * REQUEST TYPE
 * ---------------------------------------------------------
 */

interface VerifyRequest {
  address: string;
  signature: string;
}

/*
 * ---------------------------------------------------------
 * WALLET VERIFICATION
 * ---------------------------------------------------------
 *
 * POST /auth/verify
 *
 * wallet
 *   ↓
 * nonce
 *   ↓
 * signature
 *   ↓
 * verify signature
 *   ↓
 * Neon / Prisma User
 *   ↓
 * access token
 *   ↓
 * refresh token
 *   ↓
 * HTTP-only cookie
 */

router.post(
  "/verify",
  async (
    req: Request<
      {},
      {},
      VerifyRequest
    >,
    res: Response
  ) => {
    const {
      address,
      signature,
    } = req.body;

    /*
     * -------------------------------------------------------
     * VALIDATE REQUEST
     * -------------------------------------------------------
     */

    if (
      !address ||
      typeof address !== "string"
    ) {
      return res.status(400).json({
        error:
          "Wallet address is required",
      });
    }

    if (
      !signature ||
      typeof signature !== "string"
    ) {
      return res.status(400).json({
        error:
          "Wallet signature is required",
      });
    }

    /*
     * -------------------------------------------------------
     * NORMALIZE ADDRESS
     * -------------------------------------------------------
     */

    const lowercaseAddress =
      address
        .trim()
        .toLowerCase();

    /*
     * -------------------------------------------------------
     * FIND NONCE
     * -------------------------------------------------------
     */

    const nonce =
      nonces.get(
        lowercaseAddress
      );

    if (!nonce) {
      return res.status(400).json({
        error:
          "No nonce found for this address",
      });
    }

    /*
     * -------------------------------------------------------
     * RECREATE SIGNED MESSAGE
     * -------------------------------------------------------
     */

    const message =
      `Sign this message to log in: ${nonce}`;

    try {
      /*
       * -----------------------------------------------------
       * VERIFY SIGNATURE
       * -----------------------------------------------------
       */

      const recoveredAddress =
        verifyMessage(
          message,
          signature
        );

      if (
        recoveredAddress
          .toLowerCase() !==
        lowercaseAddress
      ) {
        return res.status(401).json({
          error:
            "Invalid signature",
        });
      }

      /*
       * -----------------------------------------------------
       * FIND OR CREATE USER
       * -----------------------------------------------------
       *
       * These functions now use Prisma/Neon,
       * therefore they MUST be awaited.
       */

      let user =
        await getUserByAddress(
          lowercaseAddress
        );

      if (!user) {
        user =
          await createWalletUser(
            lowercaseAddress
          );
      }

      /*
       * -----------------------------------------------------
       * CREATE TOKEN PAYLOAD
       * -----------------------------------------------------
       *
       * `sub` is the permanent CyBuilder user ID.
       *
       * The wallet address is an authentication attribute.
       *
       * Future database entities should reference:
       *
       *     user.id
       *
       * rather than the wallet address.
       */

      const tokenPayload = {
        sub: user.id,

        address:
          user.address,
      };

      /*
       * -----------------------------------------------------
       * CREATE ACCESS TOKEN
       * -----------------------------------------------------
       */

      const accessToken =
        createAccessToken(
          tokenPayload
        );

      /*
       * -----------------------------------------------------
       * CREATE REFRESH TOKEN
       * -----------------------------------------------------
       */

      const refreshToken =
        createRefreshToken(
          tokenPayload
        );

      /*
       * -----------------------------------------------------
       * NONCE IS SINGLE USE
       * -----------------------------------------------------
       */

      nonces.delete(
        lowercaseAddress
      );

      /*
       * -----------------------------------------------------
       * REFRESH COOKIE
       * -----------------------------------------------------
       */

      res.cookie(
        REFRESH_COOKIE_NAME,
        refreshToken,
        getRefreshCookieOptions()
      );

      /*
       * -----------------------------------------------------
       * RESPONSE
       * -----------------------------------------------------
       *
       * Never return passwordHash.
       */

      return res.json({
        token: accessToken,

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
      /*
       * -----------------------------------------------------
       * SIGNATURE / DATABASE ERROR
       * -----------------------------------------------------
       */

      console.error(
        "Wallet verification error:",
        error
      );

      return res.status(500).json({
        error:
          "Wallet authentication failed",
      });
    }
  }
);

export default router;