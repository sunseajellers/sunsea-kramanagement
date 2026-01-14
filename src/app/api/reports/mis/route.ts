import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { adminDb } from '@/lib/firebase-admin';
import { ScoringService } from '@/lib/server/scoringService';
import { getAllUsers } from '@/lib/server/userService';
import { getScoringConfig } from '@/lib/reportService';
import { startOfWeek, endOfWeek, parseISO } from 'date-fns';

export async function GET(request: NextRequest) {
    return withAuth(request, async (_request: NextRequest, adminId: string) => {
        try {
            // 1. Authorization: Only admins can access MIS reports
            const adminDoc = await adminDb.collection('users').doc(adminId).get();
            if (adminDoc.data()?.isAdmin !== true) {
                return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
            }

            // 2. Determine target week
            const { searchParams } = new URL(request.url);
            const dateParam = searchParams.get('date');
            const targetDate = dateParam ? parseISO(dateParam) : new Date();

            const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // Monday
            const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 });

            // 3. Fetch all active users
            const users = await getAllUsers();
            const config = await getScoringConfig();

            // 4. Generate report for each user
            const misData = await Promise.all(users.map(async (user) => {
                const report = await ScoringService.generateWeeklyReport(
                    user.id,
                    weekStart,
                    weekEnd,
                    config
                );

                return {
                    userId: user.id,
                    userName: user.fullName || user.email,
                    role: (user.roleIds && user.roleIds.length > 0) ? user.roleIds[0] : 'Employee',
                    tasksAssigned: report.tasksAssigned,
                    tasksCompleted: report.tasksCompleted,
                    workNotDoneRate: report.workNotDoneRate || 0,
                    delayRate: report.delayRate || 0,
                    score: report.score,
                    savings: 0 // Placeholder for Target Save logic if needed later
                };
            }));

            return NextResponse.json({
                weekStart,
                weekEnd,
                misData
            });
        } catch (error: any) {
            console.error('Error generating MIS report:', error);
            return NextResponse.json({ error: 'Failed to generate MIS report: ' + error.message }, { status: 500 });
        }
    });
}
