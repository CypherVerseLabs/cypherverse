import { useState } from "react";
import type { DialogueFSM } from "cyengine";

export function useApiDialogue({ loginWithWallet }: { loginWithWallet: () => Promise<void> }): DialogueFSM {
  const [name, setName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("jwt")
  );

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
            { name: "What is Cypherverse?", nextKey: "about" },
            { name: "Logout", nextKey: "logout" },
          ]
        : [
            { name: "Login with Email", nextKey: "login_email" },
            { name: "Signup", nextKey: "signup_email" },
            { name: "Login with Wallet", nextKey: "login_wallet" },
            { name: "What is Cypherverse?", nextKey: "about" },
          ],
    },

    // ==== LOGIN FLOW ====
    {
      key: "login_email",
      text: "Enter your email to login:",
      input: {
        value: loginEmail,
        setValue: (val) => {
          setLoginEmail(val);
          return val;
        },
        persist: true,
      },
      decisions: [{ name: "Next", nextKey: "login_password" }],
    },
    {
      key: "login_password",
      text: "Enter your password:",
      input: {
        value: loginPassword,
        setValue: (val) => {
          setLoginPassword(val);
          return val;
        },
        persist: true,
        type: "password",
      },
      decisions: [{ name: "Login", nextKey: "login_submit" }],
    },
    {
      key: "login_submit",
      text: "Logging in...",
      effect: async () => {
        try {
          const res = await fetch("http://localhost:3000/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: loginEmail, password: loginPassword }),
          });
          if (!res.ok) throw new Error("Login failed");
          const { token } = await res.json();
          localStorage.setItem("jwt", token);
          setIsLoggedIn(true);
        } catch (e: any) {
          alert(e.message || "Login failed");
          setIsLoggedIn(false);
        }
      },
      decisions: [{ name: "Continue", nextKey: "menu" }],
    },

    // ==== SIGNUP FLOW ====
    {
      key: "signup_email",
      text: "Enter your email to sign up:",
      input: {
        value: signupEmail,
        setValue: (val) => {
          setSignupEmail(val);
          return val;
        },
        persist: true,
      },
      decisions: [{ name: "Next", nextKey: "signup_password" }],
    },
    {
      key: "signup_password",
      text: "Choose a password:",
      input: {
        value: signupPassword,
        setValue: (val) => {
          setSignupPassword(val);
          return val;
        },
        persist: true,
        type: "password",
      },
      decisions: [{ name: "Create Account", nextKey: "signup_submit" }],
    },
    {
      key: "signup_submit",
      text: "Creating your account...",
      effect: async () => {
        try {
          const res = await fetch("http://localhost:3000/api/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: signupEmail, password: signupPassword }),
          });
          if (!res.ok) throw new Error("Signup failed");
          const { token } = await res.json();
          localStorage.setItem("jwt", token);
          setIsLoggedIn(true);
        } catch (e: any) {
          alert(e.message || "Signup failed");
          setIsLoggedIn(false);
        }
      },
      decisions: [{ name: "Continue", nextKey: "menu" }],
    },

    // ==== WALLET LOGIN FLOW ====
    {
  key: "login_wallet",
  text: isLoggedIn ? "You're all good to go!" : "Connecting your wallet...",
  effect: async () => {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        throw new Error("MetaMask not found");
      }
      await loginWithWallet();
      setIsLoggedIn(true);
    } catch (e: any) {
      alert(e.message || "Wallet login failed");
      setIsLoggedIn(false);
    }
  },
  decisions: [{ name: "Continue", nextKey: "menu" }],
},


    // ==== LOGOUT ====
    {
      key: "logout",
      text: "You have been logged out.",
      effect: async () => {
        localStorage.removeItem("jwt");
        setIsLoggedIn(false);
        setLoginEmail("");
        setLoginPassword("");
        setSignupEmail("");
        setSignupPassword("");
      },
      decisions: [{ name: "Back to Menu", nextKey: "menu" }],
    },

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
