import type { NextRequest } from 'next/server';
 import { NextResponse } from 'next/server';
import { getSession, updateSession } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const { pathname } = request.nextUrl;

  // If user is logged in and tries to access the login page, redirect to dashboard
  if (session && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not logged in and tries to access a protected route, redirect to login
  // You might want to define which routes are protected more explicitly
  const protectedRoutes = ['/dashboard', '/orders', '/clients', '/users', '/settings']; // Add all your protected routes here
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Update session and continue
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};