import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const cookie = req.cookies.get('auth')?.value;
  const path = req.nextUrl.pathname;

  // Determine which role is required based on path
  let requiredRole: 'admin' | 'pimpinan' | 'pelaksana' | 'koordinator' | 'ppk' | null = null;
  
  if (path.startsWith('/admin')) {
    requiredRole = 'admin';
  } else if (path.startsWith('/pimpinan') || path.startsWith('/api/pimpinan')) {
    requiredRole = 'pimpinan';
  } else if (path.startsWith('/pelaksana') || path.startsWith('/api/pelaksana')) {
    requiredRole = 'pelaksana';
  } else if (path.startsWith('/koordinator') || path.startsWith('/api/koordinator')) {
    requiredRole = 'koordinator';
  } else if (path.startsWith('/ppk') || path.startsWith('/api/ppk')) {
    requiredRole = 'ppk';
  }

  if (!requiredRole) {
    return NextResponse.next();
  }

  if (!cookie) {
    // For API routes, return 401 JSON response
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized - Not authenticated' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/', req.url));
  }

  try {
    const payload = JSON.parse(decodeURIComponent(cookie));
    
    if (!payload || payload.role !== requiredRole) {
      // For API routes, return 403 JSON response
      if (path.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden - Access denied' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    return NextResponse.next();
  } catch (e) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/', req.url));
  }
}

export const config = {
  matcher: [
    '/admin/:path*', 
    '/pimpinan/:path*', 
    '/api/pimpinan/:path*', 
    '/koordinator/:path*',
    '/api/koordinator/:path*',
    '/ppk/:path*',
    '/api/ppk/:path*'
  ],
};
