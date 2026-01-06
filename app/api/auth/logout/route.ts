import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const cookie = `auth=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
  const redirectUrl = new URL('/', req.url);
  return NextResponse.redirect(redirectUrl, { headers: { 'Set-Cookie': cookie } });
}
