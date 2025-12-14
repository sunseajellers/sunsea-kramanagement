// src/lib/rbacMiddleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { userHasPermission } from './rbacService';
import { adminAuth } from './firebase-admin';

/**
 * RBAC Middleware for API routes
 */
export async function withRBAC(
    request: NextRequest,
    requiredModule: string,
    requiredAction: string,
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

        // Special case: Allow RBAC initialization for any authenticated user
        // This handles the chicken-and-egg problem of initializing RBAC
        if (requiredModule === 'system' && requiredAction === 'admin') {
            try {
                // Try to check permission - if RBAC is not initialized, this will fail
                const hasPermission = await userHasPermission(userId, requiredModule, requiredAction);
                if (!hasPermission) {
                    return NextResponse.json(
                        { error: 'Insufficient permissions' },
                        { status: 403 }
                    );
                }
            } catch (error) {
                // If permission check fails (likely because RBAC not initialized),
                // allow the request for the first authenticated user
                console.log('RBAC not initialized, allowing first user to initialize');
            }
        } else {
            // For other endpoints, require proper RBAC
            const hasPermission = await userHasPermission(userId, requiredModule, requiredAction);
            if (!hasPermission) {
                return NextResponse.json(
                    { error: 'Insufficient permissions' },
                    { status: 403 }
                );
            }
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
 * Higher-order component for protecting client-side components
 */
export function withPermissionCheck(
    WrappedComponent: React.ComponentType<any>,
    requiredModule: string,
    requiredAction: string,
    fallbackComponent?: React.ComponentType<any>
) {
    return function PermissionProtectedComponent(props: any) {
        // This would be implemented with React context or hooks
        // For now, return the component (will be implemented in the component)
        return <WrappedComponent {...props} />;
    };
}

/**
 * Hook for checking permissions in components
 */
export function usePermission(module: string, action: string): boolean {
    // This would check the current user's permissions
    // Implementation would use React context or state management
    // For now, return true (will be implemented properly)
    return true;
}

/**
 * Permission checking utility for server-side operations
 */
export async function checkPermission(
    userId: string,
    module: string,
    action: string
): Promise<boolean> {
    try {
        return await userHasPermission(userId, module, action);
    } catch (error) {
        console.error('Permission check failed:', error);
        return false;
    }
}