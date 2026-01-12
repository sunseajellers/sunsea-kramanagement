// src/lib/revisionService.ts
import { collection, query, where, getDocs, addDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { TaskRevision } from '@/types';
import { timestampToDate, handleError } from './utils';
import { updateTask } from './taskService';
import { createNotification } from './notificationService';

/**
 * Request a revision for a task
 * @param taskId - The ID of the task
 * @param requestedBy - User ID of the person requesting revision (manager/admin)
 * @param requestedByName - Name of the person requesting revision
 * @param reason - Reason for requesting revision
 * @returns The ID of the created revision request
 */
export async function requestTaskRevision(
    taskId: string,
    requestedBy: string,
    requestedByName: string,
    reason: string
): Promise<string> {
    try {
        // Create revision request
        const revisionData: Omit<TaskRevision, 'id'> = {
            taskId,
            requestedBy,
            requestedByName,
            requestedAt: new Date(),
            reason,
            status: 'pending'
        };

        const docRef = await addDoc(collection(db, 'taskRevisions'), revisionData);

        // Update task status and revision info
        await updateTask(taskId, {
            status: 'revision_requested',
            lastRevisionId: docRef.id,
            revisionCount: (await getTaskRevisionCount(taskId)) + 1,
            updatedAt: new Date()
        });

        // Get task details to notify assignees
        const taskDoc = await getDocs(query(collection(db, 'tasks'), where('__name__', '==', taskId)));
        if (!taskDoc.empty) {
            const task = taskDoc.docs[0].data();

            // Notify all assignees
            for (const assigneeId of task.assignedTo || []) {
                await createNotification({
                    userId: assigneeId,
                    type: 'task_updated',
                    title: 'Revision Requested',
                    message: `${requestedByName} requested a revision for task: ${task.title}`,
                    link: `/dashboard/tasks/${taskId}`,
                    read: false,
                    createdAt: new Date()
                });
            }
        }

        return docRef.id;
    } catch (error) {
        handleError(error, 'Failed to request task revision');
        throw error;
    }
}

/**
 * Resolve a revision request (employee marks as fixed)
 * @param revisionId - The ID of the revision request
 * @param resolvedBy - User ID of the person resolving
 * @param resolvedByName - Name of the person resolving
 * @param resolutionNotes - Notes on what was fixed
 */
export async function resolveTaskRevision(
    revisionId: string,
    resolvedBy: string,
    resolvedByName: string,
    resolutionNotes?: string
): Promise<void> {
    try {
        const revisionRef = doc(db, 'taskRevisions', revisionId);

        // Update revision status
        await updateDoc(revisionRef, {
            status: 'resolved',
            resolvedBy,
            resolvedByName,
            resolvedAt: new Date(),
            resolutionNotes: resolutionNotes || ''
        });

        // Get revision details to update task
        const revisionDoc = await getDocs(query(collection(db, 'taskRevisions'), where('__name__', '==', revisionId)));
        if (!revisionDoc.empty) {
            const revision = revisionDoc.docs[0].data();

            // Update task status back to pending review
            await updateTask(revision.taskId, {
                status: 'pending_review',
                updatedAt: new Date()
            });

            // Notify the person who requested the revision
            await createNotification({
                userId: revision.requestedBy,
                type: 'task_updated',
                title: 'Revision Completed',
                message: `${resolvedByName} has completed the requested revision`,
                link: `/dashboard/tasks/${revision.taskId}`,
                read: false,
                createdAt: new Date()
            });
        }
    } catch (error) {
        handleError(error, 'Failed to resolve task revision');
        throw error;
    }
}

/**
 * Get all revisions for a task
 * @param taskId - The ID of the task
 * @returns Array of TaskRevision objects
 */
export async function getTaskRevisions(taskId: string): Promise<TaskRevision[]> {
    try {
        const q = query(
            collection(db, 'taskRevisions'),
            where('taskId', '==', taskId),
            orderBy('requestedAt', 'desc')
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            requestedAt: timestampToDate(doc.data().requestedAt),
            resolvedAt: timestampToDate(doc.data().resolvedAt),
            rejectedAt: timestampToDate(doc.data().rejectedAt)
        })) as TaskRevision[];
    } catch (error) {
        handleError(error, 'Failed to fetch task revisions');
        throw error;
    }
}

/**
 * Get the count of revisions for a task
 * @param taskId - The ID of the task
 * @returns Number of revisions
 */
export async function getTaskRevisionCount(taskId: string): Promise<number> {
    try {
        const q = query(
            collection(db, 'taskRevisions'),
            where('taskId', '==', taskId)
        );

        const snapshot = await getDocs(q);
        return snapshot.size;
    } catch (error) {
        handleError(error, 'Failed to get task revision count');
        return 0;
    }
}

/**
 * Get pending revisions for a user
 * @param userId - The ID of the user
 * @returns Array of TaskRevision objects
 */
export async function getPendingRevisionsForUser(userId: string): Promise<TaskRevision[]> {
    try {
        // First, get all tasks assigned to this user
        const tasksQuery = query(
            collection(db, 'tasks'),
            where('assignedTo', 'array-contains', userId)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const taskIds = tasksSnapshot.docs.map(doc => doc.id);

        if (taskIds.length === 0) {
            return [];
        }

        // Get pending revisions for these tasks
        const revisionsQuery = query(
            collection(db, 'taskRevisions'),
            where('taskId', 'in', taskIds.slice(0, 10)), // Firestore 'in' limit is 10
            where('status', '==', 'pending'),
            orderBy('requestedAt', 'desc')
        );

        const snapshot = await getDocs(revisionsQuery);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            requestedAt: timestampToDate(doc.data().requestedAt),
            resolvedAt: timestampToDate(doc.data().resolvedAt),
            rejectedAt: timestampToDate(doc.data().rejectedAt)
        })) as TaskRevision[];
    } catch (error) {
        handleError(error, 'Failed to fetch pending revisions');
        throw error;
    }
}
