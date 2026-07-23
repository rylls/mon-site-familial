import { NextResponse } from 'next/server';
import { verifySessionToken } from './lib/session';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isPublic =
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/login') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/icons') ||
    // Images statiques non sensibles (van-banner, roues, schéma en coupe...).
    // next/image fait une requête interne serveur-à-serveur vers ce chemin
    // pour lire le fichier avant de l'optimiser, sans le cookie de session du
    // navigateur : sans cette exception, ce fetch interne se fait rediriger
    // vers /login et l'image casse.
    pathname.startsWith('/images');

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
