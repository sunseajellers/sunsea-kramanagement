// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/dashboard/admin',
  '/dashboard/admin/analytics',
  '/dashboard/admin/notifications',
  '/dashboard/admin/reports',
  '/dashboard/admin/roles',
  '/dashboard/admin/scoring',
  '/dashboard/admin/system',
  '/dashboard/admin/teams',
  '/dashboard/admin/users',
  '/dashboard/kras',
  '/dashboard/profile',
  '/dashboard/reports',
  '/dashboard/settings',
  '/dashboard/tasks',
  '/dashboard/team',
  '/dashboard/weekly-reports'
]

// Routes that are public (no auth required)
const publicRoutes = [
  '/',
  '/signup'
]

// API routes that require authentication
const protectedApiRoutes = [
  '/api/dashboard',
  '/api/tasks',
  '/api/kras',
  '/api/reports',
  '/api/team',
  '/api/scoring',
  '/api/analytics'
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Check if it's an API route that requires authentication
  const isProtectedApiRoute = protectedApiRoutes.some(route =>
    pathname.startsWith(route)
  )

  // Check if it's a page route that requires authentication
  const requiresAuth = protectedRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )

  if (!requiresAuth && !isProtectedApiRoute) {
    return NextResponse.next()
  }

  // Extract the authorization token from the request
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '') ||
                request.cookies.get('session')?.value

  if (!token) {
    // For API routes, return 401
    if (isProtectedApiRoute) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    // For page routes, redirect to login
    return NextResponse.redirect(new URL('/', request.url))
  }

  try {
    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(token)

    // Add user information to the request headers for use in API routes
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', decodedToken.uid)
    requestHeaders.set('x-user-email', decodedToken.email || '')
    requestHeaders.set('x-user-name', decodedToken.name || '')

    // Continue with the request, passing the user info
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('Token verification failed:', error)

    // For API routes, return 401
    if (isProtectedApiRoute) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    }
    // For page routes, redirect to login
    return NextResponse.redirect(new URL('/', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     * CRITICAL: This now INCLUDES API routes for security
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}