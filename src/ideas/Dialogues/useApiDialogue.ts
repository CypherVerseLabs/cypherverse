// src/ideas/Dialogues/useApiDialogue.ts

import { useState } from "react";
import type { DialogueFSM } from "cyengine";
import { useAuthContext } from "../context/AuthContext";

/* =========================================
   VALIDATION
========================================= */

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: string): boolean {
  const complexityRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  return complexityRegex.test(password);
}

/* =========================================
   DIALOGUE
========================================= */

export function useApiDialogue(): DialogueFSM {
  /* =======================================
     AUTH
  ======================================= */

  const {
    user,
    walletAddress,
    loading,
    isAuthenticated,
    loginWithWallet,
    loginWithEmail,
    signup,
    logout,
  } = useAuthContext();

  /* =======================================
     LOCAL DIALOGUE STATE
  ======================================= */

  const [name, setName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  /* =======================================
     DISPLAY NAME
  ======================================= */

  const displayName =
    name ||
    user?.username ||
    (user?.email
      ? user.email.split("@")[0]
      : walletAddress
        ? `Wallet ${walletAddress.slice(0, 6)}...`
        : "friend");

  /* =======================================
     DIALOGUE
  ======================================= */

  const dialogue: DialogueFSM = [
    /* =====================================
       INIT
    ===================================== */

    {
      key: "init",
      text: isAuthenticated
        ? `Welcome back, ${displayName}!`
        : "Welcome to Cypherverse. What's your name?",
      input: isAuthenticated
        ? undefined
        : {
            value: name,
            setValue: (value) => {
              setName(value);
              setError(null);
              return value;
            },
            persist: true,
          },
      decisions: [
        {
          name: "Continue",
          nextKey: "menu",
        },
      ],
    },

    /* =====================================
       MENU
    ===================================== */

    {
  key: "menu",
  text: isAuthenticated
    ? `Welcome back, ${displayName}! What would you like to do next?`
    : `Hi ${displayName}! What would you like to do?`,
  decisions: isAuthenticated
    ? [
        {
          name: "Create a Website",
          nextKey: "visit_template_selector",
        },
        {
          name: "Manage My Websites",
          nextKey: "manage_websites",
        },
        {
          name: "Logout",
          nextKey: "logout",
        },
      ]
    : [
        {
          name: "Login with Wallet",
          nextKey: "login_wallet",
        },
        {
          name: "Login with Email",
          nextKey: "login_email",
        },
        {
          name: "Signup",
          nextKey: "signup_email",
        },
        {
          name: "What is Cypherverse?",
          nextKey: "about",
        },
      ],
},
{
  key: "visit_template_selector",
  text: "Go visit the Template Selector.",
  decisions: [
    {
      name: "Continue",
      nextKey: "menu",
    },
  ],
},


    /* =====================================
       MANAGE WEBSITES
    ===================================== */

    {
  key: "manage_websites",
  text: "Visit the Website Manager.",
  decisions: [
    {
      name: "Continue",
      nextKey: "menu",
    },
  ],
},


    /* =====================================
       EMAIL LOGIN
    ===================================== */

    {
      key: "login_email",
      text: !validateEmail(loginEmail)
        ? "Enter your email to login. (Please enter a valid email)"
        : "Enter your email to login.",
      input: {
        value: loginEmail,
        setValue: (value) => {
          const normalized = value.trim().toLowerCase();

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
            {
              name: "Next",
              nextKey: "login_password",
            },
            {
              name: "Cancel",
              nextKey: "menu",
            },
          ]
        : [
            {
              name: "Cancel",
              nextKey: "menu",
            },
          ],
    },

    /* =====================================
       EMAIL PASSWORD
    ===================================== */

    {
      key: "login_password",
      text: `Enter your password.${error ? `\nError: ${error}` : ""}`,
      input: {
        value: loginPassword,
        setValue: (value) => {
          setLoginPassword(value);
          setError(null);
          return value;
        },
        persist: true,
        type: "password",
      },
      decisions: validatePassword(loginPassword)
        ? [
            {
              name: "Login",
              nextKey: "login_submit",
            },
            {
              name: "Cancel",
              nextKey: "menu",
            },
          ]
        : [
            {
              name: "Cancel",
              nextKey: "menu",
            },
          ],
    },

    /* =====================================
       EMAIL LOGIN SUBMIT
    ===================================== */

    {
      key: "login_submit",
      text: error
        ? `Login failed.\nError: ${error}`
        : "Logging you in...",
      effect: async () => {
        setError(null);

        try {
          await loginWithEmail(loginEmail, loginPassword);

          setName(loginEmail.split("@")[0]);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Login failed.";

          setError(message);
        }
      },
      decisions: [
        {
          name: "Continue",
          nextKey: error ? "login_password" : "menu",
        },
      ],
    },

    /* =====================================
       SIGNUP EMAIL
    ===================================== */

    {
      key: "signup_email",
      text: `Enter your email to sign up.${error ? `\nError: ${error}` : ""}`,
      input: {
        value: signupEmail,
        setValue: (value) => {
          const normalized = value.trim().toLowerCase();

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
        ? [
            {
              name: "Next",
              nextKey: "signup_password",
            },
            {
              name: "Cancel",
              nextKey: "menu",
            },
          ]
        : [
            {
              name: "Cancel",
              nextKey: "menu",
            },
          ],
    },

    /* =====================================
       SIGNUP PASSWORD
    ===================================== */

    {
      key: "signup_password",
      text: !validatePassword(signupPassword)
        ? "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
        : `Choose a password.${error ? `\nServer error: ${error}` : ""}`,
      input: {
        value: signupPassword,
        setValue: (value) => {
          setSignupPassword(value);
          setError(null);
          return value;
        },
        persist: true,
        type: "password",
      },
      decisions: validatePassword(signupPassword)
        ? [
            {
              name: "Create Account",
              nextKey: "signup_submit",
            },
            {
              name: "Cancel",
              nextKey: "menu",
            },
          ]
        : [
            {
              name: "Cancel",
              nextKey: "menu",
            },
          ],
    },

    /* =====================================
       SIGNUP SUBMIT
    ===================================== */

    {
      key: "signup_submit",
      text: error
        ? `Account creation failed.\nError: ${error}`
        : "Creating your account...",
      effect: async () => {
        setError(null);

        try {
          const newUser = await signup(
            signupEmail,
            signupPassword
          );

          /*
           * A null user means the server
           * accepted the signup but requires
           * email verification before login.
           */
          if (!newUser) {
            setError(
              "Please verify your email address before logging in."
            );
            return;
          }

          setName(signupEmail.split("@")[0]);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Signup failed.";

          setError(message);
        }
      },
      decisions: [
        {
          name: "Continue",
          nextKey: error ? "signup_password" : "menu",
        },
      ],
    },

    /* =====================================
       WALLET LOGIN
    ===================================== */

    {
      key: "login_wallet",
      text: loading
        ? "Connecting your wallet..."
        : error
          ? `Wallet login failed.\nError: ${error}`
          : "Connecting your wallet...",
      effect: async () => {
        setError(null);

        try {
          const loggedInUser = await loginWithWallet();

          /*
           * Use the user returned by AuthContext rather
           * than relying on walletAddress state updating
           * immediately.
           */
          if (loggedInUser.address) {
            setName(
              `Wallet ${loggedInUser.address.slice(0, 6)}...`
            );
          } else if (walletAddress) {
            setName(`Wallet ${walletAddress.slice(0, 6)}...`);
          } else {
            setName("Wallet user");
          }
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Wallet login failed.";

          setError(message);
        }
      },
      decisions: [
        {
          name: "Continue",
          nextKey: "menu",
        },
      ],
    },

    /* =====================================
       LOGOUT
    ===================================== */

    {
      key: "logout",
      text: "You have been logged out.",
      effect: async () => {
        try {
          await logout();
        } finally {
          setName("");
          setLoginEmail("");
          setLoginPassword("");
          setSignupEmail("");
          setSignupPassword("");
          setError(null);
        }
      },
      decisions: [
        {
          name: "Back to Start",
          nextKey: "init",
        },
      ],
    },

    /* =====================================
       ABOUT
    ===================================== */

    {
      key: "about",
      text:
        "Cypherverse is a decentralized 3D world where creativity, collaboration, and digital identity intersect.",
      decisions: [
        {
          name: "How so?",
          nextKey: "about_how",
        },
      ],
    },

    {
      key: "about_how",
      text:
        "Cypherverse provides a natural place to display all types of content, including 3D models, video, sound, images, and more.",
      decisions: [
        {
          name: "Next",
          nextKey: "about_future",
        },
      ],
    },

    {
      key: "about_future",
      text:
        "The possibilities are endless. Grow with us and combine your digital and physical self.",
      decisions: [
        {
          name: "Back to Menu",
          nextKey: "menu",
        },
      ],
    },
  ];

  return dialogue;
}

