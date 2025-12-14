import { NextRequest, NextResponse } from 'next/server';
import { getAdminDashboardAnalytics, getTeamDetailedAnalytics, generateAdminReport } from '@/lib/analyticsService';

// GET /api/analytics - Get analytics data
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const teamId = searchParams.get('teamId');
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing required parameter: userId' },
                { status: 400 }
            );
        }

        let analytics;
        if (type === 'team' && teamId) {
            analytics = await getTeamDetailedAnalytics(teamId);
        } else {
            analytics = await getAdminDashboardAnalytics();
        }

        return NextResponse.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Failed to get analytics:', error);
        return NextResponse.json(
            { error: 'Failed to get analytics' },
            { status: 500 }
        );
    }
}

// POST /api/analytics/reports - Generate reports
export async function POST(request: NextRequest) {
    try {
        const { reportType, dateRange, userId } = await request.json();

        if (!reportType || !userId) {
            return NextResponse.json(
                { error: 'Missing required parameters: reportType, userId' },
                { status: 400 }
            );
        }

        const report = await generateAdminReport(reportType, dateRange);

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