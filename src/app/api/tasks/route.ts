import { NextRequest, NextResponse } from 'next/server';
import { withAdmin } from '@/lib/authMiddleware';
import { adminDb } from '@/lib/firebase-admin';
import { Task } from '@/types';

// Helper to convert Firestore Timestamp to Date
const timestampToDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp._seconds) return new Date(timestamp._seconds * 1000);
    return new Date(timestamp);
};

// GET /api/tasks - Get user tasks and stats
export async function GET(request: NextRequest) {
    return withAdmin(request, async (_request: NextRequest, userId: string) => {
        const tasksSnap = await adminDb.collection('tasks').where('assignedTo', 'array-contains', userId).get();
        const tasks = tasksSnap.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                dueDate: timestampToDate(data.dueDate),
                createdAt: timestampToDate(data.createdAt),
                updatedAt: timestampToDate(data.updatedAt)
            };
        }) as Task[];

        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const inProgress = tasks.filter(t => t.status === 'in_progress').length;
        const pending = tasks.filter(t => t.status === 'assigned').length;
        const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length;

        const stats = {
            total,
            completed,
            inProgress,
            pending,
            overdue
        };

        return NextResponse.json({
            tasks,
            stats
        });
    });
}