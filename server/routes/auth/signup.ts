import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SECRET_KEY";

// In-memory user store: email -> password (plaintext for example, **hash in production**)
const users = new Map<string, string>();

router.post("/signup", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  if (users.has(email)) {
    return res.status(409).json({ error: "User already exists" });
  }

  // Save user (WARNING: never save plaintext password in prod!)
  users.set(email, password);

  // Create JWT token
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });

  res.json({ token });
});

export default router;
