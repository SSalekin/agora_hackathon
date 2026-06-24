import { NextResponse } from 'next/server';
import type { LoginRequest } from '@/lib/auth-types';
import { authenticateUser, seedDemoUsers } from '@/lib/user-store';

export async function POST(request: Request) {
  try {
    seedDemoUsers();
    const body: LoginRequest = await request.json();

    if (!body.email || !body.password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 },
      );
    }

    const result = await authenticateUser(body.email, body.password);

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 },
      );
    }

    const { user, token } = result;

    const response = NextResponse.json({ success: true, user });
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
