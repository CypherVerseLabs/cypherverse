import express from "express";
import cors from "cors";
import { verifyMessage } from "ethers";
import jwt from "jsonwebtoken";

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SECRET_KEY";

app.use(cors());
app.use(express.json());

// In-memory stores
const users = new Map();
const nonces = new Map();

// Wallet nonce endpoint
app.post("/auth/nonce", (req, res) => {
  const { address } = req.body;
  if (!address) return res.status(400).json({ error: "No address provided" });

  const nonce = Math.floor(Math.random() * 1000000).toString();
  nonces.set(address.toLowerCase(), nonce);
  res.json({ nonce });
});

// Wallet verify endpoint
app.post("/auth/verify", (req, res) => {
  const { address, signature } = req.body;
  if (!address || !signature)
    return res.status(400).json({ error: "Missing params" });

  const nonce = nonces.get(address.toLowerCase());
  if (!nonce) return res.status(400).json({ error: "No nonce for this address" });

  const message = `Sign this message to log in: ${nonce}`;

  try {
    const recoveredAddress = verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const token = jwt.sign({ address }, JWT_SECRET, { expiresIn: "1h" });
    nonces.delete(address.toLowerCase());
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

// Email/Password signup
app.post("/api/signup", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing credentials" });

  if (users.has(email))
    return res.status(409).json({ error: "User already exists" });

  users.set(email, password); // NOTE: hash passwords in production
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

// Email/Password login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Missing credentials" });

  const storedPassword = users.get(email);
  if (!storedPassword || storedPassword !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

app.listen(PORT, () => {
  console.log(`✅ Auth server running at http://localhost:${PORT}`);
});
