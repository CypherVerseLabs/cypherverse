// server/utils/users.ts
// In-memory store (you can move this out later if needed)
const users = new Map();
export function createUser(email, password) {
    if (users.has(email))
        return false;
    users.set(email, { email, password });
    return true;
}
export function getUser(email) {
    return users.get(email);
}
export function validateUser(email, password) {
    const user = users.get(email);
    return user?.password === password;
}
