import { useState } from "react";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useWeb3Login() {
  const [jwt, setJwt] = useState<string | null>(null);

  async function loginWithWallet() {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    // Request nonce from backend
    const nonceRes = await fetch('http://localhost:3000/auth/nonce', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    if (!nonceRes.ok) throw new Error("Failed to get nonce");
    const { nonce } = await nonceRes.json();

    // Sign nonce
    const message = `Sign this message to log in: ${nonce}`;
    const signature = await signer.signMessage(message);

    // Verify signature and get JWT
    const verifyRes = await fetch('http://localhost:3000/auth/verify', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, signature }),
    });
    if (!verifyRes.ok) throw new Error("Login verification failed");
    const data = await verifyRes.json();

    if (data.token) {
      setJwt(data.token);
      localStorage.setItem("jwt", data.token);
      return data.token;
    } else {
      throw new Error("Login failed: no token received");
    }
  }

  return { jwt, loginWithWallet };
}
