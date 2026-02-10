import { NextRequest, NextResponse } from 'next/server';
import { getAdminDashboardAnalytics, getTeamDetailedAnalytics, generateAdminReport } from '@/lib/analyticsService';
import { withAdmin } from '@/lib/authMiddleware';

// GET /api/analytics - Get analytics data
export async function GET(request: NextRequest) {
    return withAdmin(request, async (_request: NextRequest, _userId: string) => {
        try {
            const { searchParams } = new URL(request.url);
            const type = searchParams.get('type');
            const teamId = searchParams.get('teamId');

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
    });
}

// POST /api/analytics/reports - Generate reports
export async function POST(request: NextRequest) {
    return withAdmin(request, async (_request: NextRequest, _userId: string) => {
        try {
            const { reportType } = await request.json();

            if (!reportType) {
                return NextResponse.json(
                    { error: 'Missing required parameter: reportType' },
                    { status: 400 }
                );
            }

            const report = await generateAdminReport(reportType);

            return NextResponse.json({
                success: true,
                data: report
            });
        } catch (error) {
            console.error('Failed to generate report:', error);
            return NextResponse.json(
                { error: 'Failed to generate report' },
                { status: 500 }
            );
        }
    });
}