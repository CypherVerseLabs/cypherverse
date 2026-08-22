// server/stores/userStore.ts

import { prisma } from "../lib/prisma.js";

/**
 * =========================================================
 * USER TYPE
 * =========================================================
 *
 * This mirrors the fields exposed by our authentication
 * system without exposing the database implementation
 * to the rest of the application.
 */

export interface User {
  id: string;

  // Wallet authentication
  address?: string;

  // Email authentication
  email?: string;
  passwordHash?: string;

  // Profile
  username?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * =========================================================
 * DATABASE USER -> APPLICATION USER
 * =========================================================
 */

function toUser(user: {
  id: string;
  address: string | null;
  email: string | null;
  passwordHash: string | null;
  username: string | null;
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    id: user.id,

    ...(user.address
      ? { address: user.address }
      : {}),

    ...(user.email
      ? { email: user.email }
      : {}),

    ...(user.passwordHash
      ? { passwordHash: user.passwordHash }
      : {}),

    ...(user.username
      ? { username: user.username }
      : {}),

    createdAt:
      user.createdAt.toISOString(),

    updatedAt:
      user.updatedAt.toISOString(),
  };
}

/**
 * =========================================================
 * GET USER BY ID
 * =========================================================
 */

export async function getUserById(
  id: string
): Promise<User | undefined> {
  const user =
    await prisma.user.findUnique({
      where: {
        id,
      },
    });

  if (!user) {
    return undefined;
  }

  return toUser(user);
}

/**
 * =========================================================
 * WALLET USERS
 * =========================================================
 */

/**
 * Find a wallet user.
 */

export async function getUserByAddress(
  address: string
): Promise<User | undefined> {
  const normalizedAddress =
    address.toLowerCase();

  const user =
    await prisma.user.findUnique({
      where: {
        address: normalizedAddress,
      },
    });

  if (!user) {
    return undefined;
  }

  return toUser(user);
}

/**
 * Create a wallet user.
 *
 * If the wallet already exists, return the existing
 * account instead of creating a duplicate.
 */

export async function createWalletUser(
  address: string
): Promise<User> {
  const normalizedAddress =
    address.toLowerCase();

  const existing =
    await prisma.user.findUnique({
      where: {
        address: normalizedAddress,
      },
    });

  if (existing) {
    return toUser(existing);
  }

  const user =
    await prisma.user.create({
      data: {
        address: normalizedAddress,
      },
    });

  return toUser(user);
}

/**
 * Update a wallet user's profile.
 */

export async function updateUserByAddress(
  address: string,
  updates: Partial<User>
): Promise<User | undefined> {
  const normalizedAddress =
    address.toLowerCase();

  const existing =
    await prisma.user.findUnique({
      where: {
        address: normalizedAddress,
      },
    });

  if (!existing) {
    return undefined;
  }

  const updated =
    await prisma.user.update({
      where: {
        id: existing.id,
      },

      data: {
        ...(updates.email !== undefined
          ? {
              email:
                updates.email
                  ? updates.email
                      .trim()
                      .toLowerCase()
                  : null,
            }
          : {}),

        ...(updates.username !== undefined
          ? {
              username:
                updates.username
                  ? updates.username.trim()
                  : null,
            }
          : {}),

        ...(updates.passwordHash !== undefined
          ? {
              passwordHash:
                updates.passwordHash || null,
            }
          : {}),
      },
    });

  return toUser(updated);
}

/**
 * =========================================================
 * EMAIL USERS
 * =========================================================
 */

/**
 * Find an email user.
 */

export async function getUserByEmail(
  email: string
): Promise<User | undefined> {
  const normalizedEmail =
    email.trim().toLowerCase();

  const user =
    await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

  if (!user) {
    return undefined;
  }

  return toUser(user);
}

/**
 * Create an email/password user.
 */

export async function createEmailUser(
  email: string,
  passwordHash: string
): Promise<User> {
  const normalizedEmail =
    email.trim().toLowerCase();

  const existing =
    await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

  if (existing) {
    return toUser(existing);
  }

  const user =
    await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
      },
    });

  return toUser(user);
}

/**
 * Update an email user's profile.
 */

export async function updateUserByEmail(
  email: string,
  updates: Partial<User>
): Promise<User | undefined> {
  const normalizedEmail =
    email.trim().toLowerCase();

  const existing =
    await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

  if (!existing) {
    return undefined;
  }

  const updated =
    await prisma.user.update({
      where: {
        id: existing.id,
      },

      data: {
        ...(updates.email !== undefined
          ? {
              email:
                updates.email
                  ? updates.email
                      .trim()
                      .toLowerCase()
                  : null,
            }
          : {}),

        ...(updates.username !== undefined
          ? {
              username:
                updates.username
                  ? updates.username.trim()
                  : null,
            }
          : {}),

        ...(updates.passwordHash !== undefined
          ? {
              passwordHash:
                updates.passwordHash || null,
            }
          : {}),
      },
    });

  return toUser(updated);
}