import { NextResponse } from 'next/server';
import { createSessionToken, SESSION_MAX_AGE_SECONDS } from '../../../lib/session';

export async function POST(request) {
  const { password } = await request.json();

  if (password && password === process.env.SITE_PASSWORD) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set('wouchi_session', await createSessionToken(), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
    return res;
  }

  return NextResponse.json({ ok: false }, { status: 401 });
}
