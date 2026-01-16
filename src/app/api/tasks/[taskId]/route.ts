import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { adminDb } from '@/lib/firebase-admin';
import { logTaskStatusUpdate, logTaskCompleted, logTaskDeleted } from '@/lib/activityLogger';

// Helper to convert Firestore Timestamp to Date
const timestampToDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp._seconds) return new Date(timestamp._seconds * 1000);
    return new Date(timestamp);
};

// GET /api/tasks/[taskId] - Get single task
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    return withAuth(request, async (_request: NextRequest, _userId: string) => {
        try {
            const { taskId } = await params;
            const taskDoc = await adminDb.collection('tasks').doc(taskId).get();

            if (!taskDoc.exists) {
                return NextResponse.json(
                    { success: false, error: 'Task not found' },
                    { status: 404 }
                );
            }

            const data = taskDoc.data();
            const task = {
                id: taskDoc.id,
                ...data,
                dueDate: timestampToDate(data?.dueDate),
                finalTargetDate: timestampToDate(data?.finalTargetDate),
                createdAt: timestampToDate(data?.createdAt),
                updatedAt: timestampToDate(data?.updatedAt)
            };

            return NextResponse.json({
                success: true,
                task
            });
        } catch (error) {
            console.error('Error fetching task:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch task' },
                { status: 500 }
            );
        }
    });
}

// PATCH /api/tasks/[taskId] - Update task
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    return withAuth(request, async (_request: NextRequest, userId: string) => {
        try {
            const { taskId } = await params;
            const updates = await request.json();
            const taskRef = adminDb.collection('tasks').doc(taskId);
            const taskDoc = await taskRef.get();

            if (!taskDoc.exists) {
                return NextResponse.json(
                    { success: false, error: 'Task not found' },
                    { status: 404 }
                );
            }

            const taskData = taskDoc.data();

            // Check if user has permission to update this task
            const userDoc = await adminDb.collection('users').doc(userId).get();
            const isAdmin = userDoc.data()?.isAdmin === true;
            const isAssignedUser = taskData?.assignedTo?.includes(userId);
            const isCreator = taskData?.assignedBy === userId;

            if (!isAdmin && !isAssignedUser && !isCreator) {
                return NextResponse.json(
                    { success: false, error: 'Permission denied' },
                    { status: 403 }
                );
            }

            // Prepare update data
            const updateData: any = {
                ...updates,
                updatedAt: new Date()
            };

            // Convert date strings to proper dates if they exist
            if (updates.dueDate && typeof updates.dueDate === 'string') {
                updateData.dueDate = new Date(updates.dueDate);
            }
            if (updates.finalTargetDate && typeof updates.finalTargetDate === 'string') {
                updateData.finalTargetDate = new Date(updates.finalTargetDate);
            }

            await taskRef.update(updateData);

            // Log the activity
            if (updates.status && taskData?.status !== updates.status) {
                await logTaskStatusUpdate(
                    taskId,
                    taskData?.title || 'Unknown Task',
                    taskData?.status || 'unknown',
                    updates.status
                );
            }

            if (updates.status === 'completed' && taskData?.status !== 'completed') {
                await logTaskCompleted(taskId, taskData?.title || 'Unknown Task');
            }

            // Log the update in audit logs
            try {
                await adminDb.collection('auditLogs').add({
                    action: 'task_update',
                    taskId: taskId,
                    userId: userId,
                    changes: updates,
                    timestamp: new Date()
                });
            } catch (auditError) {
                console.error('Failed to log audit:', auditError);
                // Don't fail the update if audit logging fails
            }

            return NextResponse.json({
                success: true,
                message: 'Task updated successfully'
            });
        } catch (error) {
            console.error('Error updating task:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to update task' },
                { status: 500 }
            );
        }
    });
}

// DELETE /api/tasks/[taskId] - Delete task
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ taskId: string }> }
) {
    return withAuth(request, async (_request: NextRequest, userId: string) => {
        try {
            const { taskId } = await params;
            const taskRef = adminDb.collection('tasks').doc(taskId);
            const taskDoc = await taskRef.get();

            if (!taskDoc.exists) {
                return NextResponse.json(
                    { success: false, error: 'Task not found' },
                    { status: 404 }
                );
            }

            const taskData = taskDoc.data();

            // Check if user has permission to delete this task
            const userDoc = await adminDb.collection('users').doc(userId).get();
            const isAdmin = userDoc.data()?.isAdmin === true;
            const isCreator = taskData?.assignedBy === userId;

            if (!isAdmin && !isCreator) {
                return NextResponse.json(
                    { success: false, error: 'Permission denied. Only admins or task creators can delete tasks.' },
                    { status: 403 }
                );
            }

            await taskRef.delete();

            // Log the deletion
            await logTaskDeleted(taskId, taskData?.title || 'Unknown Task');

            // Log the deletion in audit logs
            try {
                await adminDb.collection('auditLogs').add({
                    action: 'task_delete',
                    taskId: taskId,
                    userId: userId,
                    taskData: taskData,
                    timestamp: new Date()
                });
            } catch (auditError) {
                console.error('Failed to log audit:', auditError);
            }

            return NextResponse.json({
                success: true,
                message: 'Task deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting task:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to delete task' },
                { status: 500 }
            );
        }
    });
}
