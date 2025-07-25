import { Router } from "express";

const router = Router();

// In-memory map to store nonces by address
const nonces = new Map<string, string>();

router.post("/nonce", (req, res) => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: "No address provided" });
  }

  // Generate a random nonce (e.g., 6 digit number as string)
  const nonce = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");

  // Save nonce associated with this wallet address (lowercase)
  nonces.set(address.toLowerCase(), nonce);

  res.json({ nonce });
});

export default router;
