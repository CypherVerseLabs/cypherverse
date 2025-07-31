import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { verifyMessage } from "ethers";
import jwt from "jsonwebtoken";

// Routers
import nonceRouter from "./routes/auth/nonce.js";
import emailAuthRouter from "./routes/auth/emailAuth.js";

// Stores
import nonces from "./stores/nonceStore.js";

// Types
interface VerifyRequest {
  address: string;
  signature: string;
}

// Init
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SECRET_KEY";

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", nonceRouter);          // /auth/nonce
app.use("/api", emailAuthRouter);       // /api/signup, /api/login

// ===== Wallet Auth (Signature Verification) =====
app.post("/auth/verify", (req: Request<{}, {}, VerifyRequest>, res: Response) => {
  const { address, signature } = req.body;

  if (!address || !signature) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const nonce = nonces.get(address.toLowerCase());
  if (!nonce) {
    return res.status(400).json({ error: "No nonce found for address" });
  }

  const message = `Sign this message to log in: ${nonce}`;

  try {
    const recovered = verifyMessage(message, signature);
    if (recovered.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: "Signature does not match address" });
    }

    const token = jwt.sign({ address }, JWT_SECRET, { expiresIn: "1h" });
    nonces.delete(address.toLowerCase());

    res.json({ token });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ error: "Internal verification error" });
  }
});

// ===== Protected Route (Authenticated User Info) =====
import { authenticateToken, AuthenticatedRequest } from "./middleware/authMiddleware.js";

app.get("/auth/me", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
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
