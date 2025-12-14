import { NextRequest, NextResponse } from 'next/server';
import { getScoringConfig, updateScoringConfig } from '@/lib/reportService';
import { userHasPermission } from '@/lib/rbacService';

// GET /api/scoring/config - Get current scoring configuration
export async function GET(request: NextRequest) {
    try {
        // Get user ID from middleware (authenticated requests)
        const userId = request.headers.get('x-user-id');

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Check if user has admin access to scoring
        const hasAccess = await userHasPermission(userId, 'admin', 'scoring');
        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Unauthorized: Admin access required' },
                { status: 403 }
            );
        }

        const config = await getScoringConfig();

        return NextResponse.json({
            success: true,
            config
        });
    } catch (error) {
        console.error('Failed to get scoring config:', error);
        return NextResponse.json(
            { error: 'Failed to get scoring configuration' },
            { status: 500 }
        );
    }
}

// PUT /api/scoring/config - Update scoring configuration (Admin only)
export async function PUT(request: NextRequest) {
    try {
        const { config } = await request.json();

        // Get user ID from middleware (authenticated requests)
        const userId = request.headers.get('x-user-id');

        if (!config) {
            return NextResponse.json(
                { error: 'Missing required parameter: config' },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Check if user has admin access to scoring
        const hasAccess = await userHasPermission(userId, 'admin', 'scoring');
        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Unauthorized: Admin access required' },
                { status: 403 }
            );
        }

        await updateScoringConfig(config, userId);

        return NextResponse.json({
            success: true,
            message: 'Scoring configuration updated successfully'
        });
    } catch (error) {
        console.error('Failed to update scoring config:', error);
        return NextResponse.json(
            { error: 'Failed to update scoring configuration' },
            { status: 500 }
        );
    }
}