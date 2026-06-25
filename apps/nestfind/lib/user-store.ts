import type { AuthUser, Role } from './auth-types';
import { hashPassword, verifyPassword, generateUserId, createSessionToken } from './auth';

export type StoredUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
  createdAt: string;
};

const inMemoryUsers = new Map<string, StoredUser>();

function getInMemoryUserByEmail(email: string): StoredUser | undefined {
  for (const user of inMemoryUsers.values()) {
    if (user.email === email) return user;
  }
  return undefined;
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const user = getInMemoryUserByEmail(email);
  return user || null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  return inMemoryUsers.get(id) || null;
}

export async function createUser(
  email: string,
  password: string,
  name: string,
  role: Role,
): Promise<{ user: AuthUser; token: string }> {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error('Email already registered');
  }

  const id = generateUserId();
  const passwordHash = hashPassword(password);

  const stored: StoredUser = {
    id,
    email,
    name,
    role,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  inMemoryUsers.set(id, stored);

  const authUser: AuthUser = { id, email, name, role };
  const token = createSessionToken(authUser);

  return { user: authUser, token };
}

export async function authenticateUser(
  email: string,
  password: string,
): Promise<{ user: AuthUser; token: string } | null> {
  const stored = await findUserByEmail(email);
  if (!stored) return null;

  const isValid = verifyPassword(password, stored.passwordHash);
  if (!isValid) return null;

  const authUser: AuthUser = {
    id: stored.id,
    email: stored.email,
    name: stored.name,
    role: stored.role,
  };
  const token = createSessionToken(authUser);

  return { user: authUser, token };
}

export async function getUserFromTokenValue(token: string): Promise<AuthUser | null> {
  const { getUserFromToken } = await import('./auth');
  return getUserFromToken(token);
}

// Seed demo users for testing
export function seedDemoUsers() {
  if (inMemoryUsers.size > 0) return;

  const demoUsers = [
    { email: 'tenant@demo.com', name: 'Demo Tenant', role: 'tenant' as Role, password: 'password123' },
    { email: 'alice@demo.com', name: 'Alice (Landlord)', role: 'landlord' as Role, password: 'password123' },
    { email: 'bob@demo.com', name: 'Bob (Landlord)', role: 'landlord' as Role, password: 'password123' },
    { email: 'carol@demo.com', name: 'Carol (Landlord)', role: 'landlord' as Role, password: 'password123' },
    { email: 'dave@demo.com', name: 'Dave (Landlord)', role: 'landlord' as Role, password: 'password123' },
    { email: 'eve@demo.com', name: 'Eve (Landlord)', role: 'landlord' as Role, password: 'password123' },
    { email: 'frank@demo.com', name: 'Frank (Landlord)', role: 'landlord' as Role, password: 'password123' },
    { email: 'grace@demo.com', name: 'Grace (Landlord)', role: 'landlord' as Role, password: 'password123' },
    { email: 'henry@demo.com', name: 'Henry (Landlord)', role: 'landlord' as Role, password: 'password123' },
    { email: 'irene@demo.com', name: 'Irene (Landlord)', role: 'landlord' as Role, password: 'password123' },
    { email: 'jack@demo.com', name: 'Jack (Landlord)', role: 'landlord' as Role, password: 'password123' },
    { email: 'moderator@demo.com', name: 'Demo Moderator', role: 'moderator' as Role, password: 'password123' },
  ];

  for (const demo of demoUsers) {
    const id = generateUserId();
    const passwordHash = hashPassword(demo.password);
    inMemoryUsers.set(id, {
      id,
      email: demo.email,
      name: demo.name,
      role: demo.role,
      passwordHash,
      createdAt: new Date().toISOString(),
    });
  }
}
