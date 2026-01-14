import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, limit, getDoc, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Task, TaskStats, ChecklistItem } from '@/types';
import { timestampToDate, handleError } from './utils';
import { authenticatedJsonFetch } from './apiClient';

/**
 * Verify a task (Admin action)
 */
export async function verifyTask(taskId: string, status: 'verified' | 'rejected', reason?: string): Promise<void> {
    try {
        const { auth } = await import('./firebase');
        const user = auth.currentUser;

        if (!user) {
            throw new Error('User not authenticated');
        }

        await authenticatedJsonFetch('/api/tasks/verify', {
            method: 'POST',
            headers: {
                'x-user-id': user.uid
            },
            body: JSON.stringify({ taskId, status, reason })
        });
    } catch (error) {
        handleError(error, 'Failed to verify task');
        throw error;
    }
}

/**
 * Fetch tasks assigned to a specific user.
 * Returns an array of Task objects.
 */
export async function getUserTasks(uid: string, maxResults: number = 50): Promise<Task[]> {
    try {
        const q = query(
            collection(db, 'tasks'),
            where('assignedTo', 'array-contains', uid),
            limit(maxResults)
        );
        const snap = await getDocs(q);
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
        handleError(error, 'Failed to fetch tasks');
        throw error;
    }
}

// Alias for compatibility
export const fetchTasksForUser = getUserTasks;

export async function createTask(taskData: Omit<Task, 'id'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, 'tasks'), taskData);
        return docRef.id;
    } catch (error) {
        handleError(error, 'Failed to create task');
        throw error;
    }
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
    try {
        const docRef = doc(db, 'tasks', taskId);
        await updateDoc(docRef, updates);
    } catch (error) {
        handleError(error, 'Failed to update task');
        throw error;
    }
}

export async function deleteTask(taskId: string): Promise<void> {
    try {
        const docRef = doc(db, 'tasks', taskId);
        await deleteDoc(docRef);
    } catch (error) {
        handleError(error, 'Failed to delete task');
        throw error;
    }
}

export async function getTaskStats(uid: string): Promise<TaskStats> {
    try {
        const tasks = await getUserTasks(uid);
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const inProgress = tasks.filter(t => t.status === 'in_progress').length;
        const pending = tasks.filter(t => t.status === 'assigned').length;

        return {
            total,
            completed,
            inProgress,
            pending,
            overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length
        };
    } catch (error) {
        handleError(error, 'Failed to fetch task stats');
        throw error;
    }
}

/**
 * Reassign a task to different users
 */
export async function reassignTask(
    taskId: string,
    newAssignees: string[],
    reassignedBy: string,
    reason?: string
): Promise<void> {
    try {
        const taskRef = doc(db, 'tasks', taskId);
        const taskSnap = await getDoc(taskRef);

        if (!taskSnap.exists()) {
            throw new Error('Task not found');
        }

        const task = taskSnap.data() as Task;

        // Add activity log entry to subcollection
        const activityLogRef = collection(db, 'tasks', taskId, 'activityLog');
        await addDoc(activityLogRef, {
            userId: reassignedBy,
            userName: 'User', // Should fetch from user service
            action: 'reassigned',
            details: `Reassigned from ${task.assignedTo.join(', ')} to ${newAssignees.join(', ')}${reason ? `: ${reason}` : ''}`,
            timestamp: new Date()
        });

        await updateDoc(taskRef, {
            assignedTo: newAssignees,
            updatedAt: new Date()
        });
    } catch (error) {
        handleError(error, 'Failed to reassign task');
        throw error;
    }
}

/**
 * Get all checklist items for a task
 * @param taskId - The ID of the task
 * @returns Array of ChecklistItem objects
 */
export async function getChecklistItems(taskId: string): Promise<ChecklistItem[]> {
    try {
        const checklistRef = collection(db, 'tasks', taskId, 'checklist');
        const q = query(checklistRef, orderBy('createdAt', 'asc'));
        const snap = await getDocs(q);

        return snap.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                taskId,
                text: data.text,
                completed: data.completed || false,
                completedBy: data.completedBy,
                completedAt: timestampToDate(data.completedAt),
                createdAt: timestampToDate(data.createdAt),
                updatedAt: timestampToDate(data.updatedAt)
            } as ChecklistItem;
        });
    } catch (error) {
        handleError(error, 'Failed to fetch checklist items');
        throw error;
    }
}

/**
 * Add a checklist item to a task
 * @param taskId - The ID of the task
 * @param text - The text of the checklist item
 * @param userId - The ID of the user adding the item
 * @returns The ID of the created checklist item
 */
