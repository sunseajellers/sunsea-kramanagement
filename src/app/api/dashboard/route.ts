import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats, getTaskAnalytics, getKRAAnalytics } from '@/lib/analyticsService';
import { getUserTasks } from '@/lib/taskService';
import { getUserKRAs } from '@/lib/kraService';

// GET /api/dashboard - Get user dashboard data
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing required parameter: userId' },
                { status: 400 }
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
    } catch (error: any) {
        console.error('Dashboard API Error:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        return NextResponse.json(
            { error: error.message || 'Failed to get dashboard data' },
            { status: 500 }
        );
    }
}