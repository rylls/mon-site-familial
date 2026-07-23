import { NextResponse } from 'next/server';
import { verifySessionToken } from './lib/session';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/login') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/icons');

  if (isPublic) {
    return NextResponse.next();
  }

  const session = request.cookies.get('wouchi_session')?.value;

  if (!(await verifySessionToken(session))) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
