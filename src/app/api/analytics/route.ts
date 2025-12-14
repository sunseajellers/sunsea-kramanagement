import { NextRequest, NextResponse } from 'next/server';
import { getAdminDashboardAnalytics, getTeamDetailedAnalytics, generateAdminReport } from '@/lib/analyticsService';
import { userHasPermission } from '@/lib/rbacService';

// GET /api/analytics/admin - Get admin dashboard analytics (Admin only)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const teamId = searchParams.get('teamId');

        // Get user ID from middleware (authenticated requests)
        const userId = request.headers.get('x-user-id');

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Check if user has admin access
        const hasAccess = await userHasPermission(userId, 'admin', 'access');
        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Unauthorized: Admin access required' },
                { status: 403 }
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

// POST /api/analytics/reports - Generate admin reports (Admin only)
export async function POST(request: NextRequest) {
    try {
        const { reportType, dateRange } = await request.json();

        // Get user ID from middleware (authenticated requests)
        const userId = request.headers.get('x-user-id');

        if (!reportType) {
            return NextResponse.json(
                { error: 'Missing required parameter: reportType' },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Check if user has admin access
        const hasAccess = await userHasPermission(userId, 'admin', 'access');
        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Unauthorized: Admin access required' },
                { status: 403 }
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