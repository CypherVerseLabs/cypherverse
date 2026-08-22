// components/ProfileForm.tsx
import { useState } from "react";
import { useAuthContext } from "../context/AuthContext"; // adjust path as needed

export function ProfileForm() {
  const { user, setUser, authFetch } = useAuthContext();
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");

    try {
      const res = await authFetch("http://localhost:5000/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email }),
      });

      if (!res.ok) throw new Error("Update failed");

      const data = await res.json();
      setUser(data.user); // update global context
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Update Profile</h2>
      <label>
        Username:
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </label>
      <br />
      <label>
        Email (optional):
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <br />
      <button type="submit" disabled={status === "saving"}>
        Save
      </button>
      {status === "success" && <p>Profile updated.</p>}
      {status === "error" && <p>Something went wrong.</p>}
    </form>
  );
}
