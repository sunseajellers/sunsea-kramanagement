import { NextRequest, NextResponse } from 'next/server';
import { getScoringConfig, updateScoringConfig } from '@/lib/reportService';
import { withAdmin } from '@/lib/authMiddleware';

// GET /api/scoring/config - Get current scoring configuration
export async function GET(request: NextRequest) {
    return withAdmin(request, async (_request: NextRequest, _userId: string) => {
        try {
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
    });
}

// PUT /api/scoring/config - Update scoring configuration
export async function PUT(request: NextRequest) {
    return withAdmin(request, async (_request: NextRequest, userId: string) => {
        try {
            const { config } = await request.json();

            if (!config) {
                return NextResponse.json(
                    { error: 'Missing required parameter: config' },
                    { status: 400 }
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
    });
}