import { useState, useEffect } from "react";
import type { DialogueFSM } from "cyengine";
import { useAuthContext } from "ideas/context/AuthContext";

function validateEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

function validatePassword(password: string) {
  const complexityRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return complexityRegex.test(password);
}

function isTokenExpired(token: string) {
  try {
    const payload = token.split('.')?.[1];
    if (!payload) return true;
    const decoded = JSON.parse(atob(payload));
    return Date.now() >= (decoded.exp ?? 0) * 1000;
  } catch (e) {
    console.warn("Failed to decode token", e);
    return true;
  }
}

function getEmailFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.email || null;
  } catch {
    return null;
  }
}


export function useApiDialogue(): DialogueFSM
{
  const [name, setName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const { walletAddress, loginWithWallet, logout } = useAuthContext();

  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const token = localStorage.getItem("jwt");
  if (token && !isTokenExpired(token)) {
    setIsLoggedIn(true);
    const email = getEmailFromToken(token);
    if (email) {
      
      setName(email.split("@")[0]); // optionally extract display name
    }
  } else {
    localStorage.removeItem("jwt");
    setIsLoggedIn(false);
  }
}, []);


  const dialogue: DialogueFSM = [
    {
      key: "init",
      text: "Welcome to Cypherverse. What's your name?",
      input: {
        value: name,
        setValue: (val) => {
          setName(val);
          return val;
        },
        persist: true,
      },
      decisions: [{ name: "Continue", nextKey: "menu" }],
    },
    {
      key: "menu",
      text: isLoggedIn
        ? `Welcome back, ${name || "friend"}! What would you like to do next?`
        : `Hi ${name || "there"}! What would you like to do?`,
      decisions: isLoggedIn
        ? [
            { name: "Logout", nextKey: "logout" },
            { name: "Create a World", nextKey: "go_to_build" },
            
          ]
        : [
            { name: "Login with Wallet", nextKey: "login_wallet" },
            { name: "Login with Email", nextKey: "login_email" },
            { name: "Signup", nextKey: "signup_email" },
            { name: "What is Cypherverse?", nextKey: "about" },
          ],
    },
    {
  key: "go_to_build",
  text: "Redirecting you to your world builder...",
  effect: async () => {
    window.location.href = "/buildme"; // or use router.push("/buildme") if inside a component
  },
  decisions: [],
},
    

    // ==== LOGIN FLOW ====
    {
      key: "login_email",
      text: !validateEmail(loginEmail)
        ? "Enter your email to login. (Please enter a valid email)"
        : "Enter your email to login.",
      input: {
        value: loginEmail,
        setValue: (val) => {
  const normalized = val.trim().toLowerCase();
  setLoginEmail(normalized);
  if (!name && validateEmail(normalized)) {
    setName(normalized.split("@")[0]);
  }
  setError(null);
  return normalized;
},
        persist: true,
      },
      decisions: validateEmail(loginEmail)
  ? [
      { name: "Next", nextKey: "login_password" },
      { name: "Cancel", nextKey: "menu" },
    ]
  : [{ name: "Cancel", nextKey: "menu" }],
    },

    {
      key: "login_password",
      text: `Enter your password.${error ? `\nError: ${error}` : ""}`,
      input: {
        value: loginPassword,
        setValue: (val) => {
  const trimmed = val.trim();
  setLoginPassword(trimmed);
  setError(null);
  return trimmed;
},
        persist: true,
        type: "password",
      },
      decisions: validatePassword(loginPassword)
        ? [{ name: "Login", nextKey: "login_submit" },
           { name: "Cancel", nextKey: "menu" },
        ]
        : [{ name: "Cancel", nextKey: "menu" }],
    },

    {
  key: "login_submit",
  text: `Login successful! Welcome, ${name || loginEmail.split("@")[0]}.`,

  effect: async () => {
    setError(null);
    try {
      const email = loginEmail.trim().toLowerCase();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: loginPassword }),
      });

      const data = await res.json().catch(() => null);
      const { token } = data || {};

      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid email or password.");
        throw new Error(data?.message || "Login failed.");
      }

      if (!token) throw new Error("Invalid server response.");

      localStorage.setItem("jwt", token);
      setIsLoggedIn(true);
      
    } catch (e: any) {
      setError(e.message || "Login failed");
      setIsLoggedIn(false);
    }
  },
  decisions: [
  { name: "Continue", nextKey: error ? "login_password" : "menu" },
],

}

