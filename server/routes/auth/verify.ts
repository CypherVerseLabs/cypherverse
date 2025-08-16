// server/routes/auth/verify.ts
import { Router, Request, Response } from "express";
import { verifyMessage } from "ethers";
import jwt from "jsonwebtoken";
import nonces from "../../stores/nonceStore.js";
import { getUserByAddress, createWalletUser } from "../../stores/userStore.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined");

interface VerifyRequest {
  address: string;
  signature: string;
}

router.post("/verify", (req: Request<{}, {}, VerifyRequest>, res: Response) => {
  const { address, signature } = req.body;

  if (!address || !signature) {
    return res.status(400).json({ error: "Missing address or signature" });
  }

  const lowercaseAddress = address.toLowerCase();
  const nonce = nonces.get(lowercaseAddress);

  if (!nonce) {
    return res.status(400).json({ error: "No nonce found for this address" });
  }

  const message = `Sign this message to log in: ${nonce}`;

  try {
    const recoveredAddress = verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== lowercaseAddress) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // ✅ Create user if they don't exist
    let user = getUserByAddress(lowercaseAddress);
    if (!user) {
      user = createWalletUser(lowercaseAddress);
    }

    const accessToken = jwt.sign({ address: lowercaseAddress }, JWT_SECRET, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ address: lowercaseAddress }, JWT_SECRET, { expiresIn: "7d" });

    nonces.delete(lowercaseAddress);

    res
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ token: accessToken });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ error: "Internal verification error" });
  }
});

export default router;
