import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const secretKey = process.env.JWT_SECRET;
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(key);
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    console.error('Failed to decrypt session:', error);
    return null;
  }
}

export async function createSession(userId: string, userRole: string) {
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  const session = await encrypt({ userId, userRole, expiresAt });
  return { session, expiresAt };
}

export async function deleteSession() {
  cookies().delete('session');
}

export async function getSession() {
  const session = cookies().get('session')?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  // Refresh the session expiry
  const parsed = await decrypt(session);

  if (!session || !parsed) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  const res = NextResponse.next();
  res.cookies.set('session', await encrypt({ userId: parsed.userId, userRole: parsed.userRole, expiresAt }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
  return res;

  // If no session or invalid session, redirect to login
  // This part is now handled by the `if (!session || !parsed)` block above
  // return NextResponse.redirect(new URL('/', request.url));
}