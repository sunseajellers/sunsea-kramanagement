import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { adminDb } from '@/lib/firebase-admin';

// Helper to convert Firestore Timestamp to Date
const timestampToDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp._seconds) return new Date(timestamp._seconds * 1000);
    return new Date(timestamp);
};

// GET /api/tasks/updates - Get task updates (activity log)
export async function GET(request: NextRequest) {
    return withAuth(request, async (_request: NextRequest, _userId: string) => {
        try {
            const { searchParams } = new URL(request.url);
            const requestedUserId = searchParams.get('userId');

            // Check if user is admin
            const userDoc = await adminDb.collection('users').doc(_userId).get();
            const isAdmin = userDoc.data()?.isAdmin === true;

            let query: FirebaseFirestore.Query = adminDb.collection('taskUpdates');

            // Security: If not admin, you can only see your own updates
            const finalUserId = isAdmin ? requestedUserId : _userId;

            if (finalUserId) {
                query = query.where('userId', '==', finalUserId);
            }

            query = query.orderBy('timestamp', 'desc').limit(100);

            const updatesSnap = await query.get();
            const updates = updatesSnap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: timestampToDate(doc.data().timestamp),
                revisionDate: timestampToDate(doc.data().revisionDate)
            }));

            return NextResponse.json({ updates });
        } catch (error) {
            console.error('Error fetching updates:', error);
            return NextResponse.json({ error: 'Failed to fetch updates', updates: [] }, { status: 500 });
        }
    });
}

// POST /api/tasks/updates - Create a new task update
export async function POST(request: NextRequest) {
    return withAuth(request, async (_request: NextRequest, userId: string) => {
        try {
            const body = await request.json();
            const { taskId, statusUpdate, remarks, revisionDate, isKRA: bodyIsKRA } = body;

            // 1. Determine if it's a KRA or a Task
            let isKRA = bodyIsKRA;
            let collectionName = isKRA ? 'kras' : 'tasks';
            let taskDoc = await adminDb.collection(collectionName).doc(taskId).get();

            // Fallback if isKRA wasn't provided or was wrong (common in migrations)
            if (!taskDoc.exists) {
                isKRA = !isKRA;
                collectionName = isKRA ? 'kras' : 'tasks';
                taskDoc = await adminDb.collection(collectionName).doc(taskId).get();
            }

            if (!taskDoc.exists) {
                return NextResponse.json({ error: 'Task or KRA not found' }, { status: 404 });
            }

            const taskData = taskDoc.data();
            const taskTitle = taskData?.title || 'Unknown';

            // 2. Update the status and target date (if revision) on the original document
            const updates: any = {
                status: statusUpdate,
                updatedAt: new Date()
            };

            if (revisionDate) {
                updates.finalTargetDate = new Date(revisionDate);
                // Increment revision count if it's a task
                if (!isKRA) {
                    updates.revisionCount = (taskData?.revisionCount || 0) + 1;
                }
            }

            await adminDb.collection(collectionName).doc(taskId).update(updates);

            // 3. Get user name for the log
            const userDoc = await adminDb.collection('users').doc(userId).get();
            const userName = userDoc.exists ? userDoc.data()?.fullName || 'Unknown User' : 'Unknown User';

            // 4. Create the update log entry (TaskUpdateEntry)
            const updateEntry = {
                taskId,
                taskTitle,
                userId,
                userName,
                statusUpdate,
                remarks: remarks || null,
                revisionDate: revisionDate ? new Date(revisionDate) : null,
                isKRA,
                timestamp: new Date()
            };

            const docRef = await adminDb.collection('taskUpdates').add(updateEntry);

            return NextResponse.json({
                success: true,
                id: docRef.id,
                isKRA
            });
        } catch (error: any) {
            console.error('Error creating update:', error);
            return NextResponse.json({ error: 'Failed to create update: ' + error.message }, { status: 500 });
        }
    });
}
