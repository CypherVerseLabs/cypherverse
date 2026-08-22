// server/routes/auth/login.ts

import { Router } from "express";
import bcrypt from "bcrypt";

import {
  getUserByEmail,
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
 * EMAIL LOGIN
 * ---------------------------------------------------------
 *
 * POST /auth/login
 *
 * Flow:
 *
 * email/password
 *      ↓
 * PostgreSQL / Prisma
 *      ↓
 * verify password
 *      ↓
 * User.id
 *      ↓
 * access token + refresh cookie
 */

router.post(
  "/login",
  async (req, res) => {
    const {
      email,
      password,
    } = req.body;

    /*
     * -------------------------------------------------------
     * VALIDATE REQUEST
     * -------------------------------------------------------
     */

    if (
      !email ||
      typeof email !== "string" ||
      !password ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error:
          "Missing credentials",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    /*
     * -------------------------------------------------------
     * FIND USER
     * -------------------------------------------------------
     */

    const user =
      await getUserByEmail(
        normalizedEmail
      );

    /*
     * Do not reveal whether the email exists.
     */

    if (
      !user ||
      !user.passwordHash
    ) {
      return res.status(401).json({
        error:
          "Invalid credentials",
      });
    }

    /*
     * -------------------------------------------------------
     * VERIFY PASSWORD
     * -------------------------------------------------------
     */

    const match =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!match) {
      return res.status(401).json({
        error:
          "Invalid credentials",
      });
    }

    /*
     * -------------------------------------------------------
     * TOKEN PAYLOAD
     * -------------------------------------------------------
     *
     * User.id is the permanent identity.
     *
     * Email is only an account attribute.
     */

    const tokenPayload = {
      sub: user.id,

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
    };

    /*
     * -------------------------------------------------------
     * ACCESS TOKEN
     * -------------------------------------------------------
     */

    const accessToken =
      createAccessToken(
        tokenPayload
      );

    /*
     * -------------------------------------------------------
     * REFRESH TOKEN
     * -------------------------------------------------------
     */

    const refreshToken =
      createRefreshToken(
        tokenPayload
      );

    /*
     * -------------------------------------------------------
     * HTTP-ONLY REFRESH COOKIE
     * -------------------------------------------------------
     */

    res.cookie(
      REFRESH_COOKIE_NAME,
      refreshToken,
      getRefreshCookieOptions()
    );

    /*
     * -------------------------------------------------------
     * RESPONSE
     * -------------------------------------------------------
     *
     * Never return passwordHash.
     */

    return res.json({
      token: accessToken,

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
  }
);

export default router;