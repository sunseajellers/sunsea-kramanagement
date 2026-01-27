// src/app/api/performance/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { calculateWeeklyPerformance } from '@/lib/server/scoringService';
import { startOfWeek, endOfWeek } from 'date-fns';
import { withAuth } from '@/lib/authMiddleware';

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    return withAuth(request, async (_req, authUserId) => {
        try {
            const { userId } = await params;

            // Security: Allow users to see only their own performance, or admin to see anyone's
            if (authUserId !== userId) {
                const { isUserAdmin } = await import('@/lib/server/authService');
                const isAdmin = await isUserAdmin(authUserId);
                if (!isAdmin) {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
                }
            }

            const now = new Date();
            const weekStart = startOfWeek(now, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

            const performance = await calculateWeeklyPerformance(userId, weekStart, weekEnd);

            return NextResponse.json({
                userId,
                weekStart,
                weekEnd,
                ...performance
            });
        } catch (error) {
            console.error('Error fetching performance:', error);
            return NextResponse.json({ error: 'Failed to fetch performance data' }, { status: 500 });
        }
    });
}
