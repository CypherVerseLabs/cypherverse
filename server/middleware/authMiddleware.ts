// server/middleware/authMiddleware.ts

import {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";

/*
 * ---------------------------------------------------------
 * AUTHENTICATED REQUEST
 * ---------------------------------------------------------
 *
 * This is the identity extracted from the JWT.
 *
 * It is NOT the complete User record.
 *
 * JWT
 *  ↓
 * req.user
 *  ↓
 * userStore
 *  ↓
 * complete User
 */

export interface AuthenticatedRequest
  extends Request {
  user?: {
    id?: string;
    address?: string;
    email?: string;
    username?: string;
  };
}

/*
 * ---------------------------------------------------------
 * JWT PAYLOAD
 * ---------------------------------------------------------
 *
 * New CyBuilder JWT:
 *
 * {
 *   sub: "user-id",
 *   id: "user-id",
 *   address: "0x...",
 *   iat: ...,
 *   exp: ...
 * }
 *
 * Email accounts may contain:
 *
 * {
 *   sub: "user-id",
 *   id: "user-id",
 *   email: "user@example.com",
 *   iat: ...,
 *   exp: ...
 * }
 */

interface JwtPayload {
  sub?: string;

  id?: string;

  address?: string;

  email?: string;

  username?: string;

  iat?: number;

  exp?: number;
}

/*
 * ---------------------------------------------------------
 * AUTHENTICATE TOKEN
 * ---------------------------------------------------------
 */

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const JWT_SECRET =
    process.env.JWT_SECRET;

  /*
   * -------------------------------------------------------
   * SERVER CONFIGURATION
   * -------------------------------------------------------
   */

  if (!JWT_SECRET) {
    console.error(
      "JWT_SECRET is not configured."
    );

    return res.status(500).json({
      error:
        "Server authentication configuration error",
    });
  }

  /*
   * -------------------------------------------------------
   * GET AUTHORIZATION HEADER
   * -------------------------------------------------------
   */

  const authHeader =
    req.headers.authorization;

  if (
    !authHeader ||
    !authHeader.startsWith("Bearer ")
  ) {
    return res.status(401).json({
      error:
        "Access token missing",
    });
  }

  /*
   * -------------------------------------------------------
   * EXTRACT TOKEN
   * -------------------------------------------------------
   */

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

  /*
   * -------------------------------------------------------
   * VERIFY TOKEN
   * -------------------------------------------------------
   */

  try {
    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      ) as JwtPayload;

    /*
     * -----------------------------------------------------
     * DETERMINE USER ID
     * -----------------------------------------------------
     *
     * `sub` is the standard JWT subject.
     *
     * `id` is kept for compatibility with our
     * current CyBuilder tokens.
     */

    const userId =
      decoded.sub ||
      decoded.id;

    /*
     * -----------------------------------------------------
     * VALIDATE IDENTITY
     * -----------------------------------------------------
     *
     * A valid token must identify an account somehow.
     *
     * New accounts should always have `sub`.
     */

    if (
      !userId &&
      !decoded.address &&
      !decoded.email
    ) {
      return res.status(401).json({
        error:
          "Invalid token payload",
      });
    }

    /*
     * -----------------------------------------------------
     * NORMALIZE REQUEST USER
     * -----------------------------------------------------
     */

    req.user = {
      id: userId,

      address:
        decoded.address
          ?.toLowerCase(),

      email:
        decoded.email
          ?.toLowerCase(),

      username:
        decoded.username,
    };

    /*
     * -----------------------------------------------------
     * CONTINUE
     * -----------------------------------------------------
     */

    next();
  } catch (error) {
    /*
     * -----------------------------------------------------
     * EXPIRED TOKEN
     * -----------------------------------------------------
     *
     * AuthContext.authFetch() can use this 401 to
     * automatically call /auth/refresh.
     */

    if (
      error instanceof
      jwt.TokenExpiredError
    ) {
      return res.status(401).json({
        error:
          "Access token expired",
      });
    }

    /*
     * -----------------------------------------------------
     * INVALID TOKEN
     * -----------------------------------------------------
     */

    console.error(
      "JWT verification error:",
      error
    );

    return res.status(403).json({
      error:
        "Invalid authentication token",
    });
  }
}