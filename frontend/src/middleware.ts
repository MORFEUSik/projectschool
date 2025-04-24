// frontend/src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const token =
    request.cookies.get('token')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  const protectedPaths = ['/profile', '/courses', '/admin'];
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname.startsWith(path)
  );

  console.log('Middleware: Token found:', !!token); // Логируем токен

  if (isProtectedPath && !token) {
    console.log('Middleware: Redirecting to /login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*', '/courses/:path*', '/admin/:path*'],
};