export async function addChecklistItem(
    taskId: string,
    text: string,
    userId: string
): Promise<string> {
    try {
        const checklistRef = collection(db, 'tasks', taskId, 'checklist');
        const now = new Date();

        const docRef = await addDoc(checklistRef, {
            taskId,
            text,
            completed: false,
            createdAt: now,
            updatedAt: now
        });

        // Log activity
        const activityLogRef = collection(db, 'tasks', taskId, 'activityLog');
        await addDoc(activityLogRef, {
            userId,
            userName: 'User',
            action: 'checklist_added',
            details: `Added checklist item: "${text}"`,
            timestamp: now
        });

        return docRef.id;
    } catch (error) {
        handleError(error, 'Failed to add checklist item');
        throw error;
    }
}

/**
 * Update a checklist item (toggle completion or edit text)
 * @param taskId - The ID of the task
 * @param itemId - The ID of the checklist item
 * @param updates - The updates to apply
 * @param userId - The ID of the user making the update
 */
export async function updateChecklistItem(
    taskId: string,
    itemId: string,
    updates: { text?: string; completed?: boolean },
    userId: string
): Promise<void> {
    try {
        const itemRef = doc(db, 'tasks', taskId, 'checklist', itemId);
        const itemSnap = await getDoc(itemRef);

        if (!itemSnap.exists()) {
            throw new Error('Checklist item not found');
        }

        const now = new Date();
        const updateData: Record<string, unknown> = {
            ...updates,
            updatedAt: now
        };

        // If marking as completed, add completion metadata
        if (updates.completed === true) {
            updateData.completedBy = userId;
            updateData.completedAt = now;
        } else if (updates.completed === false) {
            updateData.completedBy = null;
            updateData.completedAt = null;
        }

        await updateDoc(itemRef, updateData);

        // Log activity
        const activityLogRef = collection(db, 'tasks', taskId, 'activityLog');
        const action = updates.completed !== undefined
            ? (updates.completed ? 'checklist_completed' : 'checklist_uncompleted')
            : 'checklist_updated';

        await addDoc(activityLogRef, {
            userId,
            userName: 'User',
            action,
            details: updates.completed !== undefined
                ? `${updates.completed ? 'Completed' : 'Uncompleted'} checklist item`
                : `Updated checklist item text`,
            timestamp: now
        });
    } catch (error) {
        handleError(error, 'Failed to update checklist item');
        throw error;
    }
}

/**
 * Delete a checklist item from a task
 * @param taskId - The ID of the task
 * @param itemId - The ID of the checklist item to delete
 * @param userId - The ID of the user deleting the item
 */
export async function deleteChecklistItem(
    taskId: string,
    itemId: string,
    userId: string
): Promise<void> {
    try {
        const itemRef = doc(db, 'tasks', taskId, 'checklist', itemId);
        const itemSnap = await getDoc(itemRef);

        if (!itemSnap.exists()) {
            throw new Error('Checklist item not found');
        }

        const itemData = itemSnap.data();
        await deleteDoc(itemRef);

        // Log activity
        const activityLogRef = collection(db, 'tasks', taskId, 'activityLog');
        await addDoc(activityLogRef, {
            userId,
            userName: 'User',
            action: 'checklist_deleted',
            details: `Deleted checklist item: "${itemData.text}"`,
            timestamp: new Date()
        });
    } catch (error) {
        handleError(error, 'Failed to delete checklist item');
        throw error;
    }
}

/**
 * Get all tasks (for managers/admins)
 */
export async function getAllTasks(maxResults: number = 100): Promise<Task[]> {
    try {
        const q = query(
            collection(db, 'tasks'),
            limit(maxResults)
        );
        const snap = await getDocs(q);
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
        handleError(error, 'Failed to fetch all tasks');
        throw error;
    }
}

/**
 * Get tasks by team
 */
export async function getTeamTasks(teamMemberIds: string[], maxResults: number = 100): Promise<Task[]> {
    try {
        // Firestore 'array-contains-any' supports up to 10 values
        // For larger teams, we need to batch the queries
        const batchSize = 10;
        const batches: string[][] = [];

        for (let i = 0; i < teamMemberIds.length; i += batchSize) {
            batches.push(teamMemberIds.slice(i, i + batchSize));
        }

        const allTasks: Task[] = [];

        for (const batch of batches) {
            const q = query(
                collection(db, 'tasks'),
                where('assignedTo', 'array-contains-any', batch),
                limit(maxResults)
            );
            const snap = await getDocs(q);
            const tasks = snap.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    dueDate: timestampToDate(data.dueDate),
                    createdAt: timestampToDate(data.createdAt),
                    updatedAt: timestampToDate(data.updatedAt)
                } as Task;
            });
            allTasks.push(...tasks);
        }

        // Remove duplicates
        const uniqueTasks = Array.from(
            new Map(allTasks.map(task => [task.id, task])).values()
        );

        return uniqueTasks;
    } catch (error) {
        handleError(error, 'Failed to fetch team tasks');
        throw error;
    }
}

