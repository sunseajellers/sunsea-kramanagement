import { NextRequest, NextResponse } from 'next/server';
import { calculateUserScore } from '@/lib/reportService';

// POST /api/scoring/calculate - Calculate user score for a specific period
export async function POST(request: NextRequest) {
    try {
        const { userId, weekStart, weekEnd } = await request.json();

        // Get user ID from middleware (authenticated requests)
        const authUserId = request.headers.get('x-user-id');

        if (!userId || !weekStart || !weekEnd) {
            return NextResponse.json(
                { error: 'Missing required parameters: userId, weekStart, weekEnd' },
                { status: 400 }
            );
        }

        // Ensure user can only calculate their own scores
        if (authUserId && authUserId !== userId) {
            return NextResponse.json(
                { error: 'Unauthorized: Can only calculate your own scores' },
                { status: 403 }
            );
        }

        const score = await calculateUserScore(userId, new Date(weekStart), new Date(weekEnd));

        return NextResponse.json({
            success: true,
            score,
            userId,
            period: { start: weekStart, end: weekEnd }
        });
    } catch (error) {
        console.error('Failed to calculate score:', error);
        return NextResponse.json(
            { error: 'Failed to calculate score' },
            { status: 500 }
        );
    }
}