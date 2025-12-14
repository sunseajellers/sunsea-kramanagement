import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyReport, getUserWeeklyReports } from '@/lib/reportService';

// POST /api/reports/generate - Generate weekly report for a user
export async function POST(request: NextRequest) {
    try {
        const { userId, userName, weekStart, weekEnd } = await request.json();

        // Get user ID from middleware (authenticated requests)
        const authUserId = request.headers.get('x-user-id');

        if (!userId || !userName || !weekStart || !weekEnd) {
            return NextResponse.json(
                { error: 'Missing required parameters: userId, userName, weekStart, weekEnd' },
                { status: 400 }
            );
        }

        // Ensure user can only generate reports for themselves
        if (authUserId && authUserId !== userId) {
            return NextResponse.json(
                { error: 'Unauthorized: Can only generate reports for yourself' },
                { status: 403 }
            );
        }

        const report = await generateWeeklyReport(
            userId,
            userName,
            new Date(weekStart),
            new Date(weekEnd)
        );

        return NextResponse.json({
            success: true,
            report
        });
    } catch (error) {
        console.error('Failed to generate report:', error);
        return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
        );
    }
}

// GET /api/reports/user/[userId] - Get reports for a user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const limit = parseInt(searchParams.get('limit') || '10');

        // Get user ID from middleware (authenticated requests)
        const authUserId = request.headers.get('x-user-id');

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing userId parameter' },
                { status: 400 }
            );
        }

        // Ensure user can only access their own reports
        if (authUserId && authUserId !== userId) {
            return NextResponse.json(
                { error: 'Unauthorized: Can only access your own reports' },
                { status: 403 }
            );
        }

        const reports = await getUserWeeklyReports(userId, limit);

        return NextResponse.json({
            success: true,
            reports
        });
    } catch (error) {
        console.error('Failed to fetch reports:', error);
        return NextResponse.json(
            { error: 'Failed to fetch reports' },
            { status: 500 }
        );
    }
}