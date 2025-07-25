// server/utils/users.ts

type User = {
  email: string;
  password: string; // In production, this should be a hashed password
};

// In-memory store (you can move this out later if needed)
const users = new Map<string, User>();

export function createUser(email: string, password: string): boolean {
  if (users.has(email)) return false;
  users.set(email, { email, password });
  return true;
}

export function getUser(email: string): User | undefined {
  return users.get(email);
}

export function validateUser(email: string, password: string): boolean {
  const user = users.get(email);
  return user?.password === password;
}
