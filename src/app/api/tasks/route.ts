import { NextRequest, NextResponse } from 'next/server';
import { getUserTasks, getTaskStats } from '@/lib/taskService';
import { withRBAC } from '@/lib/rbacMiddleware';

// GET /api/tasks - Get user tasks and stats
export async function GET(request: NextRequest) {
    return withRBAC(request, 'tasks', 'view', async (request, userId) => {
        const [tasks, stats] = await Promise.all([
            getUserTasks(userId),
            getTaskStats(userId)
        ]);

        return NextResponse.json({
            tasks,
            stats
        });
    });
}