// src/app/api/performance/trends/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAdmin } from '@/lib/authMiddleware';
import { startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, format } from 'date-fns';

export async function GET(request: NextRequest) {
    return withAdmin(request, async (_req, _adminId) => {
        try {
            const { searchParams } = request.nextUrl;
            const targetUserId = searchParams.get('userId');

            const now = new Date();
            const sixMonthsAgo = subMonths(now, 5);

            let query = adminDb.collection('performanceScores')
                .where('calculatedAt', '>=', startOfMonth(sixMonthsAgo))
                .where('calculatedAt', '<=', endOfMonth(now));

            if (targetUserId) {
                query = query.where('userId', '==', targetUserId);
            }

            const snapshot = await query.get();
            const scores = snapshot.docs.map(doc => doc.data());

            // Group by month
            const months = eachMonthOfInterval({
                start: sixMonthsAgo,
                end: now
            });

            const trends = months.map(month => {
                const monthStr = format(month, 'MMM yyyy');
                const monthScores = scores.filter(s => {
                    const date = s.calculatedAt.toDate();
                    return format(date, 'MMM yyyy') === monthStr;
                });

                const avgScore = monthScores.length > 0
                    ? Math.round(monthScores.reduce((acc, curr) => acc + curr.score, 0) / monthScores.length)
                    : 0;

                return {
                    month: monthStr,
                    score: avgScore,
                    count: monthScores.length
                };
            });

            return NextResponse.json({ trends });
        } catch (error) {
            console.error('Error fetching performance trends:', error);
            return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
        }
    });
}
