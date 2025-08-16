import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { createEmailUser, getUserByEmail } from "../../stores/userStore.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SECRET_KEY";

// ===== Signup =====
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  if (getUserByEmail(email)) {
    return res.status(409).json({ error: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  createEmailUser(email, hashedPassword);

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

// ===== Login =====
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const user = getUserByEmail(email);

  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

export default router;
