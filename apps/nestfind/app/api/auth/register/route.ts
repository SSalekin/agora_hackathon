import { NextResponse } from 'next/server';
import type { RegisterRequest } from '@/lib/auth-types';
import { createUser, seedDemoUsers } from '@/lib/user-store';

export async function POST(request: Request) {
  try {
    seedDemoUsers();
    const body: RegisterRequest = await request.json();

    if (!body.email || !body.password || !body.name || !body.role) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 },
      );
    }

    if (!['tenant', 'landlord', 'moderator'].includes(body.role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 },
      );
    }

    if (body.password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 },
      );
    }

    const { user, token } = await createUser(body.email, body.password, body.name, body.role);

    const response = NextResponse.json({ success: true, user }, { status: 201 });
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ success: false, error: message }, { status: 409 });
  }
}
