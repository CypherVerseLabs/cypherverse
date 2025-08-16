import { Router } from "express";
import jwt from "jsonwebtoken";
import { getUserByAddress, getUserByEmail } from "../../stores/userStore.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SECRET_KEY";

router.get("/", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // JWT payload can contain either address or email
    const decoded = jwt.verify(token, JWT_SECRET) as { address?: string; email?: string };

    let user;

    if (decoded.address) {
      user = getUserByAddress(decoded.address);
    } else if (decoded.email) {
      user = getUserByEmail(decoded.email);
    } else {
      return res.status(400).json({ error: "Invalid token payload" });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (err) {
    console.error("Token verification error:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

export default router;
