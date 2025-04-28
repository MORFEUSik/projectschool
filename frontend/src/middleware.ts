import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/shared/lib/logger';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  log('Middleware: Token found:', !!token);

  // Разрешаем доступ к /, /login и /register без токена
  if (
    !token &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/register') &&
    request.nextUrl.pathname !== '/'
  ) {
    log('Middleware: Redirecting to /login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};