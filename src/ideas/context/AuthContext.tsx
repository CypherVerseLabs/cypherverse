// ideas/context/AuthContext.tsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { BrowserProvider } from "ethers";

/*
 * ---------------------------------------------------------
 * API CONFIGURATION
 * ---------------------------------------------------------
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

console.log("CyBuilder API:", API_URL);

/*
 * ---------------------------------------------------------
 * USER MODEL
 * ---------------------------------------------------------
 *
 * This is the beginning of the CyBuilder account model.
 *
 * User
 *   |
 *   +-- Wallet
 *   +-- Profile
 *   +-- Parcels
 *   +-- Assets
 *   +-- Projects
 *
 */

export interface User {
  id: string;

  address?: string;

  email?: string;

  username?: string;

  createdAt: string;

  updatedAt?: string;
}

/*
 * ---------------------------------------------------------
 * AUTH CONTEXT TYPE
 * ---------------------------------------------------------
 */

interface AuthContextType {
  jwt: string | null;

  user: User | null;

  walletAddress: string | null;

  loading: boolean;

  isAuthenticated: boolean;

  setUser: (user: User | null) => void;

  loginWithWallet: () => Promise<User>;

  loginWithEmail: (
    email: string,
    password: string
  ) => Promise<User>;

  signup: (
    email: string,
    password: string
  ) => Promise<User | null>;

  logout: () => Promise<void>;

  authFetch: (
    input: RequestInfo,
    init?: RequestInit
  ) => Promise<Response>;
}

/*
 * ---------------------------------------------------------
 * CONTEXT
 * ---------------------------------------------------------
 */

const AuthContext =
  createContext<AuthContextType | null>(null);

/*
 * ---------------------------------------------------------
 * HOOK
 * ---------------------------------------------------------
 */

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuthContext must be used within AuthProvider"
    );
  }

  return context;
}

