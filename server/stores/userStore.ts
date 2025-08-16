// server/stores/userStore.ts

export interface User {
  address?: string;      // for wallet users
  email?: string;        // for email/password users
  username?: string;
  passwordHash?: string; // for email login
  createdAt: string;
}

// Store both wallet users and email users
const walletUsers = new Map<string, User>(); // key = address
const emailUsers = new Map<string, User>();  // key = email

// Create user by wallet address
export function createWalletUser(address: string): User {
  const user: User = {
    address,
    createdAt: new Date().toISOString(),
  };
  walletUsers.set(address.toLowerCase(), user);
  return user;
}

// Create user by email
export function createEmailUser(email: string, passwordHash: string): User {
  const user: User = {
    email,
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  emailUsers.set(email.toLowerCase(), user);
  return user;
}

// Get user by wallet address
export function getUserByAddress(address: string): User | undefined {
  return walletUsers.get(address.toLowerCase());
}

// Get user by email
export function getUserByEmail(email: string): User | undefined {
  return emailUsers.get(email.toLowerCase());
}

// Update wallet user
export function updateUserByAddress(address: string, updates: Partial<User>): User | undefined {
  const user = walletUsers.get(address.toLowerCase());
  if (!user) return undefined;

  const updated = { ...user, ...updates };
  walletUsers.set(address.toLowerCase(), updated);
  return updated;
}

// Update email user
export function updateUserByEmail(email: string, updates: Partial<User>): User | undefined {
  const user = emailUsers.get(email.toLowerCase());
  if (!user) return undefined;

  const updated = { ...user, ...updates };
  emailUsers.set(email.toLowerCase(), updated);
  return updated;
}

export {
  walletUsers,
  emailUsers
};
