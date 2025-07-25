import { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";

const JWT_KEY = "jwt";
const USER_ADDR_KEY = "walletAddress";

export function useAuth() {
  const [jwt, setJwt] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check token and restore session on load
  useEffect(() => {
    const storedToken = localStorage.getItem(JWT_KEY);
    if (!storedToken) {
      setLoading(false);
      return;
    }

    fetch("http://localhost:3000/auth/me", {
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Token invalid or expired");
        return res.json();
      })
      .then((data) => {
        if (data.user?.address) {
          setJwt(storedToken);
          setWalletAddress(data.user.address);
        } else {
          logout(); // fallback
        }
      })
      .catch(() => {
        logout(); // remove bad token
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const loginWithWallet = async () => {
    try {
      if (!(window as any).ethereum) throw new Error("MetaMask not found");

      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const nonceRes = await fetch("http://localhost:3000/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      if (!nonceRes.ok) {
        const errorText = await nonceRes.text();
        throw new Error(`Failed to get nonce: ${nonceRes.status} - ${errorText}`);
      }

      const { nonce } = await nonceRes.json();

      const signature = await signer.signMessage(`Sign this message to log in: ${nonce}`);

      const verifyRes = await fetch("http://localhost:3000/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature }),
      });

      if (!verifyRes.ok) {
        const errorText = await verifyRes.text();
        throw new Error(`Verification failed: ${verifyRes.status} - ${errorText}`);
      }

      const { token } = await verifyRes.json();

      localStorage.setItem(JWT_KEY, token);
      localStorage.setItem(USER_ADDR_KEY, address);
      setJwt(token);
      setWalletAddress(address);
    } catch (err: any) {
      alert(err.message || "Wallet login failed");
    }
  };

  const logout = () => {
    localStorage.removeItem(JWT_KEY);
    localStorage.removeItem(USER_ADDR_KEY);
    setJwt(null);
    setWalletAddress(null);
  };

  return { jwt, walletAddress, loginWithWallet, logout, loading };
}
