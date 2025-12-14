// src/lib/taskService.ts
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, limit, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Task, TaskStats } from '@/types';
import { timestampToDate, handleError } from './utils';

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
 * Update checklist item status
 */
export async function updateChecklistItem(): Promise<void> {
    // TODO: Implement checklist functionality with subcollections
    throw new Error('Checklist functionality not yet implemented');
}

/**
 * Add a checklist item to a task
 */
export async function addChecklistItem(): Promise<void> {
    // TODO: Implement checklist functionality with subcollections
    throw new Error('Checklist functionality not yet implemented');
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

