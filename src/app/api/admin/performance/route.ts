import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAdmin } from '@/lib/authMiddleware';
import { User, Task } from '@/types';

export async function GET(request: NextRequest) {
    return withAdmin(request, async () => {
        try {
            // Fetch all users
            const usersSnapshot = await adminDb.collection('users').get();
            const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));

            // Fetch all tasks for overdue/completion counts
            const tasksSnapshot = await adminDb.collection('tasks').get();
            const allTasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

            // Fetch latest scores
            const scoresSnapshot = await adminDb.collection('performanceScores')
                .orderBy('calculatedAt', 'desc')
                .get();
            const allScores = scoresSnapshot.docs.map(doc => doc.data());

            const personnelPerformance = users.map(user => {
                const userTasks = allTasks.filter(t => t.assignedTo.includes(user.id));
                const completedTasks = userTasks.filter(t => t.status === 'completed').length;
                const overdueTasks = userTasks.filter(t => {
                    const now = new Date();
                    const dueDate = t.dueDate ? (t.dueDate as any).toDate?.() || new Date(t.dueDate) : null;
                    return dueDate && dueDate < now && t.status !== 'completed';
                }).length;

                // Get latest score
                const latestScoreDoc = allScores.find(s => s.userId === user.id);
                const score = latestScoreDoc ? latestScoreDoc.score : 0;

                let status: 'Elite' | 'Master' | 'Professional' | 'Developing' = 'Developing';
                if (score >= 90) status = 'Elite';
                else if (score >= 75) status = 'Master';
                else if (score >= 50) status = 'Professional';

                return {
                    id: user.id,
                    name: user.fullName || user.email,
                    department: user.department || 'General',
                    score,
                    tasksCompleted: completedTasks,
                    tasksOverdue: overdueTasks,
                    status
                };
            });

            return NextResponse.json({
                success: true,
                data: personnelPerformance
            });
        } catch (error) {
            console.error('Failed to fetch personnel performance:', error);
            return NextResponse.json({ error: 'Failed to fetch performance data' }, { status: 500 });
        }
    });
}
