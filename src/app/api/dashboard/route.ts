import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats, getTaskAnalytics, getKRAAnalytics } from '@/lib/analyticsService';
import { getUserTasks } from '@/lib/taskService';
import { getUserKRAs } from '@/lib/kraService';

// GET /api/dashboard - Get user dashboard data
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        // Get user ID from middleware (authenticated requests)
        const authUserId = request.headers.get('x-user-id');

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing required parameter: userId' },
                { status: 400 }
            );
        }

        // Ensure user can only access their own data
        if (authUserId && authUserId !== userId) {
            return NextResponse.json(
                { error: 'Unauthorized: Can only access your own dashboard data' },
                { status: 403 }
            );
        }

        const [stats, tasks, kras, taskAnalytics, kraAnalytics] = await Promise.all([
            getDashboardStats(userId),
            getUserTasks(userId),
            getUserKRAs(userId),
            getTaskAnalytics(userId),
            getKRAAnalytics(userId),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                stats,
                recentTasks: tasks.slice(0, 5),
                activeKRAs: kras.filter((kra: any) => kra.status === 'in_progress').slice(0, 3),
                taskAnalytics,
                kraAnalytics
            }
        });
    } catch (error) {
        console.error('Failed to get dashboard data:', error);
        return NextResponse.json(
            { error: 'Failed to get dashboard data' },
            { status: 500 }
        );
    }
}