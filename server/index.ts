import express, { Request, Response } from "express";
import cors from "cors";
import { verifyMessage } from "ethers";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = 5000;
const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SECRET_KEY";

// Middleware
app.use(cors());
app.use(express.json());

// In-memory stores
const users = new Map<string, string>(); // email -> password
const nonces = new Map<string, string>(); // walletAddress -> nonce

// ===== Types =====
interface NonceRequest {
  address: string;
}

interface VerifyRequest {
  address: string;
  signature: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

// ===== Wallet Auth =====
app.post("/auth/nonce", (req: Request<{}, {}, NonceRequest>, res: Response) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "No address provided" });

  const nonce = Math.floor(Math.random() * 1000000).toString();
  nonces.set(address.toLowerCase(), nonce);
  res.json({ nonce });
});

app.post("/auth/verify", (req: Request<{}, {}, VerifyRequest>, res: Response) => {
  const { address, signature } = req.body;
  if (!address || !signature) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  const nonce = nonces.get(address.toLowerCase());
  if (!nonce) return res.status(400).json({ error: "No nonce found for address" });

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

// ===== Email/Password Auth =====
app.post("/api/signup", (req: Request<{}, {}, LoginRequest>, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  if (users.has(email)) {
    return res.status(409).json({ error: "User already exists" });
  }

  users.set(email, password); // ⚠️ In production, hash this!
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

app.post("/api/login", (req: Request<{}, {}, LoginRequest>, res: Response) => {
  const { email, password } = req.body;
  const stored = users.get(email);
  if (!stored || stored !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

// ===== Authenticated Route =====
app.get("/auth/me", (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  const token = authHeader.slice(7); // remove "Bearer "

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

// ===== Start Server =====
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
