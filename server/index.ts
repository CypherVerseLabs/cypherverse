// server/index.ts

import dotenv from "dotenv";

dotenv.config({
  path: ".env",
});

import express, {
  Request,
  Response,
  NextFunction,
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
import meRouter from "./routes/auth/me.js";
import projectRouter from "./routes/auth/projects.js";
import aiRouter from "./routes/auth/ai.js";
import publicProjectRouter from "./routes/public/projects.js";
import parcelRouter from "./routes/parcels.js";
import marketplaceRouter from "./routes/marketplace.js";
import marketplaceRoutes from "./routes/marketplaceRoutes.js";

import ideasRouter from "./routes/ideas.js";

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
  getUserById,
  updateUserById,
} from "./stores/userStore.js";

// =========================================================
// ENVIRONMENT
// =========================================================

const JWT_SECRET =
  process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is not defined"
  );
}

const PORT =
  Number(process.env.PORT) || 5000;

const NODE_ENV =
  process.env.NODE_ENV || "development";

// =========================================================
// APP
// =========================================================

const app = express();

// =========================================================
// CORS
// =========================================================

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
      // Allow non-browser requests.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (
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

// =========================================================
// BODY PARSING
// =========================================================

/*
 * 12 MB request limit.
 *
 * This is intentionally larger than the
 * 10 MB scene limit so the application can
 * still return a controlled 413 response.
 */

app.use(
  express.json({
    limit: "12mb",
  })
);

// =========================================================
// COOKIES
// =========================================================

app.use(cookieParser());

// =========================================================
// HEALTH CHECK
// =========================================================

app.get(
  "/",
  (
    _req: Request,
    res: Response
  ) => {
    return res.status(200).json({
      ok: true,
      service: "CyBuilder Auth Server",
      environment: NODE_ENV,
    });
  }
);

app.get(
  "/health",
  (
    _req: Request,
    res: Response
  ) => {
    return res.status(200).json({
      ok: true,
    });
  }
);

// =========================================================
// AUTH ROUTES
// =========================================================

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
  "/auth/me",
  meRouter
);

app.use(
  "/api",
  emailAuthRouter
);

// =========================================================
// PUBLIC PROJECT ROUTES
// =========================================================

app.use(
  "/api/public/projects",
  publicProjectRouter
);

// =========================================================
// AUTHENTICATED PROJECT ROUTES
// =========================================================

console.log(
  "MOUNTING PROJECT ROUTER"
);

app.use(
  "/api/projects",
  (req, _res, next) => {
    console.log(
      "🔥 API PROJECTS REQUEST:",
      req.method,
      req.originalUrl
    );

    next();
  }
);

app.use(
  "/api/projects",
  projectRouter
);

// =========================================================
// IDEAS ROUTES
// =========================================================

console.log(
  "MOUNTING IDEAS ROUTER"
);

app.use(
  "/api/ideas",
  (req, _res, next) => {
    console.log(
      "🔥 API IDEAS REQUEST:",
      req.method,
      req.originalUrl
    );

    next();
  }
);

app.use(
  "/api/ideas",
  ideasRouter
);

console.log(
  "IDEAS ROUTER MOUNTED"
);

// =========================================================
// PARCEL ROUTES
// =========================================================

console.log(
  "MOUNTING PARCEL ROUTER"
);

app.use(
  "/api/parcels",
  (req, _res, next) => {
    console.log(
      "🔥 API PARCELS REQUEST:",
      req.method,
      req.originalUrl
    );

    next();
  }
);

app.use(
  "/api/parcels",
  parcelRouter
);

console.log(
  "PARCEL ROUTER MOUNTED"
);

// =========================================================
// MARKETPLACE ROUTES
// =========================================================

console.log(
  "MOUNTING MARKETPLACE ROUTER"
);

app.use(
  "/api/marketplace",
  (req, _res, next) => {
    console.log(
      "🔥 API MARKETPLACE REQUEST:",
      req.method,
      req.originalUrl
    );

    next();
  }
);

app.use(
  "/api/marketplace",
  marketplaceRouter
);

console.log(
  "MARKETPLACE ROUTER MOUNTED"
);

app.use(
  "/api/marketplace",
  marketplaceRoutes
);

// =========================================================
// AI ROUTES
// =========================================================

app.use(
  "/api/ai",
  aiRouter
);

// =========================================================
// CURRENT USER
// =========================================================

