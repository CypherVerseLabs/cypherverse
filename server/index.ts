// server/index.ts

import dotenv from "dotenv";

dotenv.config({ path: ".env" });

import express, {
  Request,
  Response,
} from "express";

import cors from "cors";
import cookieParser from "cookie-parser";

// =========================================================
// AUTH ROUTES
// =========================================================

import nonceRouter from "./routes/auth/nonce.js";
import verifyRouter from "./routes/auth/verify.js";
import refreshRouter from "./routes/auth/refresh.js";
import emailAuthRouter from "./routes/auth/emailAuth.js";
import projectRouter from "./routes/auth/projects.js";

// =========================================================
// AUTH MIDDLEWARE
// =========================================================

import {
  authenticateToken,
  AuthenticatedRequest,
} from "./middleware/authMiddleware.js";

// =========================================================
// USER STORE
// =========================================================

import {
  getUserByAddress,
  getUserByEmail,
  updateUserByAddress,
  updateUserByEmail,
} from "./stores/userStore.js";

/*
 * =========================================================
 * ENVIRONMENT
 * =========================================================
 */

console.log(
  "JWT_SECRET loaded:",
  Boolean(process.env.JWT_SECRET)
);

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is not defined"
  );
}

const app = express();

const PORT =
  process.env.PORT || 5000;

/*
 * =========================================================
 * CORS
 * =========================================================
 */

const allowedOrigins =
  (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
  cors({
    origin: (
      origin,
      callback
    ) => {
      /*
       * Allow:
       *
       * - configured frontend origins
       * - requests without an Origin header
       */

      if (
        !origin ||
        allowedOrigins.includes(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(
        new Error(
          "Not allowed by CORS"
        )
      );
    },

    credentials: true,
  })
);

/*
 * =========================================================
 * BODY / COOKIE MIDDLEWARE
 * =========================================================
 */

app.use(express.json());

app.use(cookieParser());

/*
 * =========================================================
 * BASIC HEALTH CHECK
 * =========================================================
 */

app.get(
  "/",
  (
    _req: Request,
    res: Response
  ) => {
    return res.json({
      ok: true,
      service:
        "CyBuilder Auth Server",
    });
  }
);

/*
 * =========================================================
 * AUTH ROUTES
 * =========================================================
 *
 * Wallet nonce:
 *
 * POST /auth/nonce
 *
 * Wallet verification:
 *
 * POST /auth/verify
 *
 * Refresh:
 *
 * POST /auth/refresh
 *
 * Email authentication:
 *
 * /api/*
 */

app.use(
  "/auth",
  nonceRouter
);

app.use(
  "/auth",
  verifyRouter
);

app.use(
  "/auth/refresh",
  refreshRouter
);

app.use(
  "/api",
  emailAuthRouter
);

/*
 * =========================================================
 * PROJECT ROUTES
 * =========================================================
 *
 * Project ownership is determined by the authenticated
 * JWT inside projects.ts.
 *
 * Available routes:
 *
 * POST   /api/projects
 * GET    /api/projects
 * GET    /api/projects/:id
 * PATCH  /api/projects/:id
 * DELETE /api/projects/:id
 *
 * IMPORTANT:
 *
 * This must be registered BEFORE the 404 handler below.
 */

app.use(
  "/api/projects",
  projectRouter
);

/*
 * =========================================================
 * GET CURRENT USER
 * =========================================================
 *
 * GET /auth/me
 */

app.get(
  "/auth/me",
  authenticateToken,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    try {
      let user;

      /*
       * Wallet authentication
       */

      if (
        req.user.address &&
        typeof req.user.address ===
          "string"
      ) {
        user =
          await getUserByAddress(
            req.user.address
          );
      }

      /*
       * Email authentication
       */

      if (
        !user &&
        req.user.email &&
        typeof req.user.email ===
          "string"
      ) {
        user =
          await getUserByEmail(
            req.user.email
          );
      }

      if (!user) {
        return res.status(404).json({
          error:
            "User not found",
        });
      }

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
        "Get current user error:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to load user",
      });
    }
  }
);

/*
 * =========================================================
 * UPDATE USER PROFILE
 * =========================================================
 *
 * POST /auth/profile
 */

