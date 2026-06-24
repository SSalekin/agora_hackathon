import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserFromToken } from '@/lib/auth';
import { findUserById, seedDemoUsers } from '@/lib/user-store';

export async function GET() {
  try {
    seedDemoUsers();
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const tokenUser = getUserFromToken(token);
    if (!tokenUser) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const storedUser = await findUserById(tokenUser.id);
    if (!storedUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: storedUser.id,
        email: storedUser.email,
        name: storedUser.name,
        role: storedUser.role,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to get user' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
