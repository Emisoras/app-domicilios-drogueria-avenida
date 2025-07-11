import { loginUser } from '@/actions/user-actions';
import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { cedula, password } = await request.json();
    const result = await loginUser({ cedula, password });

    if (result.success) {
      const { session, expiresAt } = await createSession(result.user.id, result.user.role);
      const response = NextResponse.json({ success: true, user: result.user });
      response.cookies.set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: expiresAt,
        sameSite: 'lax',
        path: '/',
      });
      return response;
    } else {
      return NextResponse.json({ success: false, message: result.message }, { status: 401 });
    }
  } catch (error) {
    console.error('API Login error:', error);
    return NextResponse.json({ success: false, message: 'Error interno del servidor.' }, { status: 500 });
  }
}