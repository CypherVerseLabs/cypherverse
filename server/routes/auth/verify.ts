import { Router } from "express";
import { verifyMessage } from "ethers";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SECRET_KEY";

router.post("/verify", (req, res) => {
  const { address, signature } = req.body;

  if (!address || !signature) {
    return res.status(400).json({ error: "Missing parameters" });
  }

  // Fixed message that user must sign
  const message = "Please sign this message to login to Cypherverse";

  try {
    const recoveredAddress = verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const token = jwt.sign({ address }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

export default router;
