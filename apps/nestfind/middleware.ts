import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register', '/offline'];
const API_PATHS = '/api/';
const STATIC_PATHS = ['/_next/', '/favicon.ico', '/nestfind-mark.svg', '/site.webmanifest'];

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'),
    );
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith(API_PATHS)) {
    return NextResponse.next();
  }

  if (STATIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth-token')?.value;
  const isProtectedRoute =
    pathname.startsWith('/tenant/') ||
    pathname.startsWith('/landlord/') ||
    pathname.startsWith('/moderator/');

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = decodeJwtPayload(token);
    if (!payload || typeof payload.role !== 'string') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const role = payload.role;
    const isMatchingDashboard =
      (role === 'tenant' && pathname.startsWith('/tenant/')) ||
      (role === 'landlord' && pathname.startsWith('/landlord/')) ||
      (role === 'moderator' && pathname.startsWith('/moderator/'));

    if (!isMatchingDashboard) {
      const redirects: Record<string, string> = {
        tenant: '/tenant/dashboard',
        landlord: '/landlord/dashboard',
        moderator: '/moderator/dashboard',
      };
      return NextResponse.redirect(new URL(redirects[role] || '/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|nestfind-mark.svg|site.webmanifest).*)'],
};
