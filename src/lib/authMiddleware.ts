import { NextRequest, NextResponse } from 'next/server';
import { isUserAdmin } from './server/authService';

/**
 * Admin-only Middleware for API routes
 */
export async function withAdmin(
    request: NextRequest,
    handler: (request: NextRequest, userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
    try {
        // Get user ID from middleware (authenticated requests)
        const userId = request.headers.get('x-user-id');

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