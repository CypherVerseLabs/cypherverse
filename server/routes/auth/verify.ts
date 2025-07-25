import { Router } from "express";
import { verifyMessage } from "ethers";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SECRET_KEY";

// Import or share the nonce map from nonce.ts or manage here:
const nonces = new Map<string, string>(); // **Important:** This should be shared or centralized in prod!

router.post("/verify", (req, res) => {
  const { address, signature } = req.body;

  if (!address || !signature) {
    return res.status(400).json({ error: "Missing params" });
  }

  const nonce = nonces.get(address.toLowerCase());
  if (!nonce) {
    return res.status(400).json({ error: "No nonce for this address" });
  }

  const message = `Sign this message to log in: ${nonce}`;

  try {
    const recoveredAddress = verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Issue JWT token
    const token = jwt.sign({ address }, JWT_SECRET, { expiresIn: "1h" });

    // Remove used nonce
    nonces.delete(address.toLowerCase());

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

export default router;
