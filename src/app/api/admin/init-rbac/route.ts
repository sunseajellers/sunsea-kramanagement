import { NextRequest, NextResponse } from 'next/server';
import { initializeDefaultRBAC } from '@/lib/rbacService';
import { withRBAC } from '@/lib/rbacMiddleware';

export async function POST(request: NextRequest) {
    return withRBAC(request, 'system', 'admin', async () => {
        try {
            await initializeDefaultRBAC();
            return NextResponse.json({
                success: true,
                message: 'RBAC system initialized successfully'
            });
        } catch (error) {
            console.error('Failed to initialize RBAC:', error);
            return NextResponse.json(
                { error: 'Failed to initialize RBAC system' },
                { status: 500 }
            );
        }
    });
}