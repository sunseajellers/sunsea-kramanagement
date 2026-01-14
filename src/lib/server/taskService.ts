// src/lib/server/taskService.ts
import { adminDb } from '../firebase-admin';
import { Task } from '@/types';
import { timestampToDate, handleError } from '../utils';

/**
 * Fetch tasks assigned to a specific user using Admin SDK.
 * This should only be used in server-side code (API routes, Server Actions).
 */
export async function getUserTasks(uid: string, maxResults: number = 50): Promise<Task[]> {
    try {
        const snap = await adminDb.collection('tasks')
            .where('assignedTo', 'array-contains', uid)
            .limit(maxResults)
            .get();

        return snap.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                dueDate: timestampToDate(data.dueDate),
                createdAt: timestampToDate(data.createdAt),
                updatedAt: timestampToDate(data.updatedAt)
            } as Task;
        });
    } catch (error) {
        handleError(error, 'Failed to fetch tasks via Admin SDK');
        throw error;
    }
}

/**
 * Fetch all tasks using Admin SDK.
 */
export async function getAllTasks(maxResults: number = 200): Promise<Task[]> {
    try {
        const snap = await adminDb.collection('tasks')
            .limit(maxResults)
            .get();

        return snap.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                dueDate: timestampToDate(data.dueDate),
                createdAt: timestampToDate(data.createdAt),
                updatedAt: timestampToDate(data.updatedAt)
            } as Task;
        });
    } catch (error) {
        handleError(error, 'Failed to fetch all tasks via Admin SDK');
        throw error;
    }
}

/**
 * Create a new task with atomic ID generation
 */
export async function createTask(taskData: Partial<Task>): Promise<string> {
    try {
        return await adminDb.runTransaction(async (transaction) => {
            // 1. Get the counter ref
            const counterRef = adminDb.collection('config').doc('counters');
            const counterDoc = await transaction.get(counterRef);

            // 2. Define current ID
            let currentId = 0;
            if (counterDoc.exists) {
                currentId = counterDoc.data()?.taskId || 0;
            } else {
                // Initialize if doesn't exist
                transaction.set(counterRef, { taskId: 0, kraId: 0 });
            }

            // 3. Increment
            const newId = currentId + 1;
            const paddedId = newId.toString().padStart(4, '0');
            const taskNumber = `T-${paddedId}`;

            // 4. Update counter
            transaction.update(counterRef, { taskId: newId });

            // 5. Create Task
            const newTaskRef = adminDb.collection('tasks').doc();
            const timestamp = new Date();

            transaction.set(newTaskRef, {
                ...taskData,
                taskNumber,
                createdAt: timestamp,
                updatedAt: timestamp,
                status: taskData.status || 'assigned',
                priority: taskData.priority || 'medium',
                revisionCount: 0
            });

            return newTaskRef.id;
        });
    } catch (error) {
        handleError(error, 'Failed to create task with atomic ID');
        throw error;
    }
}

/**
 * Update an existing task
 */
// Verify a task (Admin action)
export async function verifyTask(taskId: string, status: 'verified' | 'rejected', adminId: string, reason?: string) {
    try {
        const updateData: any = {
            verificationStatus: status,
            verifiedBy: adminId,
            verifiedAt: new Date(),
            updatedAt: new Date()
        };

        if (reason) {
            updateData.rejectionReason = reason;
        }

        await adminDb.collection('tasks').doc(taskId).update(updateData);
    } catch (error) {
        handleError(error, 'Error verifying task');
        throw error;
    }
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
        const taskRef = adminDb.collection('tasks').doc(taskId);

        // If employee is updating a REJECTED task, reset verification to pending
        // We need to check current status first if we aren't explicitly updating verificationStatus
        if (!updates.verificationStatus) {
            const currentDoc = await taskRef.get();
            const currentData = currentDoc.data() as Task;

            if (currentData?.verificationStatus === 'rejected') {
                updates.verificationStatus = 'pending';
                updates.rejectionReason = ''; // Clear reason
            }
        }

        await taskRef.update({
            ...updates,
            updatedAt: new Date()
        });
    } catch (error) {
        handleError(error, 'Failed to update task');
        throw error;
    }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
    try {
        await adminDb.collection('tasks').doc(taskId).delete();
    } catch (error) {
        handleError(error, 'Failed to delete task');
        throw error;
    }
}
