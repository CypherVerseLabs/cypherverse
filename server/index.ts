import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { verifyMessage } from "ethers";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

// Routers
import nonceRouter from "./routes/auth/nonce.js";
import emailAuthRouter from "./routes/auth/emailAuth.js";


// Stores
import nonces from "./stores/nonceStore.js";
import {
  updateUserByAddress,
  updateUserByEmail,
  getUserByAddress,
  getUserByEmail,
} from "./stores/userStore.js";

// Middleware
import { authenticateToken, AuthenticatedRequest } from "./middleware/authMiddleware.js";

// Init
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

// Middleware
const allowedOrigins = [
  "http://localhost:3000", // Next.js default
  "http://localhost:3005", // Your original port
  "http://localhost:5173", // Vite
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/auth", nonceRouter);
app.use("/api", emailAuthRouter);

// ===== Signature Verification (Wallet Login) =====
interface VerifyRequest {
  address: string;
  signature: string;
}

app.post("/auth/verify", (req: Request<{}, {}, VerifyRequest>, res: Response) => {
  const { address, signature } = req.body;

  if (!address || !signature) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const lowercaseAddress = address.toLowerCase();
  const nonce = nonces.get(lowercaseAddress);
  if (!nonce) {
    return res.status(400).json({ error: "No nonce found for address" });
  }

  const message = `Sign this message to log in: ${nonce}`;

  try {
    const recovered = verifyMessage(message, signature);
    if (recovered.toLowerCase() !== lowercaseAddress) {
      return res.status(401).json({ error: "Signature does not match address" });
    }

    const accessToken = jwt.sign({ address: lowercaseAddress }, JWT_SECRET, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ address: lowercaseAddress }, JWT_SECRET, { expiresIn: "7d" });

    nonces.delete(lowercaseAddress);

    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ token: accessToken });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ error: "Internal verification error" });
  }
});

// ===== Refresh Token =====
app.post("/auth/refresh", (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ error: "No refresh token provided" });
  }

  try {
    const payload = jwt.verify(refreshToken, JWT_SECRET) as { address: string };

    const newAccessToken = jwt.sign({ address: payload.address }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token: newAccessToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    res.status(403).json({ error: "Invalid or expired refresh token" });
  }
});

// ===== Logout Route =====
app.post("/auth/logout", (req: Request, res: Response) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.status(200).json({ message: "Logged out" });
});

// ===== Get Current User Info =====
app.get("/auth/me", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({ user: req.user });
});

// ===== Update User Profile (email, username) =====
app.post("/auth/profile", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const { email, username } = req.body;

  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let updatedUser;

  if ("address" in req.user && typeof req.user.address === "string") {
    updatedUser = updateUserByAddress(req.user.address, { email, username });
  } else if ("email" in req.user && typeof req.user.email === "string") {
    updatedUser = updateUserByEmail(req.user.email, { email, username });
  } else {
    return res.status(400).json({ error: "Invalid user data" });
  }

  if (!updatedUser) {
    return res.status(404).json({ error: "User not found" });
  }

  res.json({ user: updatedUser });
});

// ===== Server Start =====
app.listen(PORT, () => {
  console.log(`✅ Auth server running at http://localhost:${PORT}`);
});

// ===== Graceful Shutdown =====
process.on("SIGINT", () => {
  console.log("🛑 Server shutting down...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("🛑 Caught SIGTERM, exiting...");
  process.exit(0);
});
