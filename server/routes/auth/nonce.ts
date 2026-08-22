import { Router, Request, Response } from "express";
import crypto from "crypto";
import nonces from "../../stores/nonceStore.js";

const router = Router();

interface NonceRequest {
  address: string;
}

router.post("/nonce", (req: Request<{}, {}, NonceRequest>, res: Response) => {
  const { address } = req.body;

  if (!address || typeof address !== "string") {
    return res.status(400).json({ error: "A valid wallet address is required" });
  }

  const nonce = crypto.randomBytes(16).toString("hex"); // Secure nonce
  nonces.set(address.toLowerCase(), nonce);

  res.json({ nonce });
});

export default router;
