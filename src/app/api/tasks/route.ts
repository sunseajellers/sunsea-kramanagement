import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { adminDb } from '@/lib/firebase-admin';
import { hasPermissionServer } from '@/lib/server/authService';


// Helper to convert Firestore Timestamp to Date
const timestampToDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp._seconds) return new Date(timestamp._seconds * 1000);
    return new Date(timestamp);
};

// GET /api/tasks - Get tasks and stats
export async function GET(request: NextRequest) {
    return withAuth(request, async (_request: NextRequest, userId: string) => {
        const { searchParams } = new URL(request.url);
        const filterUserId = searchParams.get('userId');
        const assignedByUserId = searchParams.get('assignedBy');
        const showAll = searchParams.get('all') === 'true';

        // Use hasPermissionServer for granular checks
        const canViewAll = await hasPermissionServer(userId, 'tasks', 'view_all');
        const canViewOwn = await hasPermissionServer(userId, 'tasks', 'view');

        if (!canViewOwn && !canViewAll) {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        let querySnapshot: any;
        const tasksRef = adminDb.collection('tasks');

        if (assignedByUserId) {
            // Fetch tasks that this user has assigned to others
            querySnapshot = await tasksRef.where('assignedBy', '==', assignedByUserId).get();
        } else if (canViewAll && showAll) {
            // Fetch all tasks for users with view_all permission
            querySnapshot = await tasksRef.get();
        } else if (canViewAll && filterUserId) {
            // Fetch for specific user for authorized users
            querySnapshot = await tasksRef.where('assignedTo', 'array-contains', filterUserId).get();
        } else {
            // Default: Fetch for current user
            querySnapshot = await tasksRef.where('assignedTo', 'array-contains', userId).get();
        }
        const tasks = querySnapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                dueDate: timestampToDate(data.dueDate),
                finalTargetDate: timestampToDate(data.finalTargetDate),
                createdAt: timestampToDate(data.createdAt),
                updatedAt: timestampToDate(data.updatedAt)
            };
        }) as any[];

        // Fetch assigner names for metadata
        const assignerIds = Array.from(new Set(tasks.map(t => t.assignedBy).filter(Boolean)));
        const assignersMap: Record<string, string> = {};

        if (assignerIds.length > 0) {
            // Firestore 'in' query supports up to 30 elements in newer SDKs, but let's stick to safe chunks
            const chunks = [];
            for (let i = 0; i < assignerIds.length; i += 10) {
                chunks.push(assignerIds.slice(i, i + 10));
            }

            for (const chunk of chunks) {
                const assignersSnap = await adminDb.collection('users')
                    .where('__name__', 'in', chunk)
                    .get();
                assignersSnap.docs.forEach(doc => {
                    const d = doc.data();
                    assignersMap[doc.id] = d.fullName || d.displayName || d.email || 'Admin';
                });
            }
        }

        const tasksWithMeta = tasks.map(t => ({
            ...t,
            assignedByName: assignersMap[t.assignedBy] || 'Admin'
        }));

        // Stats reflect the returned tasks
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
            success: true,
            tasks: tasksWithMeta,
            stats
        });
    }).catch(error => {
        console.error('Error in GET /api/tasks:', error);
        return NextResponse.json({
            success: false,
            tasks: [],
            stats: { total: 0, completed: 0, inProgress: 0, pending: 0, overdue: 0 }
        });
    });
}