app.get(
  "/auth/me",
  authenticateToken,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user?.id) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    try {
      const user =
        await getUserById(
          req.user.id
        );

      if (!user) {
        return res.status(404).json({
          error: "User not found",
        });
      }

      return res.status(200).json({
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

// =========================================================
// UPDATE PROFILE
// =========================================================

app.post(
  "/auth/profile",
  authenticateToken,
  async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    if (!req.user?.id) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const {
      email,
      username,
    } = req.body ?? {};

    // -------------------------------------------------------
    // VALIDATE EMAIL
    // -------------------------------------------------------

    if (
      email !== undefined &&
      typeof email !== "string"
    ) {
      return res.status(400).json({
        error:
          "Email must be a string",
      });
    }

    // -------------------------------------------------------
    // VALIDATE USERNAME
    // -------------------------------------------------------

    if (
      username !== undefined &&
      typeof username !== "string"
    ) {
      return res.status(400).json({
        error:
          "Username must be a string",
      });
    }

    // -------------------------------------------------------
    // NORMALIZE VALUES
    // -------------------------------------------------------

    const normalizedEmail =
      typeof email === "string"
        ? email.trim().toLowerCase()
        : undefined;

    const normalizedUsername =
      typeof username === "string"
        ? username.trim()
        : undefined;

    // -------------------------------------------------------
    // VALIDATE EMAIL LENGTH
    // -------------------------------------------------------

    if (
      normalizedEmail !== undefined &&
      normalizedEmail.length > 320
    ) {
      return res.status(400).json({
        error:
          "Email must be 320 characters or less",
      });
    }

    // -------------------------------------------------------
    // VALIDATE USERNAME LENGTH
    // -------------------------------------------------------

    if (
      normalizedUsername !== undefined &&
      normalizedUsername.length > 50
    ) {
      return res.status(400).json({
        error:
          "Username must be 50 characters or less",
      });
    }

    // -------------------------------------------------------
    // UPDATE USER
    // -------------------------------------------------------

    try {
      const updatedUser =
        await updateUserById(
          req.user.id,
          {
            ...(normalizedEmail !== undefined
              ? {
                  email:
                    normalizedEmail,
                }
              : {}),

            ...(normalizedUsername !== undefined
              ? {
                  username:
                    normalizedUsername,
                }
              : {}),
          }
        );

      // -----------------------------------------------------
      // USER NOT FOUND
      // -----------------------------------------------------

      if (!updatedUser) {
        return res.status(404).json({
          error:
            "User not found",
        });
      }

      // -----------------------------------------------------
      // SUCCESS
      // -----------------------------------------------------

      return res.status(200).json({
        user: {
          id: updatedUser.id,
          address:
            updatedUser.address,
          email:
            updatedUser.email,
          username:
            updatedUser.username,
          createdAt:
            updatedUser.createdAt,
          updatedAt:
            updatedUser.updatedAt,
        },
      });

    } catch (error: unknown) {
      console.error(
        "Update profile error:",
        error
      );

      // -----------------------------------------------------
      // PRISMA UNIQUE CONSTRAINT
      // -----------------------------------------------------
      //
      // P2002 means a unique field already exists.
      // For example, another account may already
      // own the requested email address.
      //

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: unknown }).code ===
          "P2002"
      ) {
        return res.status(409).json({
          error:
            "That email is already in use",
        });
      }

      // -----------------------------------------------------
      // GENERAL ERROR
      // -----------------------------------------------------

      return res.status(500).json({
        error:
          "Failed to update profile",
      });
    }
  }
);

// =========================================================
// LOGOUT
// =========================================================

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
          NODE_ENV ===
          "production",

        sameSite:
          "strict",

        path: "/",
      }
    );

    return res.status(200).json({
      message: "Logged out",
    });
  }
);

// =========================================================
// 404
// =========================================================

app.use(
  (
    req: Request,
    res: Response
  ) => {
    console.warn(
      `404 ${req.method} ${req.originalUrl}`
    );

    return res.status(404).json({
      error: "Route not found",
    });
  }
);

// =========================================================
// GLOBAL ERROR HANDLER
// =========================================================

app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error(
      "Server error:",
      error
    );

    // -------------------------------------------------------
    // CORS ERROR
    // -------------------------------------------------------

    if (
      error instanceof Error &&
      error.message ===
        "Not allowed by CORS"
    ) {
      return res.status(403).json({
        error:
          "CORS origin not allowed",
      });
    }

    // -------------------------------------------------------
    // INVALID JSON
    // -------------------------------------------------------

    if (
      error instanceof SyntaxError
    ) {
      return res.status(400).json({
        error:
          "Invalid JSON request",
      });
    }

    // -------------------------------------------------------
    // GENERAL SERVER ERROR
    // -------------------------------------------------------

    return res.status(500).json({
      error:
        "Internal server error",
    });
  }
);

// =========================================================
// SERVER
// =========================================================

const server =
  app.listen(
    PORT,
    () => {
      console.log(
        `✅ CyBuilder server running on port ${PORT}`
      );

      console.log(
        `Environment: ${NODE_ENV}`
      );

      console.log(
        "Registered routes:"
      );

      console.log(
        "  GET    /"
      );

      console.log(
        "  GET    /health"
      );

      console.log(
        "  POST   /auth/nonce"
      );

      console.log(
        "  POST   /auth/verify"
      );

      console.log(
        "  POST   /auth/refresh"
      );

      console.log(
        "  GET    /auth/me"
      );

      console.log(
        "  POST   /auth/profile"
      );

      console.log(
        "  POST   /auth/logout"
      );

      console.log(
        "  GET    /api/projects"
      );

      console.log(
        "  POST   /api/projects"
      );

      console.log(
        "  GET    /api/projects/:id"
      );

      console.log(
        "  PATCH  /api/projects/:id"
      );

      console.log(
        "  DELETE /api/projects/:id"
      );

      console.log(
        "  POST   /api/projects/:id/publish"
      );

      // =====================================================
      // MARKETPLACE
      // =====================================================

      console.log(
        "  GET    /api/marketplace/listings"
      );

      console.log(
        "  POST   /api/marketplace/parcels/:id/buy"
      );

      console.log(
        "  POST   /api/marketplace/parcels/:id/reserve"
      );

      console.log(
        "  POST   /api/marketplace/parcels/:id/list"
      );

      console.log(
        "  POST   /api/marketplace/parcels/:id/release"
      );

      // =====================================================
      // AI
      // =====================================================

      console.log(
        "  POST   /api/ai"
      );
    }
  );

// =========================================================
// GRACEFUL SHUTDOWN
// =========================================================

function shutdown(
  signal: string
) {
  console.log(
    `🛑 ${signal} received. Shutting down...`
  );

  server.close(
    () => {
      console.log(
        "✅ Server closed."
      );

      process.exit(0);
    }
  );

  setTimeout(() => {
    console.error(
      "⚠️ Forced shutdown."
    );

    process.exit(1);
  }, 10_000).unref();
}

process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);
