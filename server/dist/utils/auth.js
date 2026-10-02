// server/utils/auth.ts
import jwt from "jsonwebtoken";
/*
 * =========================================================
 * JWT SECRET
 * =========================================================
 */
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.trim().length === 0) {
        throw new Error("JWT_SECRET is not defined. Set JWT_SECRET in server/.env");
    }
    return secret;
}
/*
 * =========================================================
 * TOKEN EXPIRATION
 * =========================================================
 */
export const ACCESS_TOKEN_EXPIRES_IN = "1h";
export const REFRESH_TOKEN_EXPIRES_IN = "7d";
/*
 * =========================================================
 * REFRESH COOKIE
 * =========================================================
 */
export const REFRESH_COOKIE_NAME = "refreshToken";
export const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
/*
 * =========================================================
 * CREATE ACCESS TOKEN
 * =========================================================
 */
export function createAccessToken(payload) {
    const secret = getJwtSecret();
    return jwt.sign({
        ...payload,
        type: "access",
    }, secret, {
        algorithm: "HS256",
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
}
/*
 * =========================================================
 * CREATE REFRESH TOKEN
 * =========================================================
 */
export function createRefreshToken(payload) {
    const secret = getJwtSecret();
    return jwt.sign({
        ...payload,
        type: "refresh",
    }, secret, {
        algorithm: "HS256",
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });
}
/*
 * =========================================================
 * VERIFY TOKEN
 * =========================================================
 */
export function verifyAuthToken(token) {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret, {
        algorithms: ["HS256"],
    });
    if (typeof decoded !== "object" ||
        decoded === null) {
        throw new Error("Invalid JWT payload");
    }
    const payload = decoded;
    /*
     * `sub` is mandatory because it is the
     * canonical user identity.
     */
    if (typeof payload.sub !== "string") {
        throw new Error("JWT subject is missing");
    }
    /*
     * Token type is mandatory.
     */
    if (payload.type !== "access" &&
        payload.type !== "refresh") {
        throw new Error("Invalid JWT token type");
    }
    return {
        sub: payload.sub,
        address: typeof payload.address ===
            "string"
            ? payload.address
                .trim()
                .toLowerCase()
            : undefined,
        email: typeof payload.email ===
            "string"
            ? payload.email
                .trim()
                .toLowerCase()
            : undefined,
        username: typeof payload.username ===
            "string"
            ? payload.username
            : undefined,
        type: payload.type,
    };
}
/*
 * =========================================================
 * REFRESH COOKIE OPTIONS
 * =========================================================
 */
export function getRefreshCookieOptions() {
    const production = process.env.NODE_ENV ===
        "production";
    return {
        httpOnly: true,
        secure: production,
        sameSite: production
            ? "strict"
            : "lax",
        path: "/",
        maxAge: REFRESH_COOKIE_MAX_AGE,
    };
}
/*
 * =========================================================
 * CLEAR REFRESH COOKIE OPTIONS
 * =========================================================
 */
export function getClearRefreshCookieOptions() {
    const production = process.env.NODE_ENV ===
        "production";
    return {
        httpOnly: true,
        secure: production,
        sameSite: production
            ? "strict"
            : "lax",
        path: "/",
    };
}
