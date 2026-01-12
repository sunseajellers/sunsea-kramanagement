// src/lib/templateService.ts
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy, increment } from 'firebase/firestore';
import { db } from './firebase';
import { TaskTemplate, Task } from '@/types';
import { timestampToDate, handleError } from './utils';
import { createTask } from './taskService';

/**
 * Get all task templates (public + user's private templates)
 * @param userId - User ID to fetch templates for
 * @returns Array of TaskTemplate objects
 */
export async function getTaskTemplates(userId: string): Promise<TaskTemplate[]> {
    try {
        // Get public templates and user's private templates
        const publicQuery = query(
            collection(db, 'taskTemplates'),
            where('isPublic', '==', true),
            orderBy('usageCount', 'desc')
        );

        const privateQuery = query(
            collection(db, 'taskTemplates'),
            where('createdBy', '==', userId),
            orderBy('createdAt', 'desc')
        );

        const [publicSnap, privateSnap] = await Promise.all([
            getDocs(publicQuery),
            getDocs(privateQuery)
        ]);

        // Combine and deduplicate
        const templateMap = new Map<string, TaskTemplate>();

        [...publicSnap.docs, ...privateSnap.docs].forEach(doc => {
            if (!templateMap.has(doc.id)) {
                const data = doc.data();
                templateMap.set(doc.id, {
                    id: doc.id,
                    ...data,
                    createdAt: timestampToDate(data.createdAt),
                    updatedAt: timestampToDate(data.updatedAt)
                } as TaskTemplate);
            }
        });

        return Array.from(templateMap.values());
    } catch (error) {
        handleError(error, 'Failed to fetch task templates');
        throw error;
    }
}

/**
 * Create a new task template
 * @param templateData - Template data
 * @returns The ID of the created template
 */
export async function createTaskTemplate(templateData: Omit<TaskTemplate, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, 'taskTemplates'), {
            ...templateData,
            usageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        handleError(error, 'Failed to create task template');
        throw error;
    }
}

/**
 * Update a task template
 * @param templateId - Template ID
 * @param updates - Updates to apply
 */
export async function updateTaskTemplate(templateId: string, updates: Partial<TaskTemplate>): Promise<void> {
    try {
        const docRef = doc(db, 'taskTemplates', templateId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date()
        });
    } catch (error) {
        handleError(error, 'Failed to update task template');
        throw error;
    }
}

/**
 * Delete a task template
 * @param templateId - Template ID
 */
export async function deleteTaskTemplate(templateId: string): Promise<void> {
    try {
        const docRef = doc(db, 'taskTemplates', templateId);
        await deleteDoc(docRef);
    } catch (error) {
        handleError(error, 'Failed to delete task template');
        throw error;
    }
}

/**
 * Create a task from a template
 * @param templateId - Template ID
 * @param userId - User creating the task
 * @param overrides - Optional overrides for template defaults
 * @returns The ID of the created task
 */
export async function createTaskFromTemplate(
    templateId: string,
    userId: string,
    overrides?: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<string> {
    try {
        // Get the template
        const templateDoc = await getDocs(query(collection(db, 'taskTemplates'), where('__name__', '==', templateId)));
        if (templateDoc.empty) {
            throw new Error('Template not found');
        }

        const template = {
            id: templateDoc.docs[0].id,
            ...templateDoc.docs[0].data()
        } as TaskTemplate;

        // Calculate due date
        let dueDate = new Date();
        if (template.defaultDueDate) {
            dueDate.setDate(dueDate.getDate() + template.defaultDueDate);
        } else {
            dueDate.setDate(dueDate.getDate() + 7); // Default 7 days
        }

        // Create task from template
        const taskData: Omit<Task, 'id'> = {
            title: overrides?.title || template.templateTitle,
            description: overrides?.description || template.templateDescription,
            priority: overrides?.priority || template.priority,
            status: 'assigned',
            progress: 0,
            assignedTo: overrides?.assignedTo || template.defaultAssignees || [],
            assignedBy: userId,
            teamId: overrides?.teamId || template.teamId,
            dueDate: overrides?.dueDate || dueDate,
            attachments: overrides?.attachments || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const taskId = await createTask(taskData);

        // Increment template usage count
        const templateRef = doc(db, 'taskTemplates', templateId);
        await updateDoc(templateRef, {
            usageCount: increment(1)
        });

        return taskId;
    } catch (error) {
        handleError(error, 'Failed to create task from template');
        throw error;
    }
}

/**
 * Get popular templates (most used)
 * @param limit - Number of templates to return
 * @returns Array of popular TaskTemplate objects
 */
export async function getPopularTemplates(limit: number = 5): Promise<TaskTemplate[]> {
    try {
        const q = query(
            collection(db, 'taskTemplates'),
            where('isPublic', '==', true),
            orderBy('usageCount', 'desc'),
            // Note: Firestore limit is imported at the top
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.slice(0, limit).map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: timestampToDate(doc.data().createdAt),
            updatedAt: timestampToDate(doc.data().updatedAt)
        })) as TaskTemplate[];
    } catch (error) {
        handleError(error, 'Failed to fetch popular templates');
        throw error;
    }
}
