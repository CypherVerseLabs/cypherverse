import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { getUserByEmail } from "../../stores/userStore.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SECRET_KEY";

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const user = getUserByEmail(email);

  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const match = await bcrypt.compare(password, user.passwordHash);

  if (!match) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
  res.json({ token });
});

export default router;
