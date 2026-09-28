import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve auth token from cookies
  const token = request.cookies.get('token')?.value;
  const hasValidToken = Boolean(token && token.length > 20);

  const isProtected = pathname.startsWith('/dashboard') || pathname.startsWith('/health');

  // If attempting to access protected sub-routes without valid token, redirect to /login
  if (isProtected && !hasValidToken) {
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/health/:path*'],
};
