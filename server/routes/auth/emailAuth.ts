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

const router =
  Router();


/*
 * =========================================================
 * CREATE AUTHENTICATED RESPONSE
 * =========================================================
 */

function createAuthenticatedResponse(
  user: {
    id: string;
    address?: string | null;
    email?: string | null;
    username?: string | null;
    createdAt: Date | string;
    updatedAt?: Date | string | null;
  }
) {
  const tokenPayload = {
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
  };


  const accessToken =
    createAccessToken(
      tokenPayload
    );


  const refreshToken =
    createRefreshToken(
      tokenPayload
    );


  return {
    accessToken,

    refreshToken,

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
  };
}


/*
 * =========================================================
 * EMAIL REGISTER
 * =========================================================
 *
 * POST /api/register
 *
 * Also used by:
 *
 * POST /api/signup
 *
 * =========================================================
 */

const registerHandler =
  async (
    req: any,
    res: any
  ) => {
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
      email
        .trim()
        .toLowerCase();


    if (
      normalizedEmail.length >
      320
    ) {
      return res.status(400).json({
        error:
          "Email must be 320 characters or less",
      });
    }


    if (
      password.length <
      8
    ) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters",
      });
    }


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
     * Create authenticated session.
     */

    const authenticated =
      createAuthenticatedResponse(
        user
      );


    res.cookie(
      REFRESH_COOKIE_NAME,
      authenticated.refreshToken,
      getRefreshCookieOptions()
    );


    return res.status(201).json({
      token:
        authenticated.accessToken,

      user:
        authenticated.user,
    });
  };


router.post(
  "/register",
  registerHandler
);


/*
 * =========================================================
 * SIGNUP ALIAS
 * =========================================================
 *
 * The existing frontend calls:
 *
 * POST /api/signup
 *
 * Keep that existing frontend contract working.
 * =========================================================
 */

router.post(
  "/signup",
  registerHandler
);


/*
 * =========================================================
 * EMAIL LOGIN
 * =========================================================
 *
 * POST /api/login
 * =========================================================
 */

router.post(
  "/login",
  async (
    req,
    res
  ) => {
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
          "Missing credentials",
      });
    }


    const normalizedEmail =
      email
        .trim()
        .toLowerCase();


    /*
     * Find database user.
     */

    const user =
      await getUserByEmail(
        normalizedEmail
      );


    /*
     * Do not reveal whether the
     * email address exists.
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
     * Verify password.
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
     * Create authenticated session.
     */

    const authenticated =
      createAuthenticatedResponse(
        user
      );


    res.cookie(
      REFRESH_COOKIE_NAME,
      authenticated.refreshToken,
      getRefreshCookieOptions()
    );


    return res.status(200).json({
      token:
        authenticated.accessToken,

      user:
        authenticated.user,
    });
  }
);


export default router;