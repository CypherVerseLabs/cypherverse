import { Router } from "express";
import crypto from "crypto";
import nonces from "../../stores/nonceStore.js";
const router = Router();
router.post("/nonce", (req, res) => {
    const { address } = req.body;
    if (!address || typeof address !== "string") {
        return res.status(400).json({ error: "A valid wallet address is required" });
    }
    const nonce = crypto.randomBytes(16).toString("hex"); // Secure nonce
    nonces.set(address.toLowerCase(), nonce);
    res.json({ nonce });
});
export default router;
