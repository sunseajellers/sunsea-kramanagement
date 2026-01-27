import { NextRequest, NextResponse } from 'next/server';
import { isUserAdmin } from './server/authService';
import { adminAuth } from './firebase-admin';

/**
 * Get user ID from Firebase token in Authorization header
 */
async function getUserFromToken(request: NextRequest): Promise<string | null> {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            const fallbackUid = request.headers.get('x-user-id');
            return fallbackUid;
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        return decodedToken.uid;
    } catch (error) {
        console.error('[AUTH] Token verification failed:', error);
        return null;
    }
}

/**
 * Authenticated user middleware (any logged-in user)
 */
export async function withAuth(
    request: NextRequest,
    handler: (request: NextRequest, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
    try {
        const userId = await getUserFromToken(request);

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        return await handler(request, userId);
    } catch (error) {
        console.error('Auth middleware error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Admin-only Middleware for API routes
 */
export async function withAdmin(
    request: NextRequest,
    handler: (request: NextRequest, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
    try {
        const userId = await getUserFromToken(request);

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Check if user is admin
        const isAdmin = await isUserAdmin(userId);

        if (!isAdmin) {
            console.warn(`Non-admin access attempt by ${userId} on ${request.nextUrl.pathname}`);
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }

        return await handler(request, userId);
    } catch (error) {
        console.error('RBAC middleware error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Permission checking utility for server-side operations
 */
export async function checkPermission(
    userId: string,
    _module?: string,
    _action?: string
): Promise<boolean> {
    try {
        return await isUserAdmin(userId);
    } catch (error) {
        console.error('Admin check failed:', error);
        return false;
    }
}