// server/routes/auth/emailAuth.ts

import { Router } from "express";
import bcrypt from "bcrypt";

import {
  getUserByEmail,
  createEmailUser,
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
 * EMAIL REGISTER
 * ---------------------------------------------------------
 */

router.post(
  "/register",
  async (req, res) => {
    const {
      email,
      password,
    } = req.body;

    if (
      !email ||
      typeof email !== "string" ||
      !password ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        error:
          "Email and password are required",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    /*
     * Check whether account already exists.
     */

    const existing =
      await getUserByEmail(
        normalizedEmail
      );

    if (existing) {
      return res.status(409).json({
        error:
          "An account with this email already exists",
      });
    }

    /*
     * Hash password.
     */

    const passwordHash =
      await bcrypt.hash(
        password,
        12
      );

    /*
     * Create database user.
     */

    const user =
      await createEmailUser(
        normalizedEmail,
        passwordHash
      );

    /*
     * Create tokens using the same
     * authentication system as wallet login.
     */

    const tokenPayload = {
      sub: user.id,

      ...(user.email
        ? {
            email:
              user.email,
          }
        : {}),
    };

    const accessToken =
      createAccessToken(
        tokenPayload
      );

    const refreshToken =
      createRefreshToken(
        tokenPayload
      );

    res.cookie(
      REFRESH_COOKIE_NAME,
      refreshToken,
      getRefreshCookieOptions()
    );

    return res.status(201).json({
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