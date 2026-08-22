// server/stores/userStore.ts
// Store both wallet users and email users
const walletUsers = new Map(); // key = address
const emailUsers = new Map(); // key = email
// Create user by wallet address
export function createWalletUser(address) {
    const user = {
        address,
        createdAt: new Date().toISOString(),
    };
    walletUsers.set(address.toLowerCase(), user);
    return user;
}
// Create user by email
export function createEmailUser(email, passwordHash) {
    const user = {
        email,
        passwordHash,
        createdAt: new Date().toISOString(),
    };
    emailUsers.set(email.toLowerCase(), user);
    return user;
}
// Get user by wallet address
export function getUserByAddress(address) {
    return walletUsers.get(address.toLowerCase());
}
// Get user by email
export function getUserByEmail(email) {
    return emailUsers.get(email.toLowerCase());
}
// Update wallet user
export function updateUserByAddress(address, updates) {
    const user = walletUsers.get(address.toLowerCase());
    if (!user)
        return undefined;
    const updated = { ...user, ...updates };
    walletUsers.set(address.toLowerCase(), updated);
    return updated;
}
// Update email user
export function updateUserByEmail(email, updates) {
    const user = emailUsers.get(email.toLowerCase());
    if (!user)
        return undefined;
    const updated = { ...user, ...updates };
    emailUsers.set(email.toLowerCase(), updated);
    return updated;
}
export { walletUsers, emailUsers };
