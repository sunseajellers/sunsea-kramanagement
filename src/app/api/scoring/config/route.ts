import { NextRequest, NextResponse } from 'next/server';
import { getScoringConfig, updateScoringConfig } from '@/lib/reportService';

// GET /api/scoring/config - Get current scoring configuration
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing userId parameter' },
                { status: 400 }
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

// PUT /api/scoring/config - Update scoring configuration
export async function PUT(request: NextRequest) {
    try {
        const { config, userId } = await request.json();

        if (!config || !userId) {
            return NextResponse.json(
                { error: 'Missing required parameters: config, userId' },
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
}