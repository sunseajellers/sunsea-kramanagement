import { NextRequest, NextResponse } from 'next/server';
import { getUserTasks, getTaskStats } from '@/lib/taskService';

// GET /api/tasks - Get user tasks and stats
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

        // Ensure user can only access their own tasks
        if (authUserId && authUserId !== userId) {
            return NextResponse.json(
                { error: 'Unauthorized: Can only access your own tasks' },
                { status: 403 }
            );
        }

        const [tasks, stats] = await Promise.all([
            getUserTasks(userId),
            getTaskStats(userId)
        ]);

        return NextResponse.json({
            success: true,
            data: {
                tasks,
                stats
            }
        });
    } catch (error) {
        console.error('Failed to get tasks:', error);
        return NextResponse.json(
            { error: 'Failed to get tasks' },
            { status: 500 }
        );
    }
}