import { useState } from "react";
import type { DialogueFSM } from "cyengine";
import { useAuthContext } from "ideas/context/AuthContext";

function validateEmail(email: string) {
  return /\S+@\S+\.\S+/.test(email);
}

export function useProfileUpdateDialogue(): DialogueFSM {
  const { user, setUser } = useAuthContext(); // Make sure your context provides these!

  const [email, setEmail] = useState(user?.email || "");
  const [username, setUsername] = useState(user?.username || "");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const dialogue: DialogueFSM = [
    {
      key: "profile_update_email",
      text: !validateEmail(email)
        ? "Enter a valid email to update your profile."
        : "Update your email address.",
      input: {
        value: email,
        setValue: (val) => {
          const normalized = val.trim().toLowerCase();
          setEmail(normalized);
          setError(null);
          setSuccessMsg(null);
          return normalized;
        },
        persist: true,
        // placeholder removed
      },
      decisions: validateEmail(email)
        ? [{ name: "Next", nextKey: "profile_update_username" }]
        : [{ name: "Cancel", nextKey: "menu" }],
    },
    {
      key: "profile_update_username",
      text: "Enter your new username.",
      input: {
        value: username,
        setValue: (val) => {
          const trimmed = val.trim();
          setUsername(trimmed);
          setError(null);
          setSuccessMsg(null);
          return trimmed;
        },
        persist: true,
        // placeholder removed
      },
      decisions: [
        { name: "Back", nextKey: "profile_update_email" },
        { name: "Save", nextKey: "profile_submit" },
        { name: "Cancel", nextKey: "menu" },
      ],
    },
    {
      key: "profile_submit",
      text: `Saving your profile...${error ? `\nError: ${error}` : ""}${successMsg ? `\n${successMsg}` : ""}`,
      effect: async () => {
        setError(null);
        setSuccessMsg(null);
        try {
          const token = localStorage.getItem("jwt");
          if (!token) throw new Error("Not authenticated");

          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
            body: JSON.stringify({ email, username }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || "Failed to update profile");
          }

          if (setUser) setUser(data.user);
          setSuccessMsg("Profile updated successfully!");
        } catch (e: any) {
          setError(e.message || "Error updating profile");
        }
      },
      decisions: [
        { name: "Back to Menu", nextKey: error ? "profile_update_email" : "menu" },
      ],
    },
  ];

  return dialogue;
}
