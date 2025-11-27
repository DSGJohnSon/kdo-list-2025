import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the request is for the backoffice
  if (request.nextUrl.pathname.startsWith('/backoffice')) {
    // Check if user is authenticated
    const isAuthenticated = request.cookies.get('backoffice-auth')?.value === 'true';
    
    // If not authenticated and not on login page, redirect to login
    if (!isAuthenticated && request.nextUrl.pathname !== '/backoffice/login') {
      return NextResponse.redirect(new URL('/backoffice/login', request.url));
    }
    
    // If authenticated and on login page, redirect to dashboard
    if (isAuthenticated && request.nextUrl.pathname === '/backoffice/login') {
      return NextResponse.redirect(new URL('/backoffice', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/backoffice/:path*',
};