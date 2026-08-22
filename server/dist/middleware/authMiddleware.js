import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SECRET_KEY";
export function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    if (!token) {
        return res.status(401).json({ error: "Access token missing" });
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid or expired token" });
        }
        req.user = user;
        next();
    });
}
