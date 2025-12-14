import { NextRequest, NextResponse } from 'next/server';
import { generateWeeklyReport, getUserWeeklyReports } from '@/lib/reportService';

// POST /api/reports - Generate weekly report for a user
export async function POST(request: NextRequest) {
    try {
        const { userId, userName, weekStart, weekEnd } = await request.json();

        if (!userId || !userName || !weekStart || !weekEnd) {
            return NextResponse.json(
                { error: 'Missing required parameters: userId, userName, weekStart, weekEnd' },
                { status: 400 }
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

// GET /api/reports - Get reports for a user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const limit = parseInt(searchParams.get('limit') || '10');

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing userId parameter' },
                { status: 400 }
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