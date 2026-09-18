// server/middleware/authMiddleware.ts

import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  verifyAuthToken,
} from "../utils/auth.js";

/*
 * =========================================================
 * AUTHENTICATED REQUEST
 * =========================================================
 *
 * req.user represents the authenticated identity extracted
 * from the JWT.
 *
 * The canonical identity is:
 *
 *     req.user.id
 *
 * which equals:
 *
 *     JWT.sub
 *
 * This is the database User.id.
 */

export interface AuthenticatedRequest
  extends Request {
  user?: {
    id: string;

    address?: string;

    email?: string;

    username?: string;
  };
}

/*
 * =========================================================
 * AUTHENTICATE TOKEN
 * =========================================================
 */

export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
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
    const payload =
      verifyAuthToken(token);

    /*
     * -----------------------------------------------------
     * ACCESS TOKEN ONLY
     * -----------------------------------------------------
     *
     * Refresh tokens must NEVER authenticate API requests.
     */

    if (
      payload.type !== "access"
    ) {
      return res.status(401).json({
        error:
          "Invalid access token",
      });
    }

    /*
     * -----------------------------------------------------
     * NORMALIZE REQUEST USER
     * -----------------------------------------------------
     *
     * `sub` is the canonical User.id.
     */

    req.user = {
      id: payload.sub,

      ...(payload.address
        ? {
            address:
              payload.address,
          }
        : {}),

      ...(payload.email
        ? {
            email:
              payload.email,
          }
        : {}),

      ...(payload.username
        ? {
            username:
              payload.username,
          }
        : {}),
    };

    return next();
  } catch (error) {
    /*
     * -----------------------------------------------------
     * TOKEN ERROR
     * -----------------------------------------------------
     */

    console.error(
      "JWT verification error:",
      error
    );

    return res.status(401).json({
      error:
        "Invalid or expired access token",
    });
  }
}
