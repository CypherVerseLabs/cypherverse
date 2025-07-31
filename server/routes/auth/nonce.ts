import { Router } from "express";
import nonces from "../../stores/nonceStore.js"; // 👈 shared

const router = Router();

router.post("/nonce", (req, res) => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: "No address provided" });
  }

  const nonce = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
  nonces.set(address.toLowerCase(), nonce);
  res.json({ nonce });
});

export default router;

