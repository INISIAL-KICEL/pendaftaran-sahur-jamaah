import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/super-admin');

  // Verify JWT token for protected routes
  let payload: any = null;
  if (token) {
    try {
      const verified = await jwtVerify(token, secretKey);
      payload = verified.payload;
    } catch (err) {
      console.log('JWT Verification Failed');
    }
  }

  // Redirect to login if unauthenticated
  if (isProtectedRoute && !payload) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if logged in user tries to visit login
  if (request.nextUrl.pathname.startsWith('/login') && payload) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // RBAC for super-admin route
  if (request.nextUrl.pathname.startsWith('/super-admin')) {
    if (payload?.role !== 'super_admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
