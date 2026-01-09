import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getDashboardStats, getTaskAnalytics, getKRAAnalytics } from '@/lib/analyticsService';
import { timestampToDate } from '@/lib/utils';
import { withRBAC } from '@/lib/rbacMiddleware';

// GET /api/dashboard - Get user dashboard data
export async function GET(request: NextRequest) {
    return withRBAC(request, 'dashboard', 'view', async (_request: NextRequest, userId: string) => {
        try {
            const [stats, tasks, kras, taskAnalytics, kraAnalytics] = await Promise.all([
                getDashboardStats(userId),
                (async () => {
                    const tasksSnap = await adminDb.collection('tasks').where('assignedTo', 'array-contains', userId).limit(5).get();
                    return tasksSnap.docs.map((doc) => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,
                            dueDate: timestampToDate(data.dueDate),
                            createdAt: timestampToDate(data.createdAt),
                            updatedAt: timestampToDate(data.updatedAt)
                        };
                    });
                })(),
                (async () => {
                    const krasSnap = await adminDb.collection('kras').where('assignedTo', 'array-contains', userId).limit(3).get();
                    return krasSnap.docs.map((doc) => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            ...data,
                            dueDate: timestampToDate(data.dueDate),
                            createdAt: timestampToDate(data.createdAt),
                            updatedAt: timestampToDate(data.updatedAt)
                        };
                    }).filter((kra: any) => kra.status === 'in_progress');
                })(),
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
    });
}