import { useEffect, useState } from "react";
import { BrowserProvider } from "ethers";

const API_URL = "http://localhost:5000";

export function useAuth() {
  const [jwt, setJwt] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [user, setUser] = useState<{ email?: string; username?: string; address?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper: fetch with access token
  const authFetch = async (input: RequestInfo, init?: RequestInit) => {
    if (!jwt) throw new Error("No JWT token");

    const res = await fetch(input, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${jwt}`,
      },
      credentials: "include",
    });

    if (res.status === 401) {
      const refreshed = await refreshToken();
      if (refreshed) {
        return authFetch(input, init);
      } else {
        logout();
        throw new Error("Session expired");
      }
    }

    return res;
  };

  // Refresh token
  const refreshToken = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        setJwt(null);
        setWalletAddress(null);
        setUser(null);
        return false;
      }

      const data = await res.json();
      setJwt(data.token);
      return true;
    } catch {
      setJwt(null);
      setWalletAddress(null);
      setUser(null);
      return false;
    }
  };

  // On mount: restore session and user info
  useEffect(() => {
    (async () => {
      setLoading(true);
      const refreshed = await refreshToken();
      if (refreshed) {
        try {
          const meRes = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${jwt}` },
            credentials: "include",
          });
          if (meRes.ok) {
            const data = await meRes.json();
            setWalletAddress(data.user.address);
            setUser({
              email: data.user.email,
              username: data.user.username,
              address: data.user.address,
            });
          } else {
            logout();
          }
        } catch {
          logout();
        }
      }
      setLoading(false);
    })();
  }, [jwt]);

  // Wallet login (unchanged)
  const loginWithWallet = async () => {
    try {
      if (!(window as any).ethereum) throw new Error("MetaMask not found");

      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const nonceRes = await fetch(`${API_URL}/auth/nonce`, {
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

      const verifyRes = await fetch(`${API_URL}/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature }),
        credentials: "include",
      });

      if (!verifyRes.ok) {
        const errorText = await verifyRes.text();
        throw new Error(`Verification failed: ${verifyRes.status} - ${errorText}`);
      }

      const { token, user: verifiedUser } = await verifyRes.json();

      setJwt(token);
      setWalletAddress(address);
      setUser({
        email: verifiedUser.email,
        username: verifiedUser.username,
        address: verifiedUser.address,
      });
    } catch (err: any) {
      alert(err.message || "Wallet login failed");
    }
  };

  const logout = () => {
    setJwt(null);
    setWalletAddress(null);
    setUser(null);
    // Optionally call backend logout to clear cookie
  };

  return { jwt, walletAddress, user, setUser, loginWithWallet, logout, loading, authFetch };
}
