// server/utils/auth.ts

import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

/*
 * =========================================================
 * JWT SECRET
 * =========================================================
 */

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.trim().length === 0) {
    throw new Error(
      "JWT_SECRET is not defined. Set JWT_SECRET in server/.env"
    );
  }

  return secret;
}

/*
 * =========================================================
 * TOKEN TYPES
 * =========================================================
 */

export type AuthTokenType =
  | "access"
  | "refresh";

/*
 * =========================================================
 * TOKEN PAYLOAD
 * =========================================================
 *
 * `sub` is always the permanent database User ID.
 *
 * address/email are authentication attributes and are
 * included for compatibility and convenience.
 */

export interface AuthTokenPayload {
  sub: string;

  address?: string;

  email?: string;

  username?: string;

  type: AuthTokenType;
}

/*
 * =========================================================
 * TOKEN EXPIRATION
 * =========================================================
 */

export const ACCESS_TOKEN_EXPIRES_IN =
  "1h" as SignOptions["expiresIn"];

export const REFRESH_TOKEN_EXPIRES_IN =
  "7d" as SignOptions["expiresIn"];

/*
 * =========================================================
 * REFRESH COOKIE
 * =========================================================
 */

export const REFRESH_COOKIE_NAME =
  "refreshToken";

export const REFRESH_COOKIE_MAX_AGE =
  7 * 24 * 60 * 60 * 1000;

/*
 * =========================================================
 * CREATE ACCESS TOKEN
 * =========================================================
 */

export function createAccessToken(
  payload: Omit<
    AuthTokenPayload,
    "type"
  >
): string {
  const secret = getJwtSecret();

  return jwt.sign(
    {
      ...payload,
      type: "access",
    },
    secret,
    {
      algorithm: "HS256",
      expiresIn:
        ACCESS_TOKEN_EXPIRES_IN,
    }
  );
}

/*
 * =========================================================
 * CREATE REFRESH TOKEN
 * =========================================================
 */

export function createRefreshToken(
  payload: Omit<
    AuthTokenPayload,
    "type"
  >
): string {
  const secret = getJwtSecret();

  return jwt.sign(
    {
      ...payload,
      type: "refresh",
    },
    secret,
    {
      algorithm: "HS256",
      expiresIn:
        REFRESH_TOKEN_EXPIRES_IN,
    }
  );
}

/*
 * =========================================================
 * VERIFY TOKEN
 * =========================================================
 */

export function verifyAuthToken(
  token: string
): AuthTokenPayload {
  const secret = getJwtSecret();

  const decoded =
    jwt.verify(
      token,
      secret,
      {
        algorithms: ["HS256"],
      }
    );

  if (
    typeof decoded !== "object" ||
    decoded === null
  ) {
    throw new Error(
      "Invalid JWT payload"
    );
  }

  const payload =
    decoded as Partial<AuthTokenPayload>;

  /*
   * `sub` is mandatory because it is the
   * canonical user identity.
   */

  if (
    typeof payload.sub !== "string"
  ) {
    throw new Error(
      "JWT subject is missing"
    );
  }

  /*
   * Token type is mandatory.
   */

  if (
    payload.type !== "access" &&
    payload.type !== "refresh"
  ) {
    throw new Error(
      "Invalid JWT token type"
    );
  }

  return {
    sub: payload.sub,

    address:
      typeof payload.address ===
      "string"
        ? payload.address
            .trim()
            .toLowerCase()
        : undefined,

    email:
      typeof payload.email ===
      "string"
        ? payload.email
            .trim()
            .toLowerCase()
        : undefined,

    username:
      typeof payload.username ===
      "string"
        ? payload.username
        : undefined,

    type:
      payload.type,
  };
}

/*
 * =========================================================
 * REFRESH COOKIE OPTIONS
 * =========================================================
 */

export function getRefreshCookieOptions() {
  const production =
    process.env.NODE_ENV ===
    "production";

  return {
    httpOnly: true,

    secure: production,

    sameSite:
      production
        ? ("strict" as const)
        : ("lax" as const),

    path: "/",

    maxAge:
      REFRESH_COOKIE_MAX_AGE,
  };
}

/*
 * =========================================================
 * CLEAR REFRESH COOKIE OPTIONS
 * =========================================================
 */

export function getClearRefreshCookieOptions() {
  const production =
    process.env.NODE_ENV ===
    "production";

  return {
    httpOnly: true,

    secure: production,

    sameSite:
      production
        ? ("strict" as const)
        : ("lax" as const),

    path: "/",
  };
}