app.post(
  "/auth/profile",
  authenticateToken,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const {
      email,
      username,
    } = req.body;

    /*
     * Validate email.
     */

    if (
      email !== undefined &&
      typeof email !== "string"
    ) {
      return res.status(400).json({
        error:
          "Email must be a string",
      });
    }

    /*
     * Validate username.
     */

    if (
      username !== undefined &&
      typeof username !== "string"
    ) {
      return res.status(400).json({
        error:
          "Username must be a string",
      });
    }

    /*
     * =====================================================
     * WALLET USER
     * =====================================================
     */

    if (
      req.user.address &&
      typeof req.user.address ===
        "string"
    ) {
      const updatedUser =
        await updateUserByAddress(
          req.user.address,
          {
            email:
              email !== undefined
                ? email
                    .trim()
                    .toLowerCase()
                : undefined,

            username:
              username !== undefined
                ? username.trim()
                : undefined,
          }
        );

      if (!updatedUser) {
        return res.status(404).json({
          error:
            "User not found",
        });
      }

      return res.json({
        user: updatedUser,
      });
    }

    /*
     * =====================================================
     * EMAIL USER
     * =====================================================
     */

    if (
      req.user.email &&
      typeof req.user.email ===
        "string"
    ) {
      const updatedUser =
        await updateUserByEmail(
          req.user.email,
          {
            email:
              email !== undefined
                ? email
                    .trim()
                    .toLowerCase()
                : undefined,

            username:
              username !== undefined
                ? username.trim()
                : undefined,
          }
        );

      if (!updatedUser) {
        return res.status(404).json({
          error:
            "User not found",
        });
      }

      return res.json({
        user: updatedUser,
      });
    }

    return res.status(400).json({
      error:
        "Invalid authenticated user",
    });
  }
);

/*
 * =========================================================
 * LOGOUT
 * =========================================================
 *
 * POST /auth/logout
 */

app.post(
  "/auth/logout",
  (
    _req: Request,
    res: Response
  ) => {
    res.clearCookie(
      "refreshToken",
      {
        httpOnly: true,

        secure:
          process.env.NODE_ENV ===
          "production",

        sameSite: "strict",
      }
    );

    return res.status(200).json({
      message: "Logged out",
    });
  }
);

/*
 * =========================================================
 * 404 HANDLER
 * =========================================================
 *
 * This MUST remain after every real route.
 */

app.use(
  (
    req: Request,
    res: Response
  ) => {
    console.warn(
      `404 ${req.method} ${req.originalUrl}`
    );

    return res.status(404).json({
      error:
        "Route not found",
    });
  }
);

/*
 * =========================================================
 * ERROR HANDLER
 * =========================================================
 */

app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: express.NextFunction
  ) => {
    console.error(
      "Server error:",
      error
    );

    return res.status(500).json({
      error:
        "Internal server error",
    });
  }
);

/*
 * =========================================================
 * SERVER START
 * =========================================================
 */

const server =
  app.listen(
    PORT,
    () => {
      console.log(
        `✅ Auth server running at http://localhost:${PORT}`
      );

      console.log(
        "Registered routes:"
      );

      console.log(
        "  POST /auth/nonce"
      );

      console.log(
        "  POST /auth/verify"
      );

      console.log(
        "  POST /auth/refresh"
      );

      console.log(
        "  GET  /auth/me"
      );

      console.log(
        "  POST /auth/profile"
      );

      console.log(
        "  POST /auth/logout"
      );

      console.log(
        "  GET  /api/projects"
      );

      console.log(
        "  POST /api/projects"
      );

      console.log(
        "  GET  /api/projects/:id"
      );

      console.log(
        "  PATCH /api/projects/:id"
      );

      console.log(
        "  DELETE /api/projects/:id"
      );
    }
  );

/*
 * =========================================================
 * GRACEFUL SHUTDOWN
 * =========================================================
 */

process.on(
  "SIGINT",
  () => {
    console.log(
      "🛑 Server shutting down..."
    );

    server.close(
      () => {
        process.exit(0);
      }
    );
  }
);

process.on(
  "SIGTERM",
  () => {
    console.log(
      "🛑 Caught SIGTERM, shutting down..."
    );

    server.close(
      () => {
        process.exit(0);
      }
    );
  }
);