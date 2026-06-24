import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import type { AuthUser, Role } from './auth-types';

const JWT_SECRET = process.env.JWT_SECRET || 'nestfind-dev-secret-change-in-production';

function base64url(data: Buffer | string): string {
  const buf = typeof data === 'string' ? Buffer.from(data) : data;
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecode(str: string): Buffer {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padding), 'base64');
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(salt + password).digest('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const hashToVerify = createHash('sha256').update(salt + password).digest('hex');
  return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hashToVerify, 'hex'));
}

export function signJwt(payload: Record<string, unknown>): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64url(JSON.stringify({ ...payload, iat: now, exp: now + 7 * 24 * 60 * 60 }));
  const signature = createHash('sha256').update(`${header}.${body}`).update(JWT_SECRET).digest();
  return `${header}.${body}.${base64url(signature)}`;
}

export function verifyJwt(token: string): Record<string, unknown> | null {
  try {
    const [header, body, sig] = token.split('.');
    if (!header || !body || !sig) return null;

    const expectedSig = createHash('sha256').update(`${header}.${body}`).update(JWT_SECRET).digest();
    const providedSig = base64urlDecode(sig);

    if (expectedSig.length !== providedSig.length || !timingSafeEqual(expectedSig, providedSig)) {
      return null;
    }

    const payload = JSON.parse(base64urlDecode(body).toString('utf-8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function createSessionToken(user: AuthUser): string {
  return signJwt({ sub: user.id, email: user.email, name: user.name, role: user.role });
}

export function getUserFromToken(token: string): AuthUser | null {
  const payload = verifyJwt(token);
  if (!payload || typeof payload.sub !== 'string') return null;
  return {
    id: payload.sub,
    email: payload.email as string,
    name: payload.name as string,
    role: payload.role as Role,
  };
}

export function generateUserId(): string {
  return randomBytes(16).toString('hex');
}
