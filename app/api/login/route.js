import { NextResponse } from 'next/server';

export async function POST(request) {
  const { password } = await request.json();

  if (password && password === process.env.SITE_PASSWORD) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set('wouchi_session', password, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  }

  return NextResponse.json({ ok: false }, { status: 401 });
}