/*
 * ---------------------------------------------------------
 * PROVIDER
 * ---------------------------------------------------------
 */

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [jwt, setJwt] =
    useState<string | null>(null);

  const [user, setUser] =
    useState<User | null>(null);

  const [walletAddress, setWalletAddress] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  /*
   * -------------------------------------------------------
   * CLEAR AUTH STATE
   * -------------------------------------------------------
   */

  const clearAuthState = () => {
    setJwt(null);
    setUser(null);
    setWalletAddress(null);
  };

  /*
   * -------------------------------------------------------
   * REFRESH SESSION
   * -------------------------------------------------------
   */

  const refreshToken =
    async (): Promise<string | null> => {
      try {
        const response = await fetch(
          `${API_URL}/auth/refresh`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        if (!response.ok) {
          return null;
        }

        const data =
          await response.json();

        if (!data?.token) {
          return null;
        }

        setJwt(data.token);

        return data.token;
      } catch (error) {
        console.warn(
          "Authentication refresh failed:",
          error
        );

        return null;
      }
    };

  /*
   * -------------------------------------------------------
   * LOAD CURRENT USER
   * -------------------------------------------------------
   *
   * The server is the source of truth.
   *
   * JWT
   *  ↓
   * /auth/me
   *  ↓
   * User
   *
   */

  const loadCurrentUser =
    async (
      token: string
    ): Promise<User | null> => {
      try {
        const response = await fetch(
          `${API_URL}/auth/me`,
          {
            method: "GET",

            headers: {
              Authorization: `Bearer ${token}`,
            },

            credentials: "include",
          }
        );

        if (!response.ok) {
          return null;
        }

        const data =
          await response.json();

        if (!data?.user) {
          return null;
        }

        const currentUser: User =
          data.user;

        setUser(currentUser);

        if (currentUser.address) {
          setWalletAddress(
            currentUser.address
          );
        } else {
          setWalletAddress(null);
        }

        return currentUser;
      } catch (error) {
        console.warn(
          "Failed to load current user:",
          error
        );

        return null;
      }
    };

  /*
   * -------------------------------------------------------
   * RESTORE SESSION
   * -------------------------------------------------------
   */

  useEffect(() => {
    let mounted = true;

    const restoreSession =
      async () => {
        setLoading(true);

        try {
          const token =
            await refreshToken();

          if (!mounted) {
            return;
          }

          if (!token) {
            clearAuthState();
            return;
          }

          const currentUser =
            await loadCurrentUser(
              token
            );

          if (!mounted) {
            return;
          }

          if (!currentUser) {
            clearAuthState();
          }
        } catch (error) {
          console.warn(
            "Session restoration failed:",
            error
          );

          if (mounted) {
            clearAuthState();
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * -------------------------------------------------------
   * AUTHENTICATED FETCH
   * -------------------------------------------------------
   */

    const authFetch =
    async (
      input: RequestInfo,
      init?: RequestInit
    ): Promise<Response> => {

      if (!jwt) {
        throw new Error(
          "No authenticated session."
        );
      }

      /*
       * -----------------------------------------------------
       * BUILD API URL
       * -----------------------------------------------------
       *
       * Relative API paths:
       *
       *   /api/marketplace/...
       *
       * become:
       *
       *   http://localhost:5000/api/marketplace/...
       *
       * Absolute URLs are left unchanged.
       */

      let requestUrl: RequestInfo = input;

      if (
        typeof input === "string" &&
        input.startsWith("/")
      ) {
        requestUrl =
          `${API_URL}${input}`;
      }


      /*
       * -----------------------------------------------------
       * FIRST REQUEST
       * -----------------------------------------------------
       */

      const headers =
        new Headers(
          init?.headers
        );

      headers.set(
        "Authorization",
        `Bearer ${jwt}`
      );

      headers.set(
        "Accept",
        "application/json"
      );


      let response =
        await fetch(
          requestUrl,
          {
            ...init,

            headers,

            credentials:
              "include",
          }
        );


      /*
       * -----------------------------------------------------
       * TOKEN EXPIRED
       * -----------------------------------------------------
       *
       * If the API returns 401:
       *
       *   1. Refresh the token
       *   2. Save the new token
       *   3. Retry the original request
       */

      if (
        response.status === 401
      ) {

        const newToken =
          await refreshToken();


        /*
         * Refresh failed.
         */

        if (!newToken) {

          clearAuthState();

          throw new Error(
            "Session expired."
          );
        }


        /*
         * ---------------------------------------------------
         * RETRY REQUEST
         * ---------------------------------------------------
         */

        const retryHeaders =
          new Headers(
            init?.headers
          );

        retryHeaders.set(
          "Authorization",
          `Bearer ${newToken}`
        );

        retryHeaders.set(
          "Accept",
          "application/json"
        );


        response =
          await fetch(
            requestUrl,
            {
              ...init,

              headers:
                retryHeaders,

              credentials:
                "include",
            }
          );
      }


      return response;
    };


  /*
   * -------------------------------------------------------
   * WALLET LOGIN
   * -------------------------------------------------------
   */

  const loginWithWallet =
    async (): Promise<User> => {
      if (
        typeof window === "undefined" ||
        !(window as any).ethereum
      ) {
        throw new Error(
          "No compatible wallet was found."
        );
      }

      try {
        const provider =
          new BrowserProvider(
            (window as any).ethereum
          );

        await provider.send(
          "eth_requestAccounts",
          []
        );

        const signer =
          await provider.getSigner();

        const address =
          await signer.getAddress();

        /*
         * Get nonce.
         */

        const nonceResponse =
          await fetch(
            `${API_URL}/auth/nonce`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                address,
              }),

              credentials: "include",
            }
          );

        if (!nonceResponse.ok) {
          throw new Error(
            `Failed to get wallet nonce: ${nonceResponse.status}`
          );
        }

        const nonceData =
          await nonceResponse.json();

        if (!nonceData?.nonce) {
          throw new Error(
            "Authentication server did not return a nonce."
          );
        }

        /*
         * Sign nonce.
         */

        const message =
          `Sign this message to log in: ${nonceData.nonce}`;

        const signature =
          await signer.signMessage(
            message
          );

        /*
         * Verify signature.
         */

        const verifyResponse =
          await fetch(
            `${API_URL}/auth/verify`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                address,
                signature,
              }),

              credentials: "include",
            }
          );

        if (!verifyResponse.ok) {
          const errorText =
            await verifyResponse.text();

          throw new Error(
            `Wallet verification failed: ${verifyResponse.status}${
              errorText
                ? ` - ${errorText}`
                : ""
            }`
          );
        }

        const verifyData =
          await verifyResponse.json();

        if (!verifyData?.token) {
          throw new Error(
            "Authentication server did not return a token."
          );
        }

        /*
         * Store session.
         */

        setJwt(
          verifyData.token
        );

        setWalletAddress(
          address
        );

        /*
         * IMPORTANT:
         *
         * Don't trust the user returned by the
         * wallet request as the final account.
         *
         * Ask the server for the account.
         */

        const currentUser =
          await loadCurrentUser(
            verifyData.token
          );

        if (!currentUser) {
          throw new Error(
            "Authentication succeeded but the user account could not be loaded."
          );
        }

        return currentUser;
      } catch (error) {
        clearAuthState();

        if (error instanceof Error) {
          throw error;
        }

        throw new Error(
          "Wallet login failed."
        );
      }
    };

  /*
   * -------------------------------------------------------
   * EMAIL LOGIN
   * -------------------------------------------------------
   */

  const loginWithEmail =
    async (
      email: string,
      password: string
    ): Promise<User> => {
      const normalizedEmail =
        email.trim().toLowerCase();

      try {
        const response =
          await fetch(
            `${API_URL}/api/login`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                email: normalizedEmail,
                password,
              }),

              credentials: "include",
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Login failed."
          );
        }

        if (!data?.token) {
          throw new Error(
            "Authentication server did not return a token."
          );
        }

        setJwt(data.token);

        const currentUser =
          await loadCurrentUser(
            data.token
          );

        if (currentUser) {
          return currentUser;
        }

        /*
         * Temporary fallback for an
         * existing email API.
         */

        if (data?.user) {
          const loginUser =
            data.user as User;

          setUser(loginUser);

          return loginUser;
        }

        throw new Error(
          "Authenticated, but no user account was returned."
        );
      } catch (error) {
        clearAuthState();

        if (error instanceof Error) {
          throw error;
        }

        throw new Error(
          "Login failed."
        );
      }
    };

  /*
   * -------------------------------------------------------
   * SIGNUP
   * -------------------------------------------------------
   */

  const signup =
    async (
      email: string,
      password: string
    ): Promise<User | null> => {
      const normalizedEmail =
        email.trim().toLowerCase();

      try {
        const response =
          await fetch(
            `${API_URL}/api/signup`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                email: normalizedEmail,
                password,
              }),

              credentials: "include",
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data?.error ||
              "Signup failed."
          );
        }

        /*
         * Some signup systems require
         * email verification first.
         */

        if (!data?.token) {
          return null;
        }

        setJwt(data.token);

        const currentUser =
          await loadCurrentUser(
            data.token
          );

        if (currentUser) {
          return currentUser;
        }

        if (data?.user) {
          const signupUser =
            data.user as User;

          setUser(signupUser);

          return signupUser;
        }

        return null;
      } catch (error) {
        clearAuthState();

        if (error instanceof Error) {
          throw error;
        }

        throw new Error(
          "Signup failed."
        );
      }
    };

  /*
   * -------------------------------------------------------
   * LOGOUT
   * -------------------------------------------------------
   */

  const logout =
    async (): Promise<void> => {
      /*
       * Clear UI immediately.
       */

      clearAuthState();

      try {
        await fetch(
          `${API_URL}/auth/logout`,
          {
            method: "POST",
            credentials: "include",
          }
        );
      } catch {
        /*
         * Local logout still succeeds.
         */
      }
    };

  /*
   * -------------------------------------------------------
   * AUTH STATE
   * -------------------------------------------------------
   */

  const isAuthenticated =
    Boolean(jwt && user);

  /*
   * -------------------------------------------------------
   * PROVIDER
   * -------------------------------------------------------
   */

  return (
    <AuthContext.Provider
      value={{
        jwt,

        user,

        walletAddress,

        loading,

        isAuthenticated,

        setUser,

        loginWithWallet,

        loginWithEmail,

        signup,

        logout,

        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}