,

    // ==== SIGNUP FLOW ====
    {
  key: "signup_email",
  text: `Enter your email to sign up.${error ? `\nError: ${error}` : ""}`,
  input: {
    value: signupEmail,
    setValue: (val) => {
  const normalized = val.trim().toLowerCase();
  setSignupEmail(normalized);
  if (!name && validateEmail(normalized)) {
    setName(normalized.split("@")[0]);
  }
  setError(null);
  return normalized;
},
    persist: true,
  },
  decisions: validateEmail(signupEmail)
    ? [{ name: "Next", nextKey: "signup_password" }]
    : [],
},

    {
      key: "signup_password",
      text: !validatePassword(signupPassword)
        ? "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
        : `Choose a password.${error ? `\nServer error: ${error}` : ""}`,
      input: {
        value: signupPassword,
        setValue: (val) => {
          setSignupPassword(val);
          setError(null);
          return val;
        },
        persist: true,
        type: "password",
      },
      decisions: validatePassword(signupPassword)
        ? [{ name: "Create Account", nextKey: "signup_submit" }]
        : [],
    },
    {
  key: "signup_submit",
  text: `Creating your account...${error ? `\nError: ${error}` : ""}`,
  effect: async () => {
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signupEmail, password: signupPassword }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Signup failed");
      }

      if (!data?.token) {
        setError("Please verify your email address before logging in.");
        return;
      }

      localStorage.setItem("jwt", data.token);
      setIsLoggedIn(true);
      
    } catch (e: any) {
      setError(e.message || "Signup failed");
      setIsLoggedIn(false);
    }
  },
  decisions: [{ name: "Continue", nextKey: error ? "signup_password" : "menu" }],
},


{
  key: "login_wallet",
  text: isLoggedIn
    ? "You're all good to go!"
    : `Connecting your wallet...${error ? `\nError: ${error}` : ""}`,
 effect: async () => {
  setError(null);
  try {
    await loginWithWallet();

    if (!walletAddress) {
      throw new Error("Wallet address not found after login.");
    }

    setName(`Wallet ${walletAddress.slice(0, 6)}...`);
    setIsLoggedIn(true);
  } catch (e: any) {
    setError(e.message || "Wallet login failed.");
    setIsLoggedIn(false);
  }
}
,
  decisions: [{ name: "Continue", nextKey: "menu" }],
},


    // ==== LOGOUT ====
    {
  key: "logout",
  text: "You have been logged out.",
  effect: async () => {
    logout(); // Add this line to use the function
    localStorage.removeItem("jwt");
    setIsLoggedIn(false);
    setLoginEmail("");
    setLoginPassword("");
    setSignupEmail("");
    setSignupPassword("");
    setError(null);
  },
  decisions: [{ name: "Back to Start", nextKey: "init" }],
}
,

    // ==== ABOUT FLOW ====
    {
      key: "about",
      text: "Cypherverse is a decentralized 3D world where creativity, collaboration, and digital identity intersect.",
      decisions: [{ name: "How so?", nextKey: "about_how" }],
    },
    {
      key: "about_how",
      text: "Cypherverse provides a natural place to display all types of content, including 3D models, video, sound, images, and more.",
      decisions: [{ name: "Next", nextKey: "about_future" }],
    },
    {
      key: "about_future",
      text: "The possibilities are endless. Grow with us and combine your digital and physical self.",
      decisions: [{ name: "Back to Menu", nextKey: "menu" }],
    },
  ];

  return dialogue;
}
