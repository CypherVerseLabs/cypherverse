import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { BrowserProvider } from "ethers";

const API_URL = "http://localhost:5000";

interface User {
  address: string;
  email?: string;
  username?: string;
  createdAt: string;
}

interface AuthContextType {
  jwt: string | null;
  walletAddress: string | null;
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
  loginWithWallet: () => Promise<void>;
  logout: () => void;
  authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Hook to use the context
export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [jwt, setJwt] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Refresh token and optionally populate user info
  const refreshToken = async (): Promise<string | null> => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        setJwt(null);
        setUser(null);
        setWalletAddress(null);
        return null;
      }

      const data = await res.json();
      setJwt(data.token);
      return data.token;
    } catch {
      setJwt(null);
      setUser(null);
      setWalletAddress(null);
      return null;
    }
  };

  // On mount, try to restore session
  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = await refreshToken();
      if (token) {
        const meRes = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (meRes.ok) {
          const data = await meRes.json();
          setUser(data.user);
          setWalletAddress(data.user.address);
        } else {
          logout();
        }
      }
      setLoading(false);
    })();
  }, []);

  // Helper: fetch with token and auto-refresh on 401
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
      const newToken = await refreshToken();
      if (newToken) {
        return authFetch(input, init); // retry
      } else {
        logout();
        throw new Error("Session expired");
      }
    }

    return res;
  };

  const loginWithWallet = async () => {
    try {
      if (typeof window === "undefined" || !(window as any).ethereum) {
        throw new Error("MetaMask is required. Please install it to continue.");
      }

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
      const signature = await signer.signMessage(
        `Sign this message to log in: ${nonce}`
      );

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

      const { token } = await verifyRes.json();
      if (!token) throw new Error("No token returned from server.");

      setJwt(token);
      setWalletAddress(address);

      // Fetch user profile
      const meRes = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });

      if (meRes.ok) {
        const data = await meRes.json();
        setUser(data.user);
      }
    } catch (err: any) {
      alert(err.message || "Wallet login failed");
    }
  };

  const logout = () => {
    setJwt(null);
    setWalletAddress(null);
    setUser(null);
    fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {
      // Ignore logout errors
    });
  };

  return (
    <AuthContext.Provider
      value={{
        jwt,
        walletAddress,
        user,
        setUser,
        loading,
        loginWithWallet,
        logout,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
