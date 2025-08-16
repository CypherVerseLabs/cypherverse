import { Router } from "express";
import jwt from "jsonwebtoken";
import { getUserByAddress, updateUserByAddress } from "../../stores/userStore.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SECRET_KEY";

router.post("/", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { address: string };
    const { address } = decoded;

    const user = getUserByAddress(address);
    if (!user) return res.status(404).json({ error: "User not found" });

    const { username, email } = req.body;

    // Update stored user
    const updatedUser = updateUserByAddress(address, { username, email });

    return res.json({ user: updatedUser });
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
});

export default router;
