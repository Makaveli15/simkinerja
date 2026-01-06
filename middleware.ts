import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const cookie = req.cookies.get('auth')?.value;
  if (!cookie) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  try {
    const payload = JSON.parse(decodeURIComponent(cookie));
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  } catch (e) {
    return NextResponse.redirect(new URL('/', req.url));
  }
}

export const config = {
  matcher: ['/admin/:path*'],
};
