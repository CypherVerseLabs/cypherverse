import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import nonceRoute from "../routes/auth/nonce.js";
import verifyRoute from "../routes/auth/verify.js";
import signupRoute from "../routes/auth/signup.js";
import loginRoute from "../routes/auth/login.js";
import meRoute from "../routes/auth/me.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/auth/nonce", nonceRoute);
app.use("/auth/verify", verifyRoute);
app.use("/auth/me", meRoute);
app.use("/api/signup", signupRoute);
app.use("/api/login", loginRoute